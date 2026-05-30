// src/data/guestGoalCache.ts
// Pre-login goal cache. When the user creates their first plan during onboarding
// (no Firebase user yet), GoalWizard saves to the base AsyncStorage keys via
// localDataService (which falls back to base keys when no userId is set).
//
// After auth, migrateGuestCacheToUser() re-keys those base entries under the
// new userId, stamps the real userId onto the goal/task records, and clears
// the guest cache. The standard syncToFirestore() pass then pushes them up.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '@/domain/entities/Goal';
import { Task } from '@/domain/entities/Task';

const GUEST_GOALS_KEY = '@dreampath_goals';
const GUEST_TASKS_KEY = '@dreampath_tasks';

const userGoalsKey = (userId: string) => `${GUEST_GOALS_KEY}_${userId}`;
const userTasksKey = (userId: string) => `${GUEST_TASKS_KEY}_${userId}`;

/** Whether a pre-login goal exists in the guest cache. */
export const hasGuestGoal = async (): Promise<boolean> => {
    const raw = await AsyncStorage.getItem(GUEST_GOALS_KEY);
    if (!raw) return false;
    try {
        const goals: Goal[] = JSON.parse(raw);
        return goals.length > 0;
    } catch {
        return false;
    }
};

/**
 * Migrate base-key (guest) goals & tasks to the user-scoped keys after auth.
 * - Stamps the real userId onto each record so Firestore writes have the right owner.
 * - Merges with anything already in the user-scoped keys (existing user signing in).
 * - Clears the guest cache when done so subsequent guests on the same device start clean.
 */
export const migrateGuestCacheToUser = async (userId: string): Promise<{
    migratedGoals: number;
    migratedTasks: number;
}> => {
    if (!userId) return { migratedGoals: 0, migratedTasks: 0 };

    try {
        const [guestGoalsRaw, guestTasksRaw, userGoalsRaw, userTasksRaw] = await Promise.all([
            AsyncStorage.getItem(GUEST_GOALS_KEY),
            AsyncStorage.getItem(GUEST_TASKS_KEY),
            AsyncStorage.getItem(userGoalsKey(userId)),
            AsyncStorage.getItem(userTasksKey(userId)),
        ]);

        const guestGoals: Goal[] = guestGoalsRaw ? JSON.parse(guestGoalsRaw) : [];
        const guestTasks: Task[] = guestTasksRaw ? JSON.parse(guestTasksRaw) : [];

        if (guestGoals.length === 0 && guestTasks.length === 0) {
            return { migratedGoals: 0, migratedTasks: 0 };
        }

        const existingGoals: Goal[] = userGoalsRaw ? JSON.parse(userGoalsRaw) : [];
        const existingTasks: Task[] = userTasksRaw ? JSON.parse(userTasksRaw) : [];

        // Stamp real userId onto the guest records.
        const stampedGoals = guestGoals.map((g) => ({ ...g, userId }));
        const stampedTasks = guestTasks.map((t) => ({ ...t, userId }));

        // Merge by id, guest wins (it's the freshly created plan).
        const goalMap = new Map<string, Goal>();
        existingGoals.forEach((g) => goalMap.set(g.id, g));
        stampedGoals.forEach((g) => goalMap.set(g.id, g));

        const taskMap = new Map<string, Task>();
        existingTasks.forEach((t) => taskMap.set(t.id, t));
        stampedTasks.forEach((t) => taskMap.set(t.id, t));

        await Promise.all([
            AsyncStorage.setItem(userGoalsKey(userId), JSON.stringify(Array.from(goalMap.values()))),
            AsyncStorage.setItem(userTasksKey(userId), JSON.stringify(Array.from(taskMap.values()))),
            AsyncStorage.removeItem(GUEST_GOALS_KEY),
            AsyncStorage.removeItem(GUEST_TASKS_KEY),
        ]);

        console.log('[GuestCache] Migrated', stampedGoals.length, 'goals,', stampedTasks.length, 'tasks to user', userId);

        return { migratedGoals: stampedGoals.length, migratedTasks: stampedTasks.length };
    } catch (error) {
        console.error('[GuestCache] Migration failed:', error);
        return { migratedGoals: 0, migratedTasks: 0 };
    }
};

/** Clear the guest cache. Useful when the user restarts onboarding. */
export const clearGuestCache = async (): Promise<void> => {
    await Promise.all([
        AsyncStorage.removeItem(GUEST_GOALS_KEY),
        AsyncStorage.removeItem(GUEST_TASKS_KEY),
    ]);
};
