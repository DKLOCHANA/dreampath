// src/data/index.ts
// Export all data services - local storage, Firebase, and sync

// Local data services (offline storage)
export * from './localDataService';

// Data sync service (handles both local + Firestore)
export * from './dataSyncService';
import dataSyncService from './dataSyncService';

// Firebase services (direct access if needed)
export {
    // Auth
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOutUser,
    resetPassword,
    updateUserProfile,
    completeOnboarding,
    subscribeToAuthChanges,
    getCurrentUser,
    // Firestore - Goals (direct access)
    saveGoal as saveGoalDirect,
    getGoals as getGoalsDirect,
    getGoal,
    updateGoal,
    updateGoalStatus,
    deleteGoal as deleteGoalDirect,
    // Firestore - Tasks (direct access)
    saveTask,
    saveTasks as saveTasksDirect,
    getTasks as getTasksDirect,
    getTasksByGoal,
    updateTask,
    updateTaskStatus as updateTaskStatusDirect,
    deleteTask as deleteTaskDirect,
    // Batch metadata (Firestore)
    saveBatchMetadataToFirestore,
    getBatchMetadataFromFirestore,
    getAllBatchMetadataFromFirestore,
    deleteBatchMetadataFromFirestore,
    // Weekly patterns (Firestore)
    saveWeeklyPatternsToFirestore,
    getWeeklyPatternsFromFirestore,
    deleteWeeklyPatternsFromFirestore,
    // Wizard data (Firestore)
    saveWizardDataToFirestore,
    getWizardDataFromFirestore,
    deleteWizardDataFromFirestore,
    // Utility
    syncLocalDataToFirestore,
} from '@/infrastructure/firebase';

// Re-export sync service functions as the primary API
// These handle local + Firestore sync automatically
export {
    // Goals (with sync)
    saveGoal as saveGoalWithSync,
    getGoals as getGoalsWithSync,
    deleteGoal as deleteGoalWithSync,
    // Tasks (with sync)
    saveTasks as saveTasksWithSync,
    getTasks as getTasksWithSync,
    updateTaskStatus as updateTaskStatusWithSync,
    deleteTask as deleteTaskWithSync,
    // Full sync
    syncFromFirestore,
    syncToFirestore,
} from './dataSyncService';

// Flag to enable Firestore sync
// When true, data is saved both locally AND to Firestore
export const ENABLE_FIRESTORE_SYNC = true;

// Legacy flag (for backward compatibility)
// Set to false when ready to use Firebase in production
export const USE_LOCAL_DATA = false;

// Export default sync service
export { dataSyncService };
