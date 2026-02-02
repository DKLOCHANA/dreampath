// src/data/index.ts
// Export all data services - local (for development) and Firebase (for production)

// Local data services (development/offline mode)
export * from './mockTasks';
export * from './mockGoals';
export * from './localDataService';

// Firebase services (production mode)
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
    // Firestore - Goals
    saveGoal,
    getGoals,
    getGoal,
    updateGoal,
    updateGoalStatus,
    deleteGoal,
    // Firestore - Tasks
    saveTask,
    saveTasks,
    getTasks,
    getTasksByGoal,
    updateTask,
    updateTaskStatus,
    deleteTask,
    // Utility
    syncLocalDataToFirestore,
} from '@/infrastructure/firebase';

// Flag to switch between local and Firebase mode
// Set to false when ready to use Firebase in production
export const USE_LOCAL_DATA = true;

// TODO: When switching to production:
// 1. Set USE_LOCAL_DATA = false
// 2. Ensure Firebase project is configured in .env
// 3. Set up Firestore security rules
// 4. Enable authentication methods in Firebase Console
