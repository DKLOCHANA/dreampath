// src/data/dataSyncService.ts
// Unified data sync service - handles local storage + Firestore sync
// Ensures data is available offline and synced across devices

import { Goal } from '@/domain/entities/Goal';
import { Task } from '@/domain/entities/Task';
import { auth } from '@/infrastructure/firebase/config';
import {
    // Goals
    saveGoal as saveGoalToFirestore,
    getGoals as getGoalsFromFirestore,
    deleteGoal as deleteGoalFromFirestore,
    // Tasks
    saveTask as saveTaskToFirestore,
    saveTasks as saveTasksToFirestore,
    getTasks as getTasksFromFirestore,
    updateTaskStatus as updateTaskStatusInFirestore,
    deleteTask as deleteTaskFromFirestore,
    // Batch metadata
    saveBatchMetadataToFirestore,
    getBatchMetadataFromFirestore,
    getAllBatchMetadataFromFirestore,
    deleteBatchMetadataFromFirestore,
    // Weekly patterns
    saveWeeklyPatternsToFirestore,
    getWeeklyPatternsFromFirestore,
    deleteWeeklyPatternsFromFirestore,
    // Wizard data
    saveWizardDataToFirestore,
    getWizardDataFromFirestore,
    deleteWizardDataFromFirestore,
} from '@/infrastructure/firebase/firestoreService';
import {
    saveGoalLocally,
    getGoalsLocally,
    deleteGoalLocally,
    saveTasksLocally,
    getTasksLocally,
    updateTaskStatusLocally,
    addTaskLocally,
    deleteTaskLocally,
    setCurrentUserId,
} from './localDataService';
import {
    saveBatchMetadata as saveBatchMetadataLocally,
    getBatchMetadata as getBatchMetadataLocally,
    deleteBatchMetadata as deleteBatchMetadataLocally,
    saveWeeklyPatterns as saveWeeklyPatternsLocally,
    getWeeklyPatterns as getWeeklyPatternsLocally,
    deleteWeeklyPatterns as deleteWeeklyPatternsLocally,
    saveWizardData as saveWizardDataLocally,
    getWizardData as getWizardDataLocally,
} from '@/services/taskBatchService';
import { BatchMetadata, GeneratedWeeklyPatterns } from '@/services/hybridTaskService';
import { GoalWizardData } from '@/presentation/components/goal/GoalWizard';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const SYNC_STATUS_KEY = '@dreampath_sync_status';
const LAST_SYNC_KEY = '@dreampath_last_sync';

interface SyncStatus {
    lastSyncTimestamp: number;
    pendingSync: boolean;
    syncErrors: string[];
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if user is authenticated
 */
const isAuthenticated = (): boolean => {
    return !!auth.currentUser;
};

/**
 * Get current user ID
 */
const getCurrentUserId = (): string | null => {
    return auth.currentUser?.uid || null;
};

/**
 * Save sync status
 */
const saveSyncStatus = async (status: Partial<SyncStatus>): Promise<void> => {
    try {
        const existing = await getSyncStatus();
        const updated = { ...existing, ...status };
        await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('[DataSync] Error saving sync status:', error);
    }
};

/**
 * Get sync status
 */
const getSyncStatus = async (): Promise<SyncStatus> => {
    try {
        const data = await AsyncStorage.getItem(SYNC_STATUS_KEY);
        return data ? JSON.parse(data) : {
            lastSyncTimestamp: 0,
            pendingSync: false,
            syncErrors: [],
        };
    } catch (error) {
        return { lastSyncTimestamp: 0, pendingSync: false, syncErrors: [] };
    }
};

// ═══════════════════════════════════════════════════════════════
// GOALS - UNIFIED SAVE/GET WITH SYNC
// ═══════════════════════════════════════════════════════════════

/**
 * Save a goal - saves locally first, then syncs to Firestore
 */
export const saveGoal = async (goal: Goal): Promise<void> => {
    console.log('[DataSync] Saving goal:', goal.id);
    
    // Always save locally first (for offline support)
    await saveGoalLocally(goal);
    
    // Sync to Firestore if authenticated
    if (isAuthenticated()) {
        try {
            await saveGoalToFirestore(goal);
            console.log('[DataSync] Goal synced to Firestore:', goal.id);
        } catch (error) {
            console.error('[DataSync] Failed to sync goal to Firestore:', error);
            await saveSyncStatus({ pendingSync: true });
        }
    }
};

/**
 * Get all goals - fetches from local and optionally syncs with Firestore
 */
export const getGoals = async (forceSync: boolean = false): Promise<Goal[]> => {
    const userId = getCurrentUserId();
    
    // If authenticated and forceSync, fetch from Firestore
    if (isAuthenticated() && userId && forceSync) {
        try {
            const firestoreGoals = await getGoalsFromFirestore(userId);
            
            // Merge with local goals (Firestore takes precedence for same IDs)
            const localGoals = await getGoalsLocally();
            const mergedGoals = mergeGoals(localGoals, firestoreGoals);
            
            // Save merged goals locally
            for (const goal of mergedGoals) {
                await saveGoalLocally(goal);
            }
            
            console.log('[DataSync] Goals synced:', mergedGoals.length);
            return mergedGoals;
        } catch (error) {
            console.error('[DataSync] Failed to fetch from Firestore, using local:', error);
        }
    }
    
    // Return local goals
    return getGoalsLocally();
};

/**
 * Delete a goal - deletes from both local and Firestore
 */
export const deleteGoal = async (goalId: string): Promise<void> => {
    console.log('[DataSync] Deleting goal:', goalId);
    
    // Delete locally first
    await deleteGoalLocally(goalId);
    
    // Delete from Firestore if authenticated
    if (isAuthenticated()) {
        try {
            await deleteGoalFromFirestore(goalId);
            
            // Also delete related batch data from Firestore
            const userId = getCurrentUserId();
            if (userId) {
                await Promise.all([
                    deleteBatchMetadataFromFirestore(userId, goalId),
                    deleteWeeklyPatternsFromFirestore(userId, goalId),
                    deleteWizardDataFromFirestore(userId, goalId),
                ]);
            }
            
            console.log('[DataSync] Goal deleted from Firestore:', goalId);
        } catch (error) {
            console.error('[DataSync] Failed to delete from Firestore:', error);
            await saveSyncStatus({ pendingSync: true });
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// TASKS - UNIFIED SAVE/GET WITH SYNC
// ═══════════════════════════════════════════════════════════════

/**
 * Save tasks - saves locally first, then syncs to Firestore
 */
export const saveTasks = async (tasks: Task[]): Promise<void> => {
    console.log('[DataSync] Saving tasks:', tasks.length);
    
    // Always save locally first
    await saveTasksLocally(tasks);
    
    // Sync to Firestore if authenticated
    if (isAuthenticated()) {
        try {
            await saveTasksToFirestore(tasks);
            console.log('[DataSync] Tasks synced to Firestore:', tasks.length);
        } catch (error) {
            console.error('[DataSync] Failed to sync tasks to Firestore:', error);
            await saveSyncStatus({ pendingSync: true });
        }
    }
};

/**
 * Get all tasks - fetches from local and optionally syncs with Firestore
 */
export const getTasks = async (forceSync: boolean = false): Promise<Task[]> => {
    const userId = getCurrentUserId();
    
    // If authenticated and forceSync, fetch from Firestore
    if (isAuthenticated() && userId && forceSync) {
        try {
            const firestoreTasks = await getTasksFromFirestore(userId);
            
            // Merge with local tasks
            const localTasks = await getTasksLocally();
            const mergedTasks = mergeTasks(localTasks, firestoreTasks);
            
            // Save merged tasks locally
            await saveTasksLocally(mergedTasks);
            
            console.log('[DataSync] Tasks synced:', mergedTasks.length);
            return mergedTasks;
        } catch (error) {
            console.error('[DataSync] Failed to fetch tasks from Firestore:', error);
        }
    }
    
    // Return local tasks
    return getTasksLocally();
};

/**
 * Update task status - updates both local and Firestore
 */
export const updateTaskStatus = async (taskId: string, status: Task['status']): Promise<void> => {
    console.log('[DataSync] Updating task status:', taskId, status);
    
    // Update locally first
    await updateTaskStatusLocally(taskId, status);
    
    // Sync to Firestore if authenticated
    if (isAuthenticated()) {
        try {
            await updateTaskStatusInFirestore(taskId, status);
        } catch (error) {
            console.error('[DataSync] Failed to update task in Firestore:', error);
            await saveSyncStatus({ pendingSync: true });
        }
    }
};

/**
 * Add a single task - saves locally first, then syncs to Firestore
 */
export const addTask = async (task: Task): Promise<void> => {
    console.log('[DataSync] Adding task:', task.id);
    
    // Add locally first (for offline support)
    await addTaskLocally(task);
    
    // Sync to Firestore if authenticated
    if (isAuthenticated()) {
        try {
            await saveTaskToFirestore(task);
            console.log('[DataSync] Task synced to Firestore:', task.id);
        } catch (error) {
            console.error('[DataSync] Failed to sync task to Firestore:', error);
            await saveSyncStatus({ pendingSync: true });
        }
    }
};

/**
 * Delete a task - deletes from both local and Firestore
 */
export const deleteTask = async (taskId: string): Promise<void> => {
    console.log('[DataSync] Deleting task:', taskId);
    
    // Delete locally
    await deleteTaskLocally(taskId);
    
    // Delete from Firestore if authenticated
    if (isAuthenticated()) {
        try {
            await deleteTaskFromFirestore(taskId);
        } catch (error) {
            console.error('[DataSync] Failed to delete task from Firestore:', error);
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// BATCH METADATA - UNIFIED SAVE/GET WITH SYNC
// ═══════════════════════════════════════════════════════════════

/**
 * Save batch metadata - saves locally and to Firestore
 */
export const saveBatchMetadata = async (
    goalId: string,
    metadata: BatchMetadata
): Promise<void> => {
    console.log('[DataSync] Saving batch metadata:', goalId);
    
    // Save locally
    await saveBatchMetadataLocally(goalId, metadata);
    
    // Save to Firestore if authenticated
    const userId = getCurrentUserId();
    if (isAuthenticated() && userId) {
        try {
            await saveBatchMetadataToFirestore(userId, goalId, metadata);
        } catch (error) {
            console.error('[DataSync] Failed to sync batch metadata:', error);
        }
    }
};

/**
 * Get batch metadata - fetches from local, syncs with Firestore if needed
 */
export const getBatchMetadata = async (
    goalId: string,
    forceSync: boolean = false
): Promise<BatchMetadata | null> => {
    const userId = getCurrentUserId();
    
    // Try to get from Firestore if authenticated and forceSync
    if (isAuthenticated() && userId && forceSync) {
        try {
            const firestoreMetadata = await getBatchMetadataFromFirestore(userId, goalId);
            if (firestoreMetadata) {
                // Save to local
                await saveBatchMetadataLocally(goalId, firestoreMetadata);
                return firestoreMetadata;
            }
        } catch (error) {
            console.error('[DataSync] Failed to fetch batch metadata from Firestore:', error);
        }
    }
    
    return getBatchMetadataLocally(goalId);
};

// ═══════════════════════════════════════════════════════════════
// WEEKLY PATTERNS - UNIFIED SAVE/GET WITH SYNC
// ═══════════════════════════════════════════════════════════════

/**
 * Save weekly patterns - saves locally and to Firestore
 */
export const saveWeeklyPatterns = async (
    goalId: string,
    patterns: GeneratedWeeklyPatterns
): Promise<void> => {
    console.log('[DataSync] Saving weekly patterns:', goalId);
    
    // Save locally
    await saveWeeklyPatternsLocally(goalId, patterns);
    
    // Save to Firestore if authenticated
    const userId = getCurrentUserId();
    if (isAuthenticated() && userId) {
        try {
            await saveWeeklyPatternsToFirestore(userId, goalId, patterns);
        } catch (error) {
            console.error('[DataSync] Failed to sync weekly patterns:', error);
        }
    }
};

/**
 * Get weekly patterns - fetches from local, syncs with Firestore if needed
 */
export const getWeeklyPatterns = async (
    goalId: string,
    forceSync: boolean = false
): Promise<GeneratedWeeklyPatterns | null> => {
    const userId = getCurrentUserId();
    
    // Try to get from Firestore if authenticated and forceSync
    if (isAuthenticated() && userId && forceSync) {
        try {
            const firestorePatterns = await getWeeklyPatternsFromFirestore(userId, goalId);
            if (firestorePatterns) {
                // Save to local
                await saveWeeklyPatternsLocally(goalId, firestorePatterns);
                return firestorePatterns;
            }
        } catch (error) {
            console.error('[DataSync] Failed to fetch weekly patterns from Firestore:', error);
        }
    }
    
    return getWeeklyPatternsLocally(goalId);
};

// ═══════════════════════════════════════════════════════════════
// WIZARD DATA - UNIFIED SAVE/GET WITH SYNC
// ═══════════════════════════════════════════════════════════════

/**
 * Save wizard data - saves locally and to Firestore
 */
export const saveWizardData = async (
    goalId: string,
    wizardData: GoalWizardData
): Promise<void> => {
    console.log('[DataSync] Saving wizard data:', goalId);
    
    // Save locally
    await saveWizardDataLocally(goalId, wizardData);
    
    // Save to Firestore if authenticated
    const userId = getCurrentUserId();
    if (isAuthenticated() && userId) {
        try {
            await saveWizardDataToFirestore(userId, goalId, wizardData);
        } catch (error) {
            console.error('[DataSync] Failed to sync wizard data:', error);
        }
    }
};

/**
 * Get wizard data - fetches from local, syncs with Firestore if needed
 */
export const getWizardData = async (
    goalId: string,
    forceSync: boolean = false
): Promise<GoalWizardData | null> => {
    const userId = getCurrentUserId();
    
    // Try to get from Firestore if authenticated and forceSync
    if (isAuthenticated() && userId && forceSync) {
        try {
            const firestoreData = await getWizardDataFromFirestore(userId, goalId);
            if (firestoreData) {
                // Save to local
                await saveWizardDataLocally(goalId, firestoreData);
                return firestoreData;
            }
        } catch (error) {
            console.error('[DataSync] Failed to fetch wizard data from Firestore:', error);
        }
    }
    
    return getWizardDataLocally(goalId);
};

// ═══════════════════════════════════════════════════════════════
// FULL SYNC - SYNC ALL DATA ON LOGIN
// ═══════════════════════════════════════════════════════════════

/**
 * Full sync from Firestore to local storage
 * Call this when user logs in or switches devices
 */
export const syncFromFirestore = async (): Promise<{
    goals: number;
    tasks: number;
    success: boolean;
}> => {
    const userId = getCurrentUserId();
    
    if (!isAuthenticated() || !userId) {
        console.log('[DataSync] Not authenticated, skipping sync');
        return { goals: 0, tasks: 0, success: false };
    }

    console.log('[DataSync] Starting full sync from Firestore...');
    
    try {
        // Set the current user ID for local storage
        setCurrentUserId(userId);
        
        // Fetch all data from Firestore
        const [firestoreGoals, firestoreTasks, allBatchMetadata] = await Promise.all([
            getGoalsFromFirestore(userId),
            getTasksFromFirestore(userId),
            getAllBatchMetadataFromFirestore(userId),
        ]);

        // Get local data
        const [localGoals, localTasks] = await Promise.all([
            getGoalsLocally(),
            getTasksLocally(),
        ]);

        // Merge data (Firestore takes precedence based on updatedAt)
        const mergedGoals = mergeGoals(localGoals, firestoreGoals);
        const mergedTasks = mergeTasks(localTasks, firestoreTasks);

        // Save merged data locally
        for (const goal of mergedGoals) {
            await saveGoalLocally(goal);
        }
        await saveTasksLocally(mergedTasks);

        // Sync batch metadata
        for (const metadata of allBatchMetadata) {
            await saveBatchMetadataLocally(metadata.goalId, metadata);
            
            // Also fetch and save weekly patterns and wizard data for each goal
            const [patterns, wizardData] = await Promise.all([
                getWeeklyPatternsFromFirestore(userId, metadata.goalId),
                getWizardDataFromFirestore(userId, metadata.goalId),
            ]);
            
            if (patterns) {
                await saveWeeklyPatternsLocally(metadata.goalId, patterns);
            }
            if (wizardData) {
                await saveWizardDataLocally(metadata.goalId, wizardData);
            }
        }

        // Update sync status
        await saveSyncStatus({
            lastSyncTimestamp: Date.now(),
            pendingSync: false,
            syncErrors: [],
        });

        console.log('[DataSync] Full sync complete:', {
            goals: mergedGoals.length,
            tasks: mergedTasks.length,
        });

        return {
            goals: mergedGoals.length,
            tasks: mergedTasks.length,
            success: true,
        };
    } catch (error: any) {
        console.error('[DataSync] Full sync failed:', error);
        await saveSyncStatus({
            syncErrors: [error.message],
        });
        return { goals: 0, tasks: 0, success: false };
    }
};

/**
 * Push all local data to Firestore
 * Call this to ensure all local data is backed up
 */
export const syncToFirestore = async (): Promise<{
    goals: number;
    tasks: number;
    success: boolean;
}> => {
    const userId = getCurrentUserId();
    
    if (!isAuthenticated() || !userId) {
        console.log('[DataSync] Not authenticated, skipping push');
        return { goals: 0, tasks: 0, success: false };
    }

    console.log('[DataSync] Pushing local data to Firestore...');
    
    try {
        // Get all local data
        const [localGoals, localTasks] = await Promise.all([
            getGoalsLocally(),
            getTasksLocally(),
        ]);

        // Push goals to Firestore
        for (const goal of localGoals) {
            await saveGoalToFirestore({
                ...goal,
                userId, // Ensure userId is set
            });
            
            // Also sync batch data for this goal
            const [batchMetadata, patterns, wizardData] = await Promise.all([
                getBatchMetadataLocally(goal.id),
                getWeeklyPatternsLocally(goal.id),
                getWizardDataLocally(goal.id),
            ]);
            
            if (batchMetadata) {
                await saveBatchMetadataToFirestore(userId, goal.id, batchMetadata);
            }
            if (patterns) {
                await saveWeeklyPatternsToFirestore(userId, goal.id, patterns);
            }
            if (wizardData) {
                await saveWizardDataToFirestore(userId, goal.id, wizardData);
            }
        }

        // Push tasks to Firestore
        if (localTasks.length > 0) {
            // Update userId on all tasks
            const tasksWithUserId = localTasks.map(t => ({ ...t, userId }));
            await saveTasksToFirestore(tasksWithUserId);
        }

        // Update sync status
        await saveSyncStatus({
            lastSyncTimestamp: Date.now(),
            pendingSync: false,
            syncErrors: [],
        });

        console.log('[DataSync] Push to Firestore complete:', {
            goals: localGoals.length,
            tasks: localTasks.length,
        });

        return {
            goals: localGoals.length,
            tasks: localTasks.length,
            success: true,
        };
    } catch (error: any) {
        console.error('[DataSync] Push to Firestore failed:', error);
        await saveSyncStatus({
            syncErrors: [error.message],
        });
        return { goals: 0, tasks: 0, success: false };
    }
};

// ═══════════════════════════════════════════════════════════════
// MERGE UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Merge local and Firestore goals
 * Uses updatedAt timestamp to determine which version to keep
 */
function mergeGoals(localGoals: Goal[], firestoreGoals: Goal[]): Goal[] {
    const goalMap = new Map<string, Goal>();
    
    // Add local goals first
    for (const goal of localGoals) {
        goalMap.set(goal.id, goal);
    }
    
    // Merge with Firestore goals (Firestore wins if newer)
    for (const firestoreGoal of firestoreGoals) {
        const localGoal = goalMap.get(firestoreGoal.id);
        
        if (!localGoal) {
            // Goal doesn't exist locally, add it
            goalMap.set(firestoreGoal.id, firestoreGoal);
        } else {
            // Compare timestamps and keep newer version
            const localTime = new Date(localGoal.updatedAt).getTime();
            const firestoreTime = new Date(firestoreGoal.updatedAt).getTime();
            
            if (firestoreTime >= localTime) {
                goalMap.set(firestoreGoal.id, firestoreGoal);
            }
        }
    }
    
    return Array.from(goalMap.values());
}

/**
 * Merge local and Firestore tasks
 * Uses updatedAt timestamp to determine which version to keep
 */
function mergeTasks(localTasks: Task[], firestoreTasks: Task[]): Task[] {
    const taskMap = new Map<string, Task>();
    
    // Add local tasks first
    for (const task of localTasks) {
        taskMap.set(task.id, task);
    }
    
    // Merge with Firestore tasks (Firestore wins if newer)
    for (const firestoreTask of firestoreTasks) {
        const localTask = taskMap.get(firestoreTask.id);
        
        if (!localTask) {
            // Task doesn't exist locally, add it
            taskMap.set(firestoreTask.id, firestoreTask);
        } else {
            // Compare timestamps and keep newer version
            const localTime = new Date(localTask.updatedAt).getTime();
            const firestoreTime = new Date(firestoreTask.updatedAt).getTime();
            
            if (firestoreTime >= localTime) {
                taskMap.set(firestoreTask.id, firestoreTask);
            }
        }
    }
    
    return Array.from(taskMap.values());
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    // Goals
    saveGoal,
    getGoals,
    deleteGoal,
    // Tasks
    saveTasks,
    getTasks,
    updateTaskStatus,
    deleteTask,
    // Batch metadata
    saveBatchMetadata,
    getBatchMetadata,
    // Weekly patterns
    saveWeeklyPatterns,
    getWeeklyPatterns,
    // Wizard data
    saveWizardData,
    getWizardData,
    // Full sync
    syncFromFirestore,
    syncToFirestore,
    // Status
    getSyncStatus,
    isAuthenticated,
    getCurrentUserId,
};
