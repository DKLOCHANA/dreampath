# DreamPath - Firebase Backend Architecture

## Complete Firebase Implementation Guide

This document provides detailed Firebase-only backend architecture for the DreamPath app, eliminating the need for custom API development.

---

## Firebase Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              React Native App (iOS)                  │
├─────────────────────────────────────────────────────┤
│                   Firebase SDK                       │
├──────────────┬──────────────┬───────────────────────┤
│   Firebase   │   Firebase   │   Firebase Cloud      │
│     Auth     │  Firestore   │    Functions          │
├──────────────┼──────────────┼───────────────────────┤
│   Firebase   │   Firebase   │   Firebase Cloud      │
│   Storage    │  Messaging   │    Messaging          │
└──────────────┴──────────────┴───────────────────────┘
                        │
                        ↓
                  OpenAI API
           (called from Cloud Functions)
```

---

## Firebase Services Used

### 1. Firebase Authentication

- User registration and login
- Email/Password authentication
- Social authentication (Apple, Google)
- Anonymous authentication
- Token management

### 2. Cloud Firestore

- NoSQL database for all app data
- Real-time data synchronization
- Offline support built-in
- Powerful querying capabilities
- Security rules for data protection

### 3. Firebase Cloud Functions

- Serverless backend logic
- OpenAI API integration
- Scheduled tasks (daily task generation)
- Data aggregation and processing
- Push notification triggers

### 4. Firebase Storage

- User profile images
- Goal-related documents
- Achievement badges
- Export files

### 5. Firebase Cloud Messaging (FCM)

- Push notifications
- Daily task reminders
- Achievement notifications
- Motivational messages

### 6. Firebase Analytics

- User behavior tracking
- Goal completion metrics
- Task completion rates
- User engagement metrics

---

## Firestore Database Structure

### Collections & Documents

```
users (collection)
├── {userId} (document)
    ├── email: string
    ├── name: string
    ├── createdAt: timestamp
    ├── profile: map
    │   ├── age: number
    │   ├── avatar: string
    │   └── ...
    ├── preferences: map
    │   ├── notificationTime: string
    │   ├── dailyTaskCount: number
    │   ├── motivationStyle: string
    │   └── theme: string
    └── stats: map
        ├── totalGoals: number
        ├── completedGoals: number
        ├── currentStreak: number
        └── ...

goals (collection)
├── {goalId} (document)
    ├── userId: string
    ├── title: string
    ├── description: string
    ├── category: string
    ├── status: string
    ├── progress: number
    ├── targetDate: timestamp
    ├── createdAt: timestamp
    ├── updatedAt: timestamp
    ├── metadata: map
    │   ├── personalContext: map
    │   ├── financialContext: map
    │   ├── skillsContext: map
    │   ├── constraints: map
    │   └── preferences: map
    └── plan: map
        ├── summary: string
        ├── keySuccessFactors: array
        ├── risks: array
        └── resourceRequirements: map

milestones (collection)
├── {milestoneId} (document)
    ├── goalId: string
    ├── userId: string
    ├── title: string
    ├── description: string
    ├── targetDate: timestamp
    ├── order: number
    ├── isCompleted: boolean
    ├── completedAt: timestamp
    └── createdAt: timestamp

tasks (collection)
├── {taskId} (document)
    ├── userId: string
    ├── goalId: string
    ├── milestoneId: string (optional)
    ├── title: string
    ├── description: string
    ├── scheduledDate: timestamp
    ├── estimatedDuration: number
    ├── priority: number
    ├── status: string
    ├── completedAt: timestamp
    ├── createdAt: timestamp
    └── aiGenerated: boolean

notifications (collection)
├── {notificationId} (document)
    ├── userId: string
    ├── type: string
    ├── title: string
    ├── body: string
    ├── data: map
    ├── read: boolean
    ├── sentAt: timestamp
    └── createdAt: timestamp

progress (collection)
├── {userId}_{date} (document)
    ├── userId: string
    ├── date: timestamp
    ├── tasksCompleted: number
    ├── tasksTotal: number
    ├── timeSpent: number
    ├── goalsWorkedOn: array
    └── createdAt: timestamp
```

### Composite Indexes Required

```javascript
// In Firebase Console -> Firestore -> Indexes
// Create these composite indexes:

1. Collection: tasks
   Fields: userId (Ascending), scheduledDate (Ascending)

2. Collection: tasks
   Fields: userId (Ascending), status (Ascending), scheduledDate (Ascending)

3. Collection: goals
   Fields: userId (Ascending), status (Ascending), createdAt (Descending)

4. Collection: milestones
   Fields: goalId (Ascending), order (Ascending)

5. Collection: notifications
   Fields: userId (Ascending), read (Ascending), createdAt (Descending)
```

---

## Firebase Security Rules

### Firestore Security Rules

File: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isValidUser() {
      return isAuthenticated() &&
             request.resource.data.userId == request.auth.uid;
    }

    // Users Collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }

    // Goals Collection
    match /goals/{goalId} {
      allow read: if isAuthenticated() &&
                     resource.data.userId == request.auth.uid;
      allow create: if isValidUser();
      allow update: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
    }

    // Tasks Collection
    match /tasks/{taskId} {
      allow read: if isAuthenticated() &&
                     resource.data.userId == request.auth.uid;
      allow create: if isValidUser();
      allow update: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
    }

    // Milestones Collection
    match /milestones/{milestoneId} {
      allow read: if isAuthenticated() &&
                     resource.data.userId == request.auth.uid;
      allow create: if isValidUser();
      allow update: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
    }

    // Notifications Collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() &&
                     resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
      // Only cloud functions can create/delete notifications
      allow create, delete: if false;
    }

    // Progress Collection
    match /progress/{progressId} {
      allow read: if isAuthenticated() &&
                     resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### Storage Security Rules

File: `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // User profile images
    match /users/{userId}/avatar/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      request.auth.uid == userId &&
                      request.resource.size < 5 * 1024 * 1024 && // 5MB max
                      request.resource.contentType.matches('image/.*');
    }

    // Goal attachments
    match /goals/{goalId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      request.resource.size < 10 * 1024 * 1024; // 10MB max
    }

    // Exported data
    match /exports/{userId}/{fileName} {
      allow read: if request.auth != null &&
                     request.auth.uid == userId;
      allow write: if false; // Only cloud functions can write
    }
  }
}
```

---

## React Native Firebase Integration (Expo)

### Important: Expo + Firebase Setup

With Expo SDK 52+, we use the **Expo Firebase packages** which work with Expo Go for development and EAS Build for production.

### Installation

```bash
# Install Expo Firebase packages
npm install firebase

# For EAS Build (production) - install native modules
npx expo install @react-native-firebase/app
npx expo install @react-native-firebase/auth
npx expo install @react-native-firebase/firestore
npx expo install @react-native-firebase/storage
npx expo install @react-native-firebase/functions
npx expo install @react-native-firebase/analytics

# For push notifications
npx expo install expo-notifications
```

### Firebase Configuration (Expo Compatible)

File: `src/config/firebase.ts`

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getAnalytics, isSupported } from "firebase/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore with OPTIMIZED CACHING
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED, // Unlimited cache for offline support
  experimentalForceLongPolling: false, // Use WebSocket for better performance
});

// Enable offline persistence
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    console.warn("Firestore persistence error:", err.code);
  });
}

export const storage = getStorage(app);
export const functions = getFunctions(app);

// Analytics (only in production)
export const analytics = async () => {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
```

---

## Firebase Caching & Optimization Strategy

### Firestore Cache Configuration

```typescript
// src/infrastructure/firebase/cache/FirestoreCache.ts
import { db } from "@config/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocsFromCache,
  getDocsFromServer,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";

/**
 * Optimized data fetching with cache-first strategy
 */
export class FirestoreCache {
  /**
   * Try cache first, fallback to server
   * Best for data that doesn't change frequently
   */
  static async getCacheFirst<T>(
    collectionPath: string,
    queryConstraints: any[],
    mapper: (doc: any) => T,
  ): Promise<T[]> {
    const ref = collection(db, collectionPath);
    const q = query(ref, ...queryConstraints);

    try {
      // Try cache first (fast, offline-capable)
      const cacheSnapshot = await getDocsFromCache(q);
      if (!cacheSnapshot.empty) {
        return cacheSnapshot.docs.map((doc) =>
          mapper({ id: doc.id, ...doc.data() }),
        );
      }
    } catch (e) {
      // Cache miss, fall through to server
    }

    // Fallback to server
    const serverSnapshot = await getDocsFromServer(q);
    return serverSnapshot.docs.map((doc) =>
      mapper({ id: doc.id, ...doc.data() }),
    );
  }

  /**
   * Always fetch from server, update cache
   * Best for data that changes frequently
   */
  static async getServerFirst<T>(
    collectionPath: string,
    queryConstraints: any[],
    mapper: (doc: any) => T,
  ): Promise<T[]> {
    const ref = collection(db, collectionPath);
    const q = query(ref, ...queryConstraints);

    const snapshot = await getDocsFromServer(q);
    return snapshot.docs.map((doc) => mapper({ id: doc.id, ...doc.data() }));
  }

  /**
   * Real-time listener with automatic cache sync
   * Best for live data (tasks, goals)
   */
  static subscribe<T>(
    collectionPath: string,
    queryConstraints: any[],
    mapper: (doc: any) => T,
    callback: (data: T[]) => void,
    errorCallback?: (error: Error) => void,
  ): () => void {
    const ref = collection(db, collectionPath);
    const q = query(ref, ...queryConstraints);

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: false }, // Reduce unnecessary updates
      (snapshot) => {
        const data = snapshot.docs.map((doc) =>
          mapper({ id: doc.id, ...doc.data() }),
        );
        callback(data);
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        errorCallback?.(error);
      },
    );

    return unsubscribe;
  }
}
```

### In-Memory Cache for Frequently Accessed Data

```typescript
// src/infrastructure/cache/MemoryCache.ts
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

export class MemoryCache {
  private static cache: Map<string, CacheEntry<any>> = new Map();
  private static DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  static invalidate(key: string): void {
    this.cache.delete(key);
  }

  static invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  static clear(): void {
    this.cache.clear();
  }
}
```

---

## Rate Limiting for AI Calls

**Critical**: OpenAI API calls are expensive. Implement rate limiting to control costs.

```typescript
// functions/src/utils/rateLimiter.ts
import * as admin from "firebase-admin";

const DAILY_AI_LIMIT = 10; // Max AI calls per user per day
const MONTHLY_AI_LIMIT = 100; // Max AI calls per user per month

export async function checkRateLimit(
  userId: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split("T")[0];
  const month = today.substring(0, 7);

  const dailyRef = admin.firestore().doc(`rateLimits/${userId}/daily/${today}`);
  const monthlyRef = admin
    .firestore()
    .doc(`rateLimits/${userId}/monthly/${month}`);

  const [dailyDoc, monthlyDoc] = await Promise.all([
    dailyRef.get(),
    monthlyRef.get(),
  ]);

  const dailyCount = dailyDoc.exists ? dailyDoc.data()!.count : 0;
  const monthlyCount = monthlyDoc.exists ? monthlyDoc.data()!.count : 0;

  if (dailyCount >= DAILY_AI_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  if (monthlyCount >= MONTHLY_AI_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: DAILY_AI_LIMIT - dailyCount };
}

export async function incrementRateLimit(userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const month = today.substring(0, 7);

  const batch = admin.firestore().batch();

  const dailyRef = admin.firestore().doc(`rateLimits/${userId}/daily/${today}`);
  const monthlyRef = admin
    .firestore()
    .doc(`rateLimits/${userId}/monthly/${month}`);

  batch.set(
    dailyRef,
    { count: admin.firestore.FieldValue.increment(1), date: today },
    { merge: true },
  );
  batch.set(
    monthlyRef,
    { count: admin.firestore.FieldValue.increment(1), month: month },
    { merge: true },
  );

  await batch.commit();
}
```

---

## Cost Estimation

### Firebase Costs (Blaze Plan - Pay as you go)

| Service            | Free Tier      | Estimated Monthly Cost (1000 users) |
| ------------------ | -------------- | ----------------------------------- |
| Authentication     | 10K/month      | $0                                  |
| Firestore Reads    | 50K/day        | $0 - $10                            |
| Firestore Writes   | 20K/day        | $0 - $15                            |
| Firestore Storage  | 1 GB           | $0 - $5                             |
| Cloud Functions    | 2M invocations | $0 - $10                            |
| Storage            | 5 GB           | $0 - $5                             |
| **Firebase Total** |                | **$0 - $45/month**                  |

### OpenAI API Costs

| Model         | Input Cost       | Output Cost      | Avg Call Cost |
| ------------- | ---------------- | ---------------- | ------------- |
| GPT-4         | $0.03/1K tokens  | $0.06/1K tokens  | ~$0.15/call   |
| GPT-4-Turbo   | $0.01/1K tokens  | $0.03/1K tokens  | ~$0.08/call   |
| GPT-3.5-Turbo | $0.001/1K tokens | $0.002/1K tokens | ~$0.01/call   |

**Recommendation**: Use GPT-4-Turbo for goal analysis, GPT-3.5-Turbo for simple task generation.

| Usage Scenario    | Monthly AI Calls | Estimated Cost |
| ----------------- | ---------------- | -------------- |
| 100 active users  | 1,000            | $80 - $150     |
| 500 active users  | 5,000            | $400 - $750    |
| 1000 active users | 10,000           | $800 - $1,500  |

**Cost Control Tips**:

1. Implement strict rate limiting (10 AI calls/user/day)
2. Cache AI responses for similar queries
3. Use GPT-3.5-Turbo for simpler operations
4. Batch task generation (generate week's tasks at once)

---

## Infrastructure Layer Implementation

### Firebase Authentication Service

File: `src/infrastructure/firebase/auth/FirebaseAuthService.ts`

```typescript
import { firebaseAuth } from "@config/firebase";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";

export interface AuthResult {
  user: FirebaseAuthTypes.User;
  isNewUser: boolean;
}

export class FirebaseAuthService {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const result = await firebaseAuth.signInWithEmailAndPassword(
        email,
        password,
      );

      return {
        user: result.user,
        isNewUser: false,
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    name: string,
  ): Promise<AuthResult> {
    try {
      const result = await firebaseAuth.createUserWithEmailAndPassword(
        email,
        password,
      );

      // Update profile with name
      await result.user.updateProfile({
        displayName: name,
      });

      return {
        user: result.user,
        isNewUser: true,
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<AuthResult> {
    // Implementation using @invertase/react-native-apple-authentication
    // and firebase credential
    throw new Error("Not implemented");
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<AuthResult> {
    // Implementation using @react-native-google-signin/google-signin
    // and firebase credential
    throw new Error("Not implemented");
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    await firebaseAuth.signOut();
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    await firebaseAuth.sendPasswordResetEmail(email);
  }

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return firebaseAuth.currentUser;
  }

  /**
   * Get ID token
   */
  async getIdToken(): Promise<string | null> {
    const user = firebaseAuth.currentUser;
    if (!user) return null;

    return await user.getIdToken();
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
    return firebaseAuth.onAuthStateChanged(callback);
  }

  /**
   * Handle Firebase auth errors
   */
  private handleAuthError(error: any): Error {
    const errorCode = error.code;

    switch (errorCode) {
      case "auth/email-already-in-use":
        return new Error("This email is already registered");
      case "auth/invalid-email":
        return new Error("Invalid email address");
      case "auth/weak-password":
        return new Error("Password should be at least 6 characters");
      case "auth/user-not-found":
        return new Error("No account found with this email");
      case "auth/wrong-password":
        return new Error("Incorrect password");
      case "auth/too-many-requests":
        return new Error("Too many attempts. Please try again later");
      case "auth/network-request-failed":
        return new Error("Network error. Please check your connection");
      default:
        return new Error(error.message || "Authentication failed");
    }
  }
}
```

### Firestore Repository Implementation

File: `src/infrastructure/firebase/repositories/FirebaseGoalRepository.ts`

```typescript
import { firebaseFirestore } from "@config/firebase";
import { Goal, GoalCategory, GoalStatus } from "@domain/entities/Goal";
import { IGoalRepository } from "@domain/repositories/IGoalRepository";
import { GoalMapper } from "@application/mappers/GoalMapper";
import firestore from "@react-native-firebase/firestore";

export class FirebaseGoalRepository implements IGoalRepository {
  private collection = firebaseFirestore.collection("goals");

  async findById(id: string): Promise<Goal | null> {
    try {
      const doc = await this.collection.doc(id).get();

      if (!doc.exists) {
        return null;
      }

      return GoalMapper.fromFirestore(doc);
    } catch (error) {
      console.error("Error fetching goal:", error);
      throw new Error("Failed to fetch goal");
    }
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    try {
      const snapshot = await this.collection
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) => GoalMapper.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching user goals:", error);
      throw new Error("Failed to fetch goals");
    }
  }

  async findActiveByUserId(userId: string): Promise<Goal[]> {
    try {
      const snapshot = await this.collection
        .where("userId", "==", userId)
        .where("status", "==", GoalStatus.ACTIVE)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) => GoalMapper.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching active goals:", error);
      throw new Error("Failed to fetch active goals");
    }
  }

  async save(goal: Goal): Promise<Goal> {
    try {
      const data = GoalMapper.toFirestore(goal);

      await this.collection.doc(goal.id).set({
        ...data,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      return goal;
    } catch (error) {
      console.error("Error saving goal:", error);
      throw new Error("Failed to save goal");
    }
  }

  async update(goal: Goal): Promise<Goal> {
    try {
      const data = GoalMapper.toFirestore(goal);

      await this.collection.doc(goal.id).update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      return goal;
    } catch (error) {
      console.error("Error updating goal:", error);
      throw new Error("Failed to update goal");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.collection.doc(id).delete();
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw new Error("Failed to delete goal");
    }
  }

  /**
   * Real-time listener for user's goals
   */
  subscribeToUserGoals(
    userId: string,
    callback: (goals: Goal[]) => void,
  ): () => void {
    const unsubscribe = this.collection
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const goals = snapshot.docs.map((doc) =>
            GoalMapper.fromFirestore(doc),
          );
          callback(goals);
        },
        (error) => {
          console.error("Error in goals subscription:", error);
        },
      );

    return unsubscribe;
  }

  /**
   * Real-time listener for single goal
   */
  subscribeToGoal(
    goalId: string,
    callback: (goal: Goal | null) => void,
  ): () => void {
    const unsubscribe = this.collection.doc(goalId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          callback(GoalMapper.fromFirestore(doc));
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error in goal subscription:", error);
      },
    );

    return unsubscribe;
  }
}
```

### Firestore Task Repository

File: `src/infrastructure/firebase/repositories/FirebaseTaskRepository.ts`

```typescript
import { firebaseFirestore } from "@config/firebase";
import { Task, TaskStatus } from "@domain/entities/Task";
import { ITaskRepository } from "@domain/repositories/ITaskRepository";
import { TaskMapper } from "@application/mappers/TaskMapper";
import firestore from "@react-native-firebase/firestore";

export class FirebaseTaskRepository implements ITaskRepository {
  private collection = firebaseFirestore.collection("tasks");

  async findById(id: string): Promise<Task | null> {
    try {
      const doc = await this.collection.doc(id).get();

      if (!doc.exists) {
        return null;
      }

      return TaskMapper.fromFirestore(doc);
    } catch (error) {
      console.error("Error fetching task:", error);
      throw new Error("Failed to fetch task");
    }
  }

  async findByGoalId(goalId: string): Promise<Task[]> {
    try {
      const snapshot = await this.collection
        .where("goalId", "==", goalId)
        .orderBy("scheduledDate", "asc")
        .get();

      return snapshot.docs.map((doc) => TaskMapper.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching goal tasks:", error);
      throw new Error("Failed to fetch tasks");
    }
  }

  async findByDate(userId: string, date: Date): Promise<Task[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const snapshot = await this.collection
        .where("userId", "==", userId)
        .where("scheduledDate", ">=", startOfDay)
        .where("scheduledDate", "<=", endOfDay)
        .orderBy("scheduledDate", "asc")
        .orderBy("priority", "desc")
        .get();

      return snapshot.docs.map((doc) => TaskMapper.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching tasks by date:", error);
      throw new Error("Failed to fetch tasks");
    }
  }

  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Task[]> {
    try {
      const snapshot = await this.collection
        .where("userId", "==", userId)
        .where("scheduledDate", ">=", startDate)
        .where("scheduledDate", "<=", endDate)
        .orderBy("scheduledDate", "asc")
        .get();

      return snapshot.docs.map((doc) => TaskMapper.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching tasks by date range:", error);
      throw new Error("Failed to fetch tasks");
    }
  }

  async save(task: Task): Promise<Task> {
    try {
      const data = TaskMapper.toFirestore(task);

      await this.collection.doc(task.id).set({
        ...data,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      return task;
    } catch (error) {
      console.error("Error saving task:", error);
      throw new Error("Failed to save task");
    }
  }

  async saveMany(tasks: Task[]): Promise<Task[]> {
    try {
      const batch = firebaseFirestore.batch();

      tasks.forEach((task) => {
        const data = TaskMapper.toFirestore(task);
        const ref = this.collection.doc(task.id);
        batch.set(ref, {
          ...data,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      return tasks;
    } catch (error) {
      console.error("Error saving tasks:", error);
      throw new Error("Failed to save tasks");
    }
  }

  async update(task: Task): Promise<Task> {
    try {
      const data = TaskMapper.toFirestore(task);

      await this.collection.doc(task.id).update(data);

      return task;
    } catch (error) {
      console.error("Error updating task:", error);
      throw new Error("Failed to update task");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.collection.doc(id).delete();
    } catch (error) {
      console.error("Error deleting task:", error);
      throw new Error("Failed to delete task");
    }
  }

  /**
   * Real-time listener for tasks by date
   */
  subscribeToTasksByDate(
    userId: string,
    date: Date,
    callback: (tasks: Task[]) => void,
  ): () => void {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const unsubscribe = this.collection
      .where("userId", "==", userId)
      .where("scheduledDate", ">=", startOfDay)
      .where("scheduledDate", "<=", endOfDay)
      .orderBy("scheduledDate", "asc")
      .onSnapshot(
        (snapshot) => {
          const tasks = snapshot.docs.map((doc) =>
            TaskMapper.fromFirestore(doc),
          );
          callback(tasks);
        },
        (error) => {
          console.error("Error in tasks subscription:", error);
        },
      );

    return unsubscribe;
  }
}
```

### Mappers for Firestore

File: `src/application/mappers/GoalMapper.ts`

```typescript
import { Goal, GoalCategory, GoalStatus } from "@domain/entities/Goal";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

export class GoalMapper {
  static fromFirestore(doc: FirebaseFirestoreTypes.DocumentSnapshot): Goal {
    const data = doc.data()!;

    return new Goal(
      doc.id,
      data.userId,
      data.title,
      data.description,
      data.category as GoalCategory,
      data.targetDate.toDate(),
      data.createdAt?.toDate() || new Date(),
      data.status as GoalStatus,
      data.progress || 0,
      data.metadata || {},
    );
  }

  static toFirestore(goal: Goal): any {
    return {
      userId: goal.userId,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      status: goal.status,
      progress: goal.progress,
      targetDate: goal.targetDate,
      metadata: goal.metadata,
    };
  }
}
```

---

## Firebase Cloud Functions

### Setup Cloud Functions

```bash
# Initialize Firebase Functions
firebase init functions

# Choose TypeScript
# Install dependencies
```

### Function Structure

```
functions/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── ai/
│   │   ├── analyzeGoal.ts
│   │   ├── generateTasks.ts
│   │   └── adjustPlan.ts
│   ├── scheduled/
│   │   ├── generateDailyTasks.ts
│   │   └── sendReminders.ts
│   ├── triggers/
│   │   ├── onGoalCreated.ts
│   │   ├── onTaskCompleted.ts
│   │   └── onMilestoneAchieved.ts
│   └── utils/
│       ├── openai.ts
│       └── notifications.ts
├── package.json
└── tsconfig.json
```

### AI Goal Analysis Function

File: `functions/src/ai/analyzeGoal.ts`

````typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(
  new Configuration({
    apiKey: functions.config().openai.key,
  }),
);

export const analyzeGoal = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const { goalId } = data;
  const userId = context.auth.uid;

  try {
    // Get goal data
    const goalDoc = await admin
      .firestore()
      .collection("goals")
      .doc(goalId)
      .get();

    if (!goalDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Goal not found");
    }

    const goal = goalDoc.data()!;

    // Verify ownership
    if (goal.userId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Not authorized",
      );
    }

    // Build prompt
    const prompt = buildGoalAnalysisPrompt(goal);

    // Call OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = completion.data.choices[0].message?.content || "";
    const plan = JSON.parse(cleanJsonResponse(responseText));

    // Save plan to goal document
    await goalDoc.ref.update({
      plan,
      status: "ACTIVE",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create milestones
    if (plan.milestones && plan.milestones.length > 0) {
      await createMilestones(goalId, userId, plan.milestones);
    }

    return { success: true, plan };
  } catch (error: any) {
    console.error("Error analyzing goal:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to analyze goal",
    );
  }
});

function buildGoalAnalysisPrompt(goal: any): string {
  return `
You are an expert life coach and strategic planner. Analyze the following goal and create a detailed, personalized action plan.

GOAL INFORMATION:
Title: ${goal.title}
Description: ${goal.description}
Category: ${goal.category}
Target Date: ${goal.targetDate}

USER CONTEXT:
${JSON.stringify(goal.metadata, null, 2)}

Please provide a comprehensive plan in the following JSON format:
{
  "summary": "Brief overview of the plan",
  "milestones": [
    {
      "title": "Milestone title",
      "description": "What needs to be achieved",
      "targetDate": "ISO date string",
      "order": 1
    }
  ],
  "keySuccessFactors": ["factor1", "factor2", "factor3"],
  "risks": [
    {
      "risk": "Potential obstacle",
      "mitigation": "How to handle it"
    }
  ],
  "resourceRequirements": {
    "timePerWeek": "X hours",
    "financialInvestment": "$X - $Y",
    "skillsToDevelop": ["skill1", "skill2"]
  }
}

Return ONLY valid JSON, no markdown formatting.
`.trim();
}

function getSystemPrompt(): string {
  return `You are an expert life coach and strategic planner with 20+ years of experience.
Your specialty is breaking down ambitious goals into achievable, step-by-step plans.
Always be realistic yet motivating. Provide specific, actionable guidance.
Return responses in valid JSON format only, without any markdown formatting.`;
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  cleaned = cleaned.trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  return cleaned;
}

async function createMilestones(
  goalId: string,
  userId: string,
  milestones: any[],
): Promise<void> {
  const batch = admin.firestore().batch();

  milestones.forEach((milestone, index) => {
    const ref = admin.firestore().collection("milestones").doc();
    batch.set(ref, {
      goalId,
      userId,
      title: milestone.title,
      description: milestone.description,
      targetDate: new Date(milestone.targetDate),
      order: milestone.order || index + 1,
      isCompleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}
````

### Daily Task Generation Function

File: `functions/src/scheduled/generateDailyTasks.ts`

````typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(
  new Configuration({
    apiKey: functions.config().openai.key,
  }),
);

// Run every day at 6 AM
export const generateDailyTasks = functions.pubsub
  .schedule("0 6 * * *")
  .timeZone("America/New_York")
  .onRun(async (context) => {
    try {
      console.log("Starting daily task generation...");

      // Get all active goals
      const goalsSnapshot = await admin
        .firestore()
        .collection("goals")
        .where("status", "==", "ACTIVE")
        .get();

      console.log(`Found ${goalsSnapshot.size} active goals`);

      // Process each goal
      const promises = goalsSnapshot.docs.map(async (goalDoc) => {
        const goal = goalDoc.data();
        const userId = goal.userId;

        try {
          // Get user preferences
          const userDoc = await admin
            .firestore()
            .collection("users")
            .doc(userId)
            .get();

          const userPreferences = userDoc.data()?.preferences || {};
          const dailyTaskCount = userPreferences.dailyTaskCount || 3;

          // Generate tasks using OpenAI
          const tasks = await generateTasksForGoal(
            goalDoc.id,
            goal,
            dailyTaskCount,
          );

          // Save tasks to Firestore
          if (tasks && tasks.length > 0) {
            const batch = admin.firestore().batch();

            tasks.forEach((task) => {
              const ref = admin.firestore().collection("tasks").doc();
              batch.set(ref, {
                ...task,
                userId,
                goalId: goalDoc.id,
                status: "PENDING",
                aiGenerated: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            });

            await batch.commit();
            console.log(
              `Generated ${tasks.length} tasks for goal ${goalDoc.id}`,
            );
          }
        } catch (error) {
          console.error(`Error processing goal ${goalDoc.id}:`, error);
        }
      });

      await Promise.all(promises);

      console.log("Daily task generation completed");
      return null;
    } catch (error) {
      console.error("Error in daily task generation:", error);
      return null;
    }
  });

async function generateTasksForGoal(
  goalId: string,
  goal: any,
  taskCount: number,
): Promise<any[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const prompt = `
Generate ${taskCount} specific, actionable tasks for tomorrow (${tomorrow.toDateString()}) 
to work towards the goal: "${goal.title}".

Goal Description: ${goal.description}
Current Progress: ${goal.progress}%

Tasks should be:
- Clear and specific (not vague)
- Achievable in 30-90 minutes
- Directly related to the goal
- Prioritized appropriately

Provide tasks in JSON format:
[
  {
    "title": "Clear, actionable task title",
    "description": "Detailed description",
    "estimatedDuration": minutes (number),
    "priority": 1-4 (number)
  }
]

Return ONLY valid JSON.
`.trim();

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a productivity expert. Generate practical daily tasks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const responseText = completion.data.choices[0].message?.content || "";
    const tasks = JSON.parse(cleanJsonResponse(responseText));

    return tasks.map((task: any) => ({
      ...task,
      scheduledDate: tomorrow,
    }));
  } catch (error) {
    console.error("Error generating tasks:", error);
    return [];
  }
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  cleaned = cleaned.trim();

  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  return cleaned;
}
````

### Deployment

```bash
# Set OpenAI API key
firebase functions:config:set openai.key="your-openai-api-key"

# Deploy functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:analyzeGoal
```

---

## Calling Cloud Functions from React Native

File: `src/infrastructure/firebase/functions/FunctionsCaller.ts`

```typescript
import { firebaseFunctions } from "@config/firebase";

export class FunctionsCaller {
  /**
   * Analyze goal and generate plan
   */
  static async analyzeGoal(goalId: string): Promise<any> {
    try {
      const result = await firebaseFunctions.httpsCallable("analyzeGoal")({
        goalId,
      });

      return result.data;
    } catch (error: any) {
      console.error("Error calling analyzeGoal function:", error);
      throw new Error(error.message || "Failed to analyze goal");
    }
  }

  /**
   * Generate tasks for a specific date
   */
  static async generateTasksForDate(goalId: string, date: Date): Promise<any> {
    try {
      const result = await firebaseFunctions.httpsCallable(
        "generateTasksForDate",
      )({
        goalId,
        date: date.toISOString(),
      });

      return result.data;
    } catch (error: any) {
      console.error("Error calling generateTasksForDate function:", error);
      throw new Error(error.message || "Failed to generate tasks");
    }
  }
}
```

---

## Real-Time Updates with Firestore

### Using Real-Time Listeners in React

File: `src/presentation/hooks/useGoalsRealtime.ts`

```typescript
import { useEffect, useState } from "react";
import { Goal } from "@domain/entities/Goal";
import { container } from "@infrastructure/di/Container";
import { FirebaseGoalRepository } from "@infrastructure/firebase/repositories/FirebaseGoalRepository";

export const useGoalsRealtime = (userId: string) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const repository =
      container.resolve<FirebaseGoalRepository>("GoalRepository");

    const unsubscribe = repository.subscribeToUserGoals(
      userId,
      (updatedGoals) => {
        setGoals(updatedGoals);
        setLoading(false);
      },
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [userId]);

  return { goals, loading, error };
};
```

---

## Offline Support (Built-in with Firestore)

Firestore automatically handles offline support:

```typescript
import { firebaseFirestore } from "@config/firebase";

// Enable offline persistence (already done in config)
firebaseFirestore.settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

// All queries automatically work offline
// Data syncs when connection is restored
```

---

## Push Notifications with FCM

File: `src/infrastructure/firebase/messaging/FCMService.ts`

```typescript
import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";

export class FCMService {
  /**
   * Request notification permissions
   */
  static async requestPermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  }

  /**
   * Get FCM token
   */
  static async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }

  /**
   * Save token to Firestore
   */
  static async saveTokenToFirestore(
    userId: string,
    token: string,
  ): Promise<void> {
    await firestore()
      .collection("users")
      .doc(userId)
      .update({
        fcmTokens: firestore.FieldValue.arrayUnion(token),
      });
  }

  /**
   * Listen for foreground messages
   */
  static onMessage(callback: (message: any) => void) {
    return messaging().onMessage(callback);
  }

  /**
   * Handle notification opened app
   */
  static onNotificationOpenedApp(callback: (message: any) => void) {
    messaging().onNotificationOpenedApp(callback);
  }

  /**
   * Handle background messages
   */
  static setBackgroundMessageHandler(handler: (message: any) => Promise<any>) {
    messaging().setBackgroundMessageHandler(handler);
  }
}
```

---

This Firebase-only architecture eliminates the need for custom API development while providing all necessary backend functionality!
