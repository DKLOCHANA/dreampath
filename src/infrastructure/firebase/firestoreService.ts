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
                startDate: data.startDate?.toDate() || new Date(),
                targetDate: data.targetDate?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
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
            startDate: data.startDate?.toDate() || new Date(),
            targetDate: data.targetDate?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
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
                scheduledDate: data.scheduledDate?.toDate() || new Date(),
                completedAt: data.completedAt?.toDate() || null,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
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
                scheduledDate: data.scheduledDate?.toDate() || new Date(),
                completedAt: data.completedAt?.toDate() || null,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
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
