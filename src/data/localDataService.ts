// src/data/localDataService.ts
// Local data service for offline storage and user data

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, GoalCategory, GoalStatus, GoalPriority } from '@/domain/entities/Goal';
import { Task } from '@/domain/entities/Task';
import { User } from '@/domain/entities/User';

const STORAGE_KEYS = {
    USER_PROFILE: '@dreampath_user_profile',
    ONBOARDING_DATA: '@dreampath_onboarding_data',
    GOALS: '@dreampath_goals',
    TASKS: '@dreampath_tasks',
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
        await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(data));
        console.log('[LocalDataService] Onboarding data saved locally');
    } catch (error) {
        console.error('[LocalDataService] Error saving onboarding data:', error);
        throw error;
    }
};

export const getOnboardingDataLocally = async (): Promise<LocalOnboardingData | null> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA);
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
        const existingData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        const existing = existingData ? JSON.parse(existingData) : {};
        
        const updated = {
            ...existing,
            ...profileData,
            id: userId,
            updatedAt: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
        console.log('[LocalDataService] User profile saved locally');
    } catch (error) {
        console.error('[LocalDataService] Error saving user profile:', error);
        throw error;
    }
};

export const getUserProfileLocally = async (): Promise<Partial<User> | null> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
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
        const existingData = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
        const goals: Goal[] = existingData ? JSON.parse(existingData) : [];
        
        // Check if goal exists, update or add
        const index = goals.findIndex(g => g.id === goal.id);
        if (index >= 0) {
            goals[index] = goal;
        } else {
            goals.push(goal);
        }
        
        await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
        console.log('[LocalDataService] Goal saved locally:', goal.id);
    } catch (error) {
        console.error('[LocalDataService] Error saving goal:', error);
        throw error;
    }
};

export const getGoalsLocally = async (): Promise<Goal[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[LocalDataService] Error getting goals:', error);
        return [];
    }
};

export const deleteGoalLocally = async (goalId: string): Promise<void> => {
    try {
        const existingData = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
        const goals: Goal[] = existingData ? JSON.parse(existingData) : [];
        const filtered = goals.filter(g => g.id !== goalId);
        await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(filtered));
        console.log('[LocalDataService] Goal deleted locally:', goalId);
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
        const existingData = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
        const existingTasks: Task[] = existingData ? JSON.parse(existingData) : [];
        
        // Merge tasks (update existing, add new)
        const taskMap = new Map(existingTasks.map(t => [t.id, t]));
        tasks.forEach(task => taskMap.set(task.id, task));
        
        await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(Array.from(taskMap.values())));
        console.log('[LocalDataService] Tasks saved locally:', tasks.length);
    } catch (error) {
        console.error('[LocalDataService] Error saving tasks:', error);
        throw error;
    }
};

export const getTasksLocally = async (): Promise<Task[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
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
        const tasks = await getTasksLocally();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index >= 0) {
            tasks[index].status = status;
            tasks[index].updatedAt = new Date();
            if (status === 'COMPLETED') {
                tasks[index].completedAt = new Date();
            }
            await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
            console.log('[LocalDataService] Task status updated:', taskId, status);
        }
    } catch (error) {
        console.error('[LocalDataService] Error updating task status:', error);
        throw error;
    }
};

export const addTaskLocally = async (task: Task): Promise<void> => {
    try {
        const existingTasks = await getTasksLocally();
        existingTasks.push(task);
        await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(existingTasks));
        console.log('[LocalDataService] Task added locally:', task.id);
    } catch (error) {
        console.error('[LocalDataService] Error adding task:', error);
        throw error;
    }
};

export const deleteTaskLocally = async (taskId: string): Promise<void> => {
    try {
        const tasks = await getTasksLocally();
        const filtered = tasks.filter(t => t.id !== taskId);
        await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
        console.log('[LocalDataService] Task deleted locally:', taskId);
    } catch (error) {
        console.error('[LocalDataService] Error deleting task:', error);
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
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.USER_PROFILE,
            STORAGE_KEYS.ONBOARDING_DATA,
            STORAGE_KEYS.GOALS,
            STORAGE_KEYS.TASKS,
        ]);
        console.log('[LocalDataService] All local data cleared');
    } catch (error) {
        console.error('[LocalDataService] Error clearing local data:', error);
        throw error;
    }
};

export default {
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
    completeOnboardingLocally,
    clearAllLocalData,
};
