// src/data/localDataService.ts
// Local data service for offline storage and user data

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, GoalCategory, GoalStatus, GoalPriority } from '@/domain/entities/Goal';
import { Task } from '@/domain/entities/Task';
import { User } from '@/domain/entities/User';

// Current user ID for user-specific storage
let currentUserId: string | null = null;

// Set the current user ID (call this on login)
export const setCurrentUserId = (userId: string | null): void => {
    currentUserId = userId;
    console.log('[LocalDataService] Current user ID set:', userId);
};

// Get the current user ID
export const getCurrentUserId = (): string | null => currentUserId;

// Generate user-specific storage key
const getUserKey = (baseKey: string, userId?: string): string => {
    const uid = userId || currentUserId;
    if (!uid) {
        console.warn('[LocalDataService] No user ID set, using base key');
        return baseKey;
    }
    return `${baseKey}_${uid}`;
};

const STORAGE_KEYS = {
    USER_PROFILE: '@dreampath_user_profile',
    ONBOARDING_DATA: '@dreampath_onboarding_data',
    GOALS: '@dreampath_goals',
    TASKS: '@dreampath_tasks',
    PROFILE_IMAGE: '@dreampath_profile_image',
    AI_INSIGHTS: '@dreampath_ai_insights',
    AI_INSIGHTS_TIMESTAMP: '@dreampath_ai_insights_timestamp',
};

// ============================================
// Onboarding Data
// ============================================

export interface LocalOnboardingData {
    goalCategory: GoalCategory | '';
    goalTitle: string;
    goalDescription: string;
    age: string;
    occupation: string;
    dailyHours: string;
    monthlyBudget: string;
    experienceLevel: string;
    challenges: string[];
    customChallenge: string;
}

export const saveOnboardingDataLocally = async (data: LocalOnboardingData): Promise<void> => {
    try {
        const key = getUserKey(STORAGE_KEYS.ONBOARDING_DATA);
        await AsyncStorage.setItem(key, JSON.stringify(data));
        console.log('[LocalDataService] Onboarding data saved locally');
    } catch (error) {
        console.error('[LocalDataService] Error saving onboarding data:', error);
        throw error;
    }
};

export const getOnboardingDataLocally = async (): Promise<LocalOnboardingData | null> => {
    try {
        const key = getUserKey(STORAGE_KEYS.ONBOARDING_DATA);
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('[LocalDataService] Error getting onboarding data:', error);
        return null;
    }
};

// ============================================
// User Profile
// ============================================

export const saveUserProfileLocally = async (userId: string, profileData: Partial<User>): Promise<void> => {
    try {
        const key = getUserKey(STORAGE_KEYS.USER_PROFILE, userId);
        const existingData = await AsyncStorage.getItem(key);
        const existing = existingData ? JSON.parse(existingData) : {};
        
        const updated = {
            ...existing,
            ...profileData,
            id: userId,
            updatedAt: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(key, JSON.stringify(updated));
        console.log('[LocalDataService] User profile saved locally');
    } catch (error) {
        console.error('[LocalDataService] Error saving user profile:', error);
        throw error;
    }
};

export const getUserProfileLocally = async (): Promise<Partial<User> | null> => {
    try {
        const key = getUserKey(STORAGE_KEYS.USER_PROFILE);
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('[LocalDataService] Error getting user profile:', error);
        return null;
    }
};

// ============================================
// Goals
// ============================================

export const saveGoalLocally = async (goal: Goal): Promise<void> => {
    try {
        const key = getUserKey(STORAGE_KEYS.GOALS);
        const existingData = await AsyncStorage.getItem(key);
        const goals: Goal[] = existingData ? JSON.parse(existingData) : [];
        
        // Check if goal exists, update or add
        const index = goals.findIndex(g => g.id === goal.id);
        if (index >= 0) {
            goals[index] = goal;
        } else {
            goals.push(goal);
        }
        
        await AsyncStorage.setItem(key, JSON.stringify(goals));
        console.log('[LocalDataService] Goal saved locally:', goal.id);
    } catch (error) {
        console.error('[LocalDataService] Error saving goal:', error);
        throw error;
    }
};

export const getGoalsLocally = async (): Promise<Goal[]> => {
    try {
        const key = getUserKey(STORAGE_KEYS.GOALS);
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[LocalDataService] Error getting goals:', error);
        return [];
    }
};

export const deleteGoalLocally = async (goalId: string): Promise<void> => {
    try {
        const key = getUserKey(STORAGE_KEYS.GOALS);
        const existingData = await AsyncStorage.getItem(key);
        const goals: Goal[] = existingData ? JSON.parse(existingData) : [];
        const filtered = goals.filter(g => g.id !== goalId);
        await AsyncStorage.setItem(key, JSON.stringify(filtered));
        console.log('[LocalDataService] Goal deleted locally:', goalId);
        
        // Clean up batch data for this goal
        try {
            const { cleanupGoalBatchData } = await import('@/services/taskBatchService');
            await cleanupGoalBatchData(goalId);
        } catch (batchError) {
            console.warn('[LocalDataService] Could not clean up batch data:', batchError);
        }
    } catch (error) {
        console.error('[LocalDataService] Error deleting goal:', error);
        throw error;
    }
};

// ============================================
// Tasks
// ============================================

export const saveTasksLocally = async (tasks: Task[]): Promise<void> => {
    try {
        const key = getUserKey(STORAGE_KEYS.TASKS);
        const existingData = await AsyncStorage.getItem(key);
        const existingTasks: Task[] = existingData ? JSON.parse(existingData) : [];
        
        // Merge tasks (update existing, add new)
        const taskMap = new Map(existingTasks.map(t => [t.id, t]));
        tasks.forEach(task => taskMap.set(task.id, task));
        
        await AsyncStorage.setItem(key, JSON.stringify(Array.from(taskMap.values())));
        console.log('[LocalDataService] Tasks saved locally:', tasks.length);
    } catch (error) {
        console.error('[LocalDataService] Error saving tasks:', error);
        throw error;
    }
};

export const getTasksLocally = async (): Promise<Task[]> => {
    try {
        const key = getUserKey(STORAGE_KEYS.TASKS);
        const data = await AsyncStorage.getItem(key);
        if (!data) return [];
        const tasks = JSON.parse(data);
        // Convert date strings back to Date objects
        return tasks.map((task: any) => ({
            ...task,
            scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : new Date(),
            createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
            updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
        }));
    } catch (error) {
        console.error('[LocalDataService] Error getting tasks:', error);
        return [];
    }
};

export const updateTaskStatusLocally = async (taskId: string, status: Task['status']): Promise<void> => {
    try {
        const key = getUserKey(STORAGE_KEYS.TASKS);
        const tasks = await getTasksLocally();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index >= 0) {
            tasks[index].status = status;
            tasks[index].updatedAt = new Date();
            if (status === 'COMPLETED') {
                tasks[index].completedAt = new Date();
            }
            await AsyncStorage.setItem(key, JSON.stringify(tasks));
            console.log('[LocalDataService] Task status updated:', taskId, status);
        }
    } catch (error) {
        console.error('[LocalDataService] Error updating task status:', error);
        throw error;
    }
};

export const addTaskLocally = async (task: Task): Promise<void> => {
    try {
        const key = getUserKey(STORAGE_KEYS.TASKS);
        const existingTasks = await getTasksLocally();
        existingTasks.push(task);
        await AsyncStorage.setItem(key, JSON.stringify(existingTasks));
        console.log('[LocalDataService] Task added locally:', task.id);
    } catch (error) {
        console.error('[LocalDataService] Error adding task:', error);
        throw error;
    }
};

export const deleteTaskLocally = async (taskId: string): Promise<void> => {
    try {
        const key = getUserKey(STORAGE_KEYS.TASKS);
        const tasks = await getTasksLocally();
        const filtered = tasks.filter(t => t.id !== taskId);
        await AsyncStorage.setItem(key, JSON.stringify(filtered));
        console.log('[LocalDataService] Task deleted locally:', taskId);
    } catch (error) {
        console.error('[LocalDataService] Error deleting task:', error);
        throw error;
    }
};

export const deleteTasksByGoalLocally = async (goalId: string): Promise<number> => {
    try {
        const key = getUserKey(STORAGE_KEYS.TASKS);
        const tasks = await getTasksLocally();
        const filtered = tasks.filter(t => t.goalId !== goalId);
        const deletedCount = tasks.length - filtered.length;
        await AsyncStorage.setItem(key, JSON.stringify(filtered));
        console.log(`[LocalDataService] Deleted ${deletedCount} tasks for goal:`, goalId);
        return deletedCount;
    } catch (error) {
        console.error('[LocalDataService] Error deleting tasks for goal:', error);
        throw error;
    }
};

// ============================================
// Create Goal from Wizard Data
// ============================================

export const createGoalFromWizard = (
    userId: string,
    category: GoalCategory,
    title: string,
    description: string,
    priority: GoalPriority = 'MEDIUM' as GoalPriority,
    startDate: Date = new Date(),
    targetDate?: Date
): Goal => {
    const goalId = `goal-${Date.now()}`;
    const target = targetDate || new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

    return {
        id: goalId,
        userId,
        title,
        description,
        category,
        status: 'ACTIVE' as GoalStatus,
        priority,
        startDate,
        targetDate: target,
        milestones: [],
        metrics: {
            totalTasks: 0,
            completedTasks: 0,
            currentStreak: 0,
            longestStreak: 0,
            completionPercentage: 0,
        },
        tags: [category.toLowerCase()],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};

// ============================================
// Complete Onboarding (Local Mode)
// ============================================

export const completeOnboardingLocally = async (
    userId: string,
    onboardingData: LocalOnboardingData
): Promise<{ goal: Goal; tasks: Task[] }> => {
    try {
        // Save onboarding data
        await saveOnboardingDataLocally(onboardingData);

        // Create goal from onboarding data (no mock data)
        const goal = createGoalFromWizard(
            userId,
            onboardingData.goalCategory as GoalCategory,
            onboardingData.goalTitle,
            onboardingData.goalDescription
        );
        await saveGoalLocally(goal);

        // No hardcoded tasks - tasks will be generated by AI or added manually
        const tasks: Task[] = [];

        // Save user profile
        await saveUserProfileLocally(userId, {
            profile: {
                age: Number(onboardingData.age),
                occupation: onboardingData.occupation,
                educationLevel: '',
            },
            timeAvailability: {
                dailyAvailableHours: Number(onboardingData.dailyHours),
                preferredTimeSlots: [],
            },
            skills: {
                existing: [],
                learningInterests: [],
            },
            onboardingCompleted: true,
        });

        console.log('[LocalDataService] Onboarding completed locally');
        console.log('[LocalDataService] Created goal:', goal.title);

        return { goal, tasks };
    } catch (error) {
        console.error('[LocalDataService] Error completing onboarding locally:', error);
        throw error;
    }
};

// ============================================
// Clear All Local Data (for testing)
// ============================================

export const clearAllLocalData = async (): Promise<void> => {
    try {
        // Clear data only for the current user
        if (!currentUserId) {
            console.warn('[LocalDataService] No user ID set, cannot clear user-specific data');
            return;
        }
        await AsyncStorage.multiRemove([
            getUserKey(STORAGE_KEYS.USER_PROFILE),
            getUserKey(STORAGE_KEYS.ONBOARDING_DATA),
            getUserKey(STORAGE_KEYS.GOALS),
            getUserKey(STORAGE_KEYS.TASKS),
            getUserKey(STORAGE_KEYS.PROFILE_IMAGE),
            getUserKey(STORAGE_KEYS.AI_INSIGHTS),
            getUserKey(STORAGE_KEYS.AI_INSIGHTS_TIMESTAMP),
        ]);
        console.log('[LocalDataService] User-specific local data cleared for:', currentUserId);
    } catch (error) {
        console.error('[LocalDataService] Error clearing local data:', error);
        throw error;
    }
};

// Get user-specific profile image key
export const getProfileImageKey = (): string => {
    return getUserKey(STORAGE_KEYS.PROFILE_IMAGE);
};

// Get user-specific AI insights key
export const getAIInsightsKey = (): string => {
    return getUserKey(STORAGE_KEYS.AI_INSIGHTS);
};

// Get user-specific AI insights timestamp key
export const getAIInsightsTimestampKey = (): string => {
    return getUserKey(STORAGE_KEYS.AI_INSIGHTS_TIMESTAMP);
};

export default {
    setCurrentUserId,
    getCurrentUserId,
    saveOnboardingDataLocally,
    getOnboardingDataLocally,
    saveUserProfileLocally,
    getUserProfileLocally,
    saveGoalLocally,
    getGoalsLocally,
    deleteGoalLocally,
    saveTasksLocally,
    getTasksLocally,
    updateTaskStatusLocally,
    addTaskLocally,
    deleteTaskLocally,
    deleteTasksByGoalLocally,
    completeOnboardingLocally,
    clearAllLocalData,
    getProfileImageKey,
    getAIInsightsKey,
    getAIInsightsTimestampKey,
};
