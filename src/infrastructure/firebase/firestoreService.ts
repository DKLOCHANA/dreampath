// src/infrastructure/firebase/firestoreService.ts
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { Goal, GoalStatus } from '@/domain/entities/Goal';
import { Task, TaskStatus } from '@/domain/entities/Task';

// Helper to safely convert Firestore timestamps to Date
const toDateSafe = (value: any, defaultValue: Date | null = null): Date | null => {
    if (!value) return defaultValue;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return defaultValue;
};

// ============================================
// GOALS COLLECTION
// ============================================

// Save a goal to Firestore
export const saveGoal = async (goal: Goal): Promise<void> => {
    try {
        const goalRef = doc(db, 'goals', goal.id);
        await setDoc(goalRef, {
            ...goal,
            startDate: goal.startDate instanceof Date ? Timestamp.fromDate(goal.startDate) : goal.startDate,
            targetDate: goal.targetDate instanceof Date ? Timestamp.fromDate(goal.targetDate) : goal.targetDate,
            createdAt: goal.createdAt instanceof Date ? Timestamp.fromDate(goal.createdAt) : serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        console.log('[FirestoreService] Goal saved:', goal.id);
    } catch (error) {
        console.error('[FirestoreService] Error saving goal:', error);
        throw error;
    }
};

// Get all goals for a user
export const getGoals = async (userId: string): Promise<Goal[]> => {
    try {
        const goalsRef = collection(db, 'goals');
        const q = query(
            goalsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        const goals: Goal[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                startDate: toDateSafe(data.startDate, new Date()) as Date,
                targetDate: toDateSafe(data.targetDate, new Date()) as Date,
                createdAt: toDateSafe(data.createdAt, new Date()) as Date,
                updatedAt: toDateSafe(data.updatedAt, new Date()) as Date,
            } as Goal;
        });

        console.log('[FirestoreService] Loaded goals:', goals.length);
        return goals;
    } catch (error) {
        console.error('[FirestoreService] Error getting goals:', error);
        throw error;
    }
};

// Get a single goal by ID
export const getGoal = async (goalId: string): Promise<Goal | null> => {
    try {
        const goalRef = doc(db, 'goals', goalId);
        const snapshot = await getDoc(goalRef);

        if (!snapshot.exists()) {
            return null;
        }

        const data = snapshot.data();
        return {
            ...data,
            id: snapshot.id,
            startDate: toDateSafe(data.startDate, new Date()) as Date,
            targetDate: toDateSafe(data.targetDate, new Date()) as Date,
            createdAt: toDateSafe(data.createdAt, new Date()) as Date,
            updatedAt: toDateSafe(data.updatedAt, new Date()) as Date,
        } as Goal;
    } catch (error) {
        console.error('[FirestoreService] Error getting goal:', error);
        throw error;
    }
};

// Update a goal
export const updateGoal = async (goalId: string, updates: Partial<Goal>): Promise<void> => {
    try {
        const goalRef = doc(db, 'goals', goalId);
        await updateDoc(goalRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
        console.log('[FirestoreService] Goal updated:', goalId);
    } catch (error) {
        console.error('[FirestoreService] Error updating goal:', error);
        throw error;
    }
};

// Update goal status
export const updateGoalStatus = async (goalId: string, status: GoalStatus): Promise<void> => {
    await updateGoal(goalId, { status });
};

// Delete a goal and its associated tasks
export const deleteGoal = async (goalId: string): Promise<void> => {
    try {
        const batch = writeBatch(db);

        // Delete the goal
        const goalRef = doc(db, 'goals', goalId);
        batch.delete(goalRef);

        // Delete associated tasks
        const tasksRef = collection(db, 'tasks');
        const q = query(tasksRef, where('goalId', '==', goalId));
        const snapshot = await getDocs(q);

        snapshot.docs.forEach((taskDoc) => {
            batch.delete(taskDoc.ref);
        });

        await batch.commit();
        console.log('[FirestoreService] Goal and tasks deleted:', goalId);
    } catch (error) {
        console.error('[FirestoreService] Error deleting goal:', error);
        throw error;
    }
};

// ============================================
// TASKS COLLECTION
// ============================================

// Save a task to Firestore
export const saveTask = async (task: Task): Promise<void> => {
    try {
        const taskRef = doc(db, 'tasks', task.id);
        await setDoc(taskRef, {
            ...task,
            scheduledDate: task.scheduledDate instanceof Date ? Timestamp.fromDate(task.scheduledDate) : task.scheduledDate,
            completedAt: task.completedAt instanceof Date ? Timestamp.fromDate(task.completedAt) : task.completedAt || null,
            createdAt: task.createdAt instanceof Date ? Timestamp.fromDate(task.createdAt) : serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        console.log('[FirestoreService] Task saved:', task.id);
    } catch (error) {
        console.error('[FirestoreService] Error saving task:', error);
        throw error;
    }
};

// Save multiple tasks (batch)
export const saveTasks = async (tasks: Task[]): Promise<void> => {
    try {
        const batch = writeBatch(db);

        tasks.forEach((task) => {
            const taskRef = doc(db, 'tasks', task.id);
            batch.set(taskRef, {
                ...task,
                scheduledDate: task.scheduledDate instanceof Date ? Timestamp.fromDate(task.scheduledDate) : task.scheduledDate,
                completedAt: task.completedAt instanceof Date ? Timestamp.fromDate(task.completedAt) : task.completedAt || null,
                createdAt: task.createdAt instanceof Date ? Timestamp.fromDate(task.createdAt) : serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        });

        await batch.commit();
        console.log('[FirestoreService] Batch tasks saved:', tasks.length);
    } catch (error) {
        console.error('[FirestoreService] Error saving batch tasks:', error);
        throw error;
    }
};

// Get all tasks for a user
export const getTasks = async (userId: string): Promise<Task[]> => {
    try {
        const tasksRef = collection(db, 'tasks');
        const q = query(
            tasksRef,
            where('userId', '==', userId),
            orderBy('scheduledDate', 'asc')
        );
        const snapshot = await getDocs(q);

        const tasks: Task[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                scheduledDate: toDateSafe(data.scheduledDate, new Date()) as Date,
                completedAt: toDateSafe(data.completedAt),
                createdAt: toDateSafe(data.createdAt, new Date()) as Date,
                updatedAt: toDateSafe(data.updatedAt, new Date()) as Date,
            } as Task;
        });

        console.log('[FirestoreService] Loaded tasks:', tasks.length);
        return tasks;
    } catch (error) {
        console.error('[FirestoreService] Error getting tasks:', error);
        throw error;
    }
};

// Get tasks for a specific goal
export const getTasksByGoal = async (goalId: string): Promise<Task[]> => {
    try {
        const tasksRef = collection(db, 'tasks');
        const q = query(
            tasksRef,
            where('goalId', '==', goalId),
            orderBy('scheduledDate', 'asc')
        );
        const snapshot = await getDocs(q);

        const tasks: Task[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                scheduledDate: toDateSafe(data.scheduledDate, new Date()) as Date,
                completedAt: toDateSafe(data.completedAt),
                createdAt: toDateSafe(data.createdAt, new Date()) as Date,
                updatedAt: toDateSafe(data.updatedAt, new Date()) as Date,
            } as Task;
        });

        return tasks;
    } catch (error) {
        console.error('[FirestoreService] Error getting tasks by goal:', error);
        throw error;
    }
};

// Update a task
export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
        console.log('[FirestoreService] Task updated:', taskId);
    } catch (error) {
        console.error('[FirestoreService] Error updating task:', error);
        throw error;
    }
};

// Update task status
export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
    const updates: Partial<Task> = { status };
    if (status === 'COMPLETED') {
        updates.completedAt = new Date();
    }
    await updateTask(taskId, updates);
};

// Delete a task
export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        await deleteDoc(taskRef);
        console.log('[FirestoreService] Task deleted:', taskId);
    } catch (error) {
        console.error('[FirestoreService] Error deleting task:', error);
        throw error;
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Sync local data to Firestore (for migration from local storage)
export const syncLocalDataToFirestore = async (
    userId: string,
    goals: Goal[],
    tasks: Task[]
): Promise<void> => {
    try {
        const batch = writeBatch(db);

        // Sync goals
        goals.forEach((goal) => {
            const goalRef = doc(db, 'goals', goal.id);
            batch.set(goalRef, {
                ...goal,
                userId,
                startDate: goal.startDate instanceof Date ? Timestamp.fromDate(goal.startDate) : goal.startDate,
                targetDate: goal.targetDate instanceof Date ? Timestamp.fromDate(goal.targetDate) : goal.targetDate,
                createdAt: goal.createdAt instanceof Date ? Timestamp.fromDate(goal.createdAt) : serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        });

        // Sync tasks
        tasks.forEach((task) => {
            const taskRef = doc(db, 'tasks', task.id);
            batch.set(taskRef, {
                ...task,
                userId,
                scheduledDate: task.scheduledDate instanceof Date ? Timestamp.fromDate(task.scheduledDate) : task.scheduledDate,
                completedAt: task.completedAt instanceof Date ? Timestamp.fromDate(task.completedAt) : task.completedAt || null,
                createdAt: task.createdAt instanceof Date ? Timestamp.fromDate(task.createdAt) : serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        });

        await batch.commit();
        console.log('[FirestoreService] Local data synced to Firestore');
    } catch (error) {
        console.error('[FirestoreService] Error syncing local data:', error);
        throw error;
    }
};

// ============================================
// BATCH METADATA COLLECTION (for hybrid task generation)
// ============================================

export interface FirestoreBatchMetadata {
    goalId: string;
    userId: string;
    totalDays: number;
    generatedUpToDay: number;
    lastGenerationDate: Date;
    patternsUsed: number;
    nextBatchTriggerDay: number;
}

// Save batch metadata to Firestore
export const saveBatchMetadataToFirestore = async (
    userId: string,
    goalId: string,
    metadata: Omit<FirestoreBatchMetadata, 'userId'>
): Promise<void> => {
    try {
        const metadataRef = doc(db, 'batchMetadata', `${userId}_${goalId}`);
        await setDoc(metadataRef, {
            ...metadata,
            userId,
            lastGenerationDate: metadata.lastGenerationDate instanceof Date 
                ? Timestamp.fromDate(metadata.lastGenerationDate) 
                : metadata.lastGenerationDate,
            updatedAt: serverTimestamp(),
        });
        console.log('[FirestoreService] Batch metadata saved:', goalId);
    } catch (error) {
        console.error('[FirestoreService] Error saving batch metadata:', error);
        throw error;
    }
};

// Get batch metadata for a goal
export const getBatchMetadataFromFirestore = async (
    userId: string,
    goalId: string
): Promise<FirestoreBatchMetadata | null> => {
    try {
        const metadataRef = doc(db, 'batchMetadata', `${userId}_${goalId}`);
        const snapshot = await getDoc(metadataRef);

        if (!snapshot.exists()) {
            return null;
        }

        const data = snapshot.data();
        return {
            ...data,
            lastGenerationDate: toDateSafe(data.lastGenerationDate, new Date()) as Date,
        } as FirestoreBatchMetadata;
    } catch (error) {
        console.error('[FirestoreService] Error getting batch metadata:', error);
        return null;
    }
};

// Get all batch metadata for a user
export const getAllBatchMetadataFromFirestore = async (
    userId: string
): Promise<FirestoreBatchMetadata[]> => {
    try {
        const metadataRef = collection(db, 'batchMetadata');
        const q = query(metadataRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                ...data,
                lastGenerationDate: toDateSafe(data.lastGenerationDate, new Date()) as Date,
            } as FirestoreBatchMetadata;
        });
    } catch (error) {
        console.error('[FirestoreService] Error getting all batch metadata:', error);
        return [];
    }
};

// Delete batch metadata
export const deleteBatchMetadataFromFirestore = async (
    userId: string,
    goalId: string
): Promise<void> => {
    try {
        const metadataRef = doc(db, 'batchMetadata', `${userId}_${goalId}`);
        await deleteDoc(metadataRef);
        console.log('[FirestoreService] Batch metadata deleted:', goalId);
    } catch (error) {
        console.error('[FirestoreService] Error deleting batch metadata:', error);
    }
};

// ============================================
// WEEKLY PATTERNS COLLECTION (for hybrid task generation)
// ============================================

// Save weekly patterns to Firestore
export const saveWeeklyPatternsToFirestore = async (
    userId: string,
    goalId: string,
    patterns: any // GeneratedWeeklyPatterns type
): Promise<void> => {
    try {
        const patternsRef = doc(db, 'weeklyPatterns', `${userId}_${goalId}`);
        await setDoc(patternsRef, {
            userId,
            goalId,
            patterns,
            updatedAt: serverTimestamp(),
        });
        console.log('[FirestoreService] Weekly patterns saved:', goalId);
    } catch (error) {
        console.error('[FirestoreService] Error saving weekly patterns:', error);
        throw error;
    }
};

// Get weekly patterns for a goal
export const getWeeklyPatternsFromFirestore = async (
    userId: string,
    goalId: string
): Promise<any | null> => {
    try {
        const patternsRef = doc(db, 'weeklyPatterns', `${userId}_${goalId}`);
        const snapshot = await getDoc(patternsRef);

        if (!snapshot.exists()) {
            return null;
        }

        return snapshot.data().patterns;
    } catch (error) {
        console.error('[FirestoreService] Error getting weekly patterns:', error);
        return null;
    }
};

// Delete weekly patterns
export const deleteWeeklyPatternsFromFirestore = async (
    userId: string,
    goalId: string
): Promise<void> => {
    try {
        const patternsRef = doc(db, 'weeklyPatterns', `${userId}_${goalId}`);
        await deleteDoc(patternsRef);
        console.log('[FirestoreService] Weekly patterns deleted:', goalId);
    } catch (error) {
        console.error('[FirestoreService] Error deleting weekly patterns:', error);
    }
};

// ============================================
// WIZARD DATA COLLECTION (for batch regeneration)
// ============================================

// Save wizard data to Firestore
export const saveWizardDataToFirestore = async (
    userId: string,
    goalId: string,
    wizardData: any
): Promise<void> => {
    try {
        const wizardRef = doc(db, 'wizardData', `${userId}_${goalId}`);
        await setDoc(wizardRef, {
            userId,
            goalId,
            data: {
                ...wizardData,
                startDate: wizardData.startDate instanceof Date 
                    ? Timestamp.fromDate(wizardData.startDate) 
                    : wizardData.startDate,
                targetDate: wizardData.targetDate instanceof Date 
                    ? Timestamp.fromDate(wizardData.targetDate) 
                    : wizardData.targetDate,
            },
            updatedAt: serverTimestamp(),
        });
        console.log('[FirestoreService] Wizard data saved:', goalId);
    } catch (error) {
        console.error('[FirestoreService] Error saving wizard data:', error);
        throw error;
    }
};

// Get wizard data for a goal
export const getWizardDataFromFirestore = async (
    userId: string,
    goalId: string
): Promise<any | null> => {
    try {
        const wizardRef = doc(db, 'wizardData', `${userId}_${goalId}`);
        const snapshot = await getDoc(wizardRef);

        if (!snapshot.exists()) {
            return null;
        }

        const data = snapshot.data().data;
        return {
            ...data,
            startDate: toDateSafe(data.startDate, new Date()) as Date,
            targetDate: toDateSafe(data.targetDate, new Date()) as Date,
        };
    } catch (error) {
        console.error('[FirestoreService] Error getting wizard data:', error);
        return null;
    }
};

// Delete wizard data
export const deleteWizardDataFromFirestore = async (
    userId: string,
    goalId: string
): Promise<void> => {
    try {
        const wizardRef = doc(db, 'wizardData', `${userId}_${goalId}`);
        await deleteDoc(wizardRef);
        console.log('[FirestoreService] Wizard data deleted:', goalId);
    } catch (error) {
        console.error('[FirestoreService] Error deleting wizard data:', error);
    }
};
