// src/presentation/hooks/useTaskBatchManager.ts
// Hook to manage automatic task batch generation for long-duration goals
// Checks and generates more tasks as user makes progress

import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Goal } from '@/domain/entities/Goal';
import { Task } from '@/domain/entities/Task';
import { 
    getTasks, 
    saveTasks, 
    getGoals, 
    saveGoal 
} from '@/data/dataSyncService';
import { 
    checkAndGenerateNextBatchWithSync, 
    getBatchMetadata,
    getBatchProgress
} from '@/services/taskBatchService';

interface UseTaskBatchManagerOptions {
    /** Whether to automatically check on app foreground */
    autoCheckOnForeground?: boolean;
    /** Callback when new tasks are generated */
    onNewTasksGenerated?: (tasks: Task[], goalId: string) => void;
    /** Callback when batch generation is complete for a goal */
    onBatchComplete?: (goalId: string) => void;
}

interface TaskBatchManagerResult {
    /** Manually trigger batch check for a specific goal */
    checkGoalForNewTasks: (goal: Goal) => Promise<Task[]>;
    /** Check all goals for batch generation */
    checkAllGoals: () => Promise<void>;
    /** Get batch progress for a goal */
    getProgress: (goalId: string) => Promise<{
        totalDays: number;
        generatedDays: number;
        remainingDays: number;
        progressPercent: number;
    } | null>;
}

/**
 * Hook to manage automatic task batch generation
 * 
 * Features:
 * - Automatically checks for batch generation on app foreground
 * - Generates next batch when user completes ~70% of current tasks
 * - Provides manual trigger functions
 * 
 * @example
 * ```tsx
 * const { checkGoalForNewTasks } = useTaskBatchManager({
 *   onNewTasksGenerated: (tasks, goalId) => {
 *     console.log(`Generated ${tasks.length} new tasks for goal ${goalId}`);
 *     // Refresh your task list
 *   }
 * });
 * ```
 */
export function useTaskBatchManager(
    options: UseTaskBatchManagerOptions = {}
): TaskBatchManagerResult {
    const { 
        autoCheckOnForeground = true,
        onNewTasksGenerated,
        onBatchComplete
    } = options;

    const appState = useRef(AppState.currentState);
    const lastCheckRef = useRef<number>(0);
    const isCheckingRef = useRef(false);

    // Minimum time between auto-checks (5 minutes)
    const MIN_CHECK_INTERVAL = 5 * 60 * 1000;

    /**
     * Check a specific goal for batch generation
     */
    const checkGoalForNewTasks = useCallback(async (goal: Goal): Promise<Task[]> => {
        try {
            // Get current tasks for this goal
            const allTasks = await getTasks();
            const goalTasks = allTasks.filter(t => t.goalId === goal.id);
            const completedTasks = goalTasks.filter(t => 
                t.status === 'COMPLETED' || t.status === 'SKIPPED'
            );

            console.log('[TaskBatchManager] Checking goal:', goal.id);
            console.log('[TaskBatchManager] Tasks:', goalTasks.length, 'Completed:', completedTasks.length);

            const result = await checkAndGenerateNextBatchWithSync(
                goal,
                completedTasks.length,
                goalTasks.length
            );

            if (!result) {
                console.log('[TaskBatchManager] No batch generation needed');
                return [];
            }

            if (result.isComplete) {
                console.log('[TaskBatchManager] Batch generation complete for goal:', goal.id);
                onBatchComplete?.(goal.id);
                return [];
            }

            if (result.newTasks.length > 0) {
                console.log('[TaskBatchManager] Generated', result.newTasks.length, 'new tasks');
                
                // Save new tasks (with Firestore sync)
                await saveTasks(result.newTasks);
                
                // Update goal metrics
                const updatedTaskCount = goalTasks.length + result.newTasks.length;
                const updatedGoal = {
                    ...goal,
                    metrics: {
                        ...goal.metrics,
                        totalTasks: updatedTaskCount,
                    },
                    updatedAt: new Date(),
                };
                await saveGoal(updatedGoal);
                
                onNewTasksGenerated?.(result.newTasks, goal.id);
                return result.newTasks;
            }

            return [];
        } catch (error) {
            console.error('[TaskBatchManager] Error checking goal:', error);
            return [];
        }
    }, [onNewTasksGenerated, onBatchComplete]);

    /**
     * Check all active goals for batch generation
     */
    const checkAllGoals = useCallback(async (): Promise<void> => {
        // Prevent concurrent checks
        if (isCheckingRef.current) {
            console.log('[TaskBatchManager] Check already in progress, skipping');
            return;
        }

        // Throttle checks
        const now = Date.now();
        if (now - lastCheckRef.current < MIN_CHECK_INTERVAL) {
            console.log('[TaskBatchManager] Too soon since last check, skipping');
            return;
        }

        isCheckingRef.current = true;
        lastCheckRef.current = now;

        try {
            console.log('[TaskBatchManager] Checking all goals for batch generation...');
            
            const goals = await getGoals();
            const activeGoals = goals.filter(g => g.status === 'ACTIVE');

            for (const goal of activeGoals) {
                // Check if this goal has batch metadata (uses hybrid approach)
                const metadata = await getBatchMetadata(goal.id);
                if (metadata) {
                    await checkGoalForNewTasks(goal);
                }
            }

            console.log('[TaskBatchManager] Finished checking', activeGoals.length, 'goals');
        } catch (error) {
            console.error('[TaskBatchManager] Error checking all goals:', error);
        } finally {
            isCheckingRef.current = false;
        }
    }, [checkGoalForNewTasks]);

    /**
     * Get batch progress for a goal
     */
    const getProgress = useCallback(async (goalId: string) => {
        return getBatchProgress(goalId);
    }, []);

    // Auto-check on app foreground
    useEffect(() => {
        if (!autoCheckOnForeground) return;

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('[TaskBatchManager] App came to foreground, checking batches...');
                checkAllGoals();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [autoCheckOnForeground, checkAllGoals]);

    // Initial check on mount
    useEffect(() => {
        if (autoCheckOnForeground) {
            // Slight delay to avoid blocking initial render
            const timer = setTimeout(() => {
                checkAllGoals();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [autoCheckOnForeground, checkAllGoals]);

    return {
        checkGoalForNewTasks,
        checkAllGoals,
        getProgress,
    };
}

export default useTaskBatchManager;
