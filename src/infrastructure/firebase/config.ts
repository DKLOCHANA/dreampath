// src/infrastructure/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  Auth,
  // @ts-ignore - React Native persistence is available at runtime
  getReactNativePersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase app is already initialized
const isAppInitialized = getApps().length > 0;

// Initialize Firebase App
const app = isAppInitialized ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
// If the app was already initialized, use getAuth to avoid double initialization
let auth: Auth;
if (isAppInitialized) {
  // App already initialized, just get the existing auth instance
  auth = getAuth(app);
} else if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // First initialization on React Native - use initializeAuth with persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize Analytics (only on web, or use Firebase Analytics for native)
let analytics = null;
if (Platform.OS === 'web') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };
