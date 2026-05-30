// src/infrastructure/firebase/authService.ts
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    User as FirebaseUser,
    GoogleAuthProvider,
    signInWithCredential,
    OAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User } from '@/domain/entities/User';
import { useAuthStore } from '@/infrastructure/stores/authStore';
import { migrateGuestCacheToUser } from '@/data/guestGoalCache';
import { logCompleteRegistration } from '@/services/appsflyerService';

// Helper to trigger data sync after login (runs in background)
const triggerDataSync = async (): Promise<void> => {
    try {
        const { syncFromFirestore, syncToFirestore, cleanupOrphanedTasks } = await import('@/data/dataSyncService');
        console.log('[AuthService] Starting data sync after login...');

        // First pull data from Firestore to local
        const pullResult = await syncFromFirestore();
        console.log('[AuthService] Data pulled from Firestore:', pullResult);

        // Then push any local-only data to Firestore
        const pushResult = await syncToFirestore();
        console.log('[AuthService] Data pushed to Firestore:', pushResult);

        // Clean up any orphaned tasks
        const cleanedUp = await cleanupOrphanedTasks();
        if (cleanedUp > 0) {
            console.log('[AuthService] Cleaned up orphaned tasks:', cleanedUp);
        }
    } catch (error) {
        console.error('[AuthService] Data sync failed:', error);
        // Don't throw - sync failure shouldn't block login
    }
};

// Convert Firebase User to our User entity
const firebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    // Try to get additional user data from Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || userData?.displayName || '',
        photoURL: firebaseUser.photoURL || userData?.photoURL || undefined,
        onboardingCompleted: userData?.onboardingCompleted ?? false,
        profile: userData?.profile,
        finances: userData?.finances,
        timeAvailability: userData?.timeAvailability,
        skills: userData?.skills,
        subscriptionTier: userData?.subscriptionTier,
        subscriptionExpiredAt: userData?.subscriptionExpiredAt?.toDate?.() || undefined,
        createdAt: userData?.createdAt?.toDate() || new Date(),
        updatedAt: userData?.updatedAt?.toDate() || new Date(),
    };
};

// Create user document in Firestore. Returns true when a new doc was
// created (i.e. this is the user's first sign-in) so callers can fire
// one-time signup-side effects like the AppsFlyer registration event.
const createUserDocument = async (firebaseUser: FirebaseUser, additionalData?: Partial<User>): Promise<boolean> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) return false;

    await setDoc(userDocRef, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || additionalData?.displayName || '',
        photoURL: firebaseUser.photoURL || null,
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...additionalData,
    });
    console.log('[AuthService] User document created:', firebaseUser.uid);
    return true;
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update display name
        await updateProfile(firebaseUser, { displayName });

        // Email signup always creates a new account, so the doc is always new.
        await createUserDocument(firebaseUser, { displayName });

        // Promote pre-login onboarding goal onto this new account.
        await migrateGuestCacheToUser(firebaseUser.uid);

        const user = await firebaseUserToUser(firebaseUser);
        useAuthStore.getState().setUser(user);

        logCompleteRegistration('email'); // fire-and-forget
        console.log('[AuthService] User signed up:', user.email);
        return user;
    } catch (error: any) {
        console.error('[AuthService] Sign up error:', error);
        throw new Error(getAuthErrorMessage(error.code));
    }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Promote pre-login onboarding goal as a NEW goal on this account.
        await migrateGuestCacheToUser(firebaseUser.uid);

        const user = await firebaseUserToUser(firebaseUser);
        useAuthStore.getState().setUser(user);

        console.log('[AuthService] User signed in:', user.email);

        // Sync data from Firestore after login
        triggerDataSync();
        
        return user;
    } catch (error: any) {
        // Don't log error to console to avoid red error overlay in dev mode
        throw new Error(getAuthErrorMessage(error.code));
    }
};

// Sign in with Google (requires expo-auth-session setup)
export const signInWithGoogle = async (idToken: string): Promise<User> => {
    try {
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        const firebaseUser = userCredential.user;

        // Create user document if doesn't exist
        const isNew = await createUserDocument(firebaseUser);

        const user = await firebaseUserToUser(firebaseUser);
        useAuthStore.getState().setUser(user);

        if (isNew) logCompleteRegistration('google'); // fire-and-forget
        console.log('[AuthService] User signed in with Google:', user.email);
        
        // Sync data from Firestore after login
        triggerDataSync();

        return user;
    } catch (error: any) {
        console.error('[AuthService] Google sign in error:', error);
        throw new Error(getAuthErrorMessage(error.code));
    }
};

// Sign in with Apple (requires expo-apple-authentication setup)
export const signInWithApple = async (identityToken: string, nonce: string): Promise<User> => {
    try {
        const provider = new OAuthProvider('apple.com');
        const credential = provider.credential({
            idToken: identityToken,
            rawNonce: nonce,
        });
        const userCredential = await signInWithCredential(auth, credential);
        const firebaseUser = userCredential.user;

        // Create user document if doesn't exist
        const isNew = await createUserDocument(firebaseUser);

        const user = await firebaseUserToUser(firebaseUser);
        useAuthStore.getState().setUser(user);

        if (isNew) logCompleteRegistration('apple'); // fire-and-forget
        console.log('[AuthService] User signed in with Apple:', user.email);
        
        // Sync data from Firestore after login
        triggerDataSync();

        return user;
    } catch (error: any) {
        console.error('[AuthService] Apple sign in error:', error);
        throw new Error(getAuthErrorMessage(error.code));
    }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
    try {
        await signOut(auth);
        useAuthStore.getState().logout();
        console.log('[AuthService] User signed out');
    } catch (error: any) {
        console.error('[AuthService] Sign out error:', error);
        throw new Error('Failed to sign out. Please try again.');
    }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
        console.log('[AuthService] Password reset email sent to:', email);
    } catch (error: any) {
        console.error('[AuthService] Password reset error:', error);
        throw new Error(getAuthErrorMessage(error.code));
    }
};

// Update user profile in Firestore
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });

        // Update Firebase Auth display name and photo if provided
        if (auth.currentUser && (updates.displayName || updates.photoURL)) {
            await updateProfile(auth.currentUser, {
                displayName: updates.displayName || auth.currentUser.displayName,
                photoURL: updates.photoURL || auth.currentUser.photoURL,
            });
        }

        // Update local state
        useAuthStore.getState().updateUserProfile(updates);

        console.log('[AuthService] User profile updated:', userId);
    } catch (error: any) {
        console.error('[AuthService] Update profile error:', error);
        throw new Error('Failed to update profile. Please try again.');
    }
};

// Set the user's subscription tier (free | pro). Persists locally and in Firestore.
// Non-throwing — subscription state is also tracked via RevenueCat, so a Firestore write failure
// must not block the user's navigation.
export const setSubscriptionTier = async (
    userId: string,
    tier: import('@/domain/entities/User').SubscriptionTier,
): Promise<void> => {
    const updates: Partial<User> = { subscriptionTier: tier };
    if (tier === 'free') {
        updates.subscriptionExpiredAt = new Date();
    }

    // Update local store immediately so UI reflects the change even if offline
    useAuthStore.getState().updateUserProfile(updates);

    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
        console.log('[AuthService] Subscription tier set to', tier, 'for user:', userId);
    } catch (error) {
        console.warn('[AuthService] Failed to sync subscription tier to Firestore:', error);
    }
};

// Mark onboarding as completed
export const completeOnboarding = async (userId: string): Promise<void> => {
    try {
        await updateUserProfile(userId, { onboardingCompleted: true });
        console.log('[AuthService] Onboarding completed for user:', userId);
    } catch (error) {
        console.error('[AuthService] Complete onboarding error:', error);
        throw error;
    }
};

// Listen to auth state changes
export const subscribeToAuthChanges = (callback: (user: User | null) => void): (() => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
                // Promote any pending onboarding goal before downstream code reads goals.
                await migrateGuestCacheToUser(firebaseUser.uid);

                const user = await firebaseUserToUser(firebaseUser);
                callback(user);

                // Sync data when auth state changes (e.g., app restart with existing session)
                triggerDataSync();
            } catch (error) {
                console.error('[AuthService] Error processing auth state:', error);
                callback(null);
            }
        } else {
            callback(null);
        }
    });
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        return await firebaseUserToUser(firebaseUser);
    }
    return null;
};

// Helper function to get readable error messages
const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please sign in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled. Please contact support.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        case 'auth/user-not-found':
            return 'No account found with this email. Please sign up.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        default:
            return 'An error occurred. Please try again.';
    }
};
