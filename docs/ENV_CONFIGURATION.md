# DreamPath - Environment Configuration

## Complete Environment Setup Guide

This document explains how to configure environment variables for development, staging, and production environments.

---

## Environment Structure

```
DreamPath/
├── .env                    # Local development (DO NOT COMMIT)
├── .env.example            # Template for .env (COMMIT THIS)
├── app.config.ts           # Expo configuration with env vars
└── eas.json                # EAS Build environment configuration
```

---

## Local Development Setup

### Step 1: Create .env File

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Step 2: Configure .env

```bash
# .env - Local Development Configuration
# ======================================
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# App Variant
APP_VARIANT=development

# ================================
# FIREBASE CONFIGURATION
# ================================
# Get these values from Firebase Console:
# Project Settings > General > Your apps > iOS app

FIREBASE_API_KEY=AIzaSyD-your-api-key-here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:ios:abcdef123456

# ================================
# EXPO / EAS CONFIGURATION
# ================================
# Get from: expo.dev > Your Project > Project ID

EAS_PROJECT_ID=your-eas-project-id-uuid

# ================================
# OPTIONAL: DEVELOPMENT OVERRIDES
# ================================
# Uncomment to use Firebase Emulator
# USE_FIREBASE_EMULATOR=true
# FIREBASE_EMULATOR_HOST=localhost
```

---

## Firebase Configuration

### Getting Firebase Config Values

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create one)
3. Click the gear icon → **Project settings**
4. Scroll to **Your apps** section
5. Click **Add app** → Select **iOS**
6. Register with bundle ID: `com.yourcompany.dreampath`
7. Download `GoogleService-Info.plist` (for EAS Build)
8. Copy the config values to your `.env` file

### Firebase Config Values Explained

| Variable                       | Description                   | Where to Find                       |
| ------------------------------ | ----------------------------- | ----------------------------------- |
| `FIREBASE_API_KEY`             | API Key for Firebase services | Firebase Console → Project Settings |
| `FIREBASE_AUTH_DOMAIN`         | Auth domain for OAuth         | `{project-id}.firebaseapp.com`      |
| `FIREBASE_PROJECT_ID`          | Unique project identifier     | Firebase Console → Project Settings |
| `FIREBASE_STORAGE_BUCKET`      | Cloud Storage bucket          | `{project-id}.appspot.com`          |
| `FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID                 | Firebase Console → Cloud Messaging  |
| `FIREBASE_APP_ID`              | iOS app ID                    | Firebase Console → Your apps        |

---

## Expo Configuration

### app.config.ts

This is the main Expo configuration file that reads environment variables:

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from "expo/config";

// Determine environment
const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";
const IS_PROD = !IS_DEV && !IS_PREVIEW;

// Bundle identifier per environment
const getBundleId = () => {
  if (IS_DEV) return "com.yourcompany.dreampath.dev";
  if (IS_PREVIEW) return "com.yourcompany.dreampath.preview";
  return "com.yourcompany.dreampath";
};

// App name per environment
const getAppName = () => {
  if (IS_DEV) return "DreamPath Dev";
  if (IS_PREVIEW) return "DreamPath Preview";
  return "DreamPath";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "dreampath",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",

  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#4F46E5",
  },

  assetBundlePatterns: ["**/*"],

  ios: {
    supportsTablet: false,
    bundleIdentifier: getBundleId(),
    buildNumber: "1",
    infoPlist: {
      NSCameraUsageDescription:
        "DreamPath needs camera access to update your profile photo.",
      NSPhotoLibraryUsageDescription:
        "DreamPath needs photo library access to update your profile photo.",
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },

  plugins: [
    "expo-router",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#4F46E5",
      },
    ],
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "14.0",
        },
      },
    ],
  ],

  extra: {
    // Firebase Configuration
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,

    // App metadata
    appVariant: process.env.APP_VARIANT || "production",

    // EAS
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },

  owner: "your-expo-username",
});
```

---

## EAS Build Configuration

### eas.json

Configure different build profiles for development, preview, and production:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "development"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "preview"
      },
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "env": {
        "APP_VARIANT": "production"
      },
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id"
      }
    }
  }
}
```

---

## EAS Secrets (Production Environment Variables)

For production builds, store sensitive values in EAS Secrets (not in code):

### Setting EAS Secrets

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Set secrets for your project
eas secret:create --name FIREBASE_API_KEY --value "your-production-api-key" --scope project
eas secret:create --name FIREBASE_AUTH_DOMAIN --value "your-project.firebaseapp.com" --scope project
eas secret:create --name FIREBASE_PROJECT_ID --value "your-project-id" --scope project
eas secret:create --name FIREBASE_STORAGE_BUCKET --value "your-project.appspot.com" --scope project
eas secret:create --name FIREBASE_MESSAGING_SENDER_ID --value "123456789012" --scope project
eas secret:create --name FIREBASE_APP_ID --value "1:123:ios:abc" --scope project

# List secrets
eas secret:list
```

---

## Firebase Cloud Functions Secrets

For OpenAI API key and other secrets in Cloud Functions:

```bash
# Navigate to functions directory
cd functions

# Set secret using Firebase CLI
firebase functions:secrets:set OPENAI_API_KEY

# You'll be prompted to enter the value
# Enter your OpenAI API key

# Verify secrets
firebase functions:secrets:access OPENAI_API_KEY
```

### Using Secrets in Cloud Functions

```typescript
// functions/src/index.ts
import * as functions from "firebase-functions";
import { defineSecret } from "firebase-functions/params";

// Define secret
const openaiApiKey = defineSecret("OPENAI_API_KEY");

// Use in function
export const analyzeGoal = functions
  .runWith({ secrets: [openaiApiKey] })
  .https.onCall(async (data, context) => {
    const apiKey = openaiApiKey.value();
    // Use apiKey for OpenAI calls
  });
```

---

## Accessing Environment Variables in App

### Reading Config Values

```typescript
// src/config/environment.ts
import Constants from "expo-constants";

interface AppConfig {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
  appVariant: "development" | "preview" | "production";
  isDev: boolean;
  isProd: boolean;
}

const extra = Constants.expoConfig?.extra;

if (!extra?.firebaseApiKey) {
  throw new Error(
    "Firebase configuration missing. Check your environment variables.",
  );
}

export const config: AppConfig = {
  firebaseApiKey: extra.firebaseApiKey,
  firebaseAuthDomain: extra.firebaseAuthDomain,
  firebaseProjectId: extra.firebaseProjectId,
  firebaseStorageBucket: extra.firebaseStorageBucket,
  firebaseMessagingSenderId: extra.firebaseMessagingSenderId,
  firebaseAppId: extra.firebaseAppId,
  appVariant: extra.appVariant || "production",
  isDev: extra.appVariant === "development",
  isProd: extra.appVariant === "production" || !extra.appVariant,
};

// Validate config at startup
export const validateConfig = (): void => {
  const required = [
    "firebaseApiKey",
    "firebaseAuthDomain",
    "firebaseProjectId",
    "firebaseStorageBucket",
    "firebaseMessagingSenderId",
    "firebaseAppId",
  ];

  for (const key of required) {
    if (!config[key as keyof AppConfig]) {
      console.error(`Missing required config: ${key}`);
      throw new Error(`Configuration error: ${key} is required`);
    }
  }
};
```

---

## Environment-Specific Behavior

```typescript
// src/config/features.ts
import { config } from "./environment";

export const features = {
  // Enable debug logging in development
  enableDebugLogs: config.isDev,

  // Show developer menu
  showDevMenu: config.isDev,

  // Use Firebase Emulator (only in development)
  useFirebaseEmulator:
    config.isDev && process.env.USE_FIREBASE_EMULATOR === "true",

  // Analytics
  enableAnalytics: config.isProd,

  // Crash reporting (add post-MVP)
  enableCrashReporting: config.isProd,
};
```

---

## Security Best Practices

### ✅ DO

1. **Always use `.env.example`** as a template (commit this)
2. **Use EAS Secrets** for production builds
3. **Use Firebase Secrets** for Cloud Functions
4. **Validate config on app startup**
5. **Use different Firebase projects** for dev/staging/prod

### ❌ DON'T

1. **Never commit `.env`** to version control
2. **Never hardcode API keys** in source code
3. **Never log sensitive values** in production
4. **Never share secrets** via chat/email

---

## Troubleshooting

### "Firebase configuration missing" Error

**Cause**: Environment variables not loaded properly.

**Solution**:

1. Ensure `.env` file exists in project root
2. Restart Metro bundler: `npm start --clear`
3. Check `app.config.ts` is reading variables correctly

### "Invalid API Key" in Production

**Cause**: EAS Secrets not set or different from development.

**Solution**:

1. Verify secrets are set: `eas secret:list`
2. Ensure secret names match exactly
3. Rebuild: `eas build --platform ios --profile production`

### Firebase Emulator Not Connecting

**Cause**: Emulator host not accessible from device.

**Solution**:

1. Use your computer's IP instead of `localhost`
2. Ensure emulator is running: `firebase emulators:start`
3. Check firewall settings

---

## Quick Reference

| Environment | Bundle ID                   | Firebase Project  | Build Command                     |
| ----------- | --------------------------- | ----------------- | --------------------------------- |
| Development | `*.dev`                     | dreampath-dev     | `eas build --profile development` |
| Preview     | `*.preview`                 | dreampath-staging | `eas build --profile preview`     |
| Production  | `com.yourcompany.dreampath` | dreampath-prod    | `eas build --profile production`  |

---

**Remember**: Keep your secrets secret! 🔐
