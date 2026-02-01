# DreamPath - Error Handling Guide

## Comprehensive Error Handling Strategy

This document defines error types, user-facing messages, and handling patterns for a robust user experience.

---

## Error Handling Principles

1. **User-First**: Always show friendly, actionable messages
2. **Never Expose Technical Details**: Log internally, hide from users
3. **Graceful Degradation**: App should remain usable even when parts fail
4. **Retry When Appropriate**: Network issues should auto-retry
5. **Offline-First**: Core features work without internet

---

## Error Types

### 1. Network Errors

```typescript
// src/shared/errors/NetworkError.ts

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly isRetryable: boolean = true,
    public readonly retryAfterMs: number = 3000,
  ) {
    super(message);
    this.name = "NetworkError";
  }

  static noConnection(): NetworkError {
    return new NetworkError("No internet connection", true, 5000);
  }

  static timeout(): NetworkError {
    return new NetworkError("Request timed out", true, 3000);
  }

  static serverError(): NetworkError {
    return new NetworkError("Server temporarily unavailable", true, 10000);
  }
}
```

### 2. Authentication Errors

```typescript
// src/shared/errors/AuthError.ts

export enum AuthErrorCode {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  EMAIL_IN_USE = "EMAIL_IN_USE",
  WEAK_PASSWORD = "WEAK_PASSWORD",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN = "UNKNOWN",
}

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    public readonly userMessage: string,
  ) {
    super(userMessage);
    this.name = "AuthError";
  }

  static fromFirebaseError(error: any): AuthError {
    const errorMap: Record<string, [AuthErrorCode, string]> = {
      "auth/invalid-credential": [
        AuthErrorCode.INVALID_CREDENTIALS,
        "Invalid email or password. Please try again.",
      ],
      "auth/email-already-in-use": [
        AuthErrorCode.EMAIL_IN_USE,
        "This email is already registered. Try signing in instead.",
      ],
      "auth/weak-password": [
        AuthErrorCode.WEAK_PASSWORD,
        "Password must be at least 6 characters long.",
      ],
      "auth/user-not-found": [
        AuthErrorCode.USER_NOT_FOUND,
        "No account found with this email. Create a new account?",
      ],
      "auth/too-many-requests": [
        AuthErrorCode.TOO_MANY_ATTEMPTS,
        "Too many failed attempts. Please wait a few minutes and try again.",
      ],
      "auth/network-request-failed": [
        AuthErrorCode.NETWORK_ERROR,
        "Connection failed. Check your internet and try again.",
      ],
    };

    const [code, message] = errorMap[error.code] || [
      AuthErrorCode.UNKNOWN,
      "Something went wrong. Please try again.",
    ];

    return new AuthError(code, message);
  }
}
```

### 3. Validation Errors

```typescript
// src/shared/errors/ValidationError.ts

export interface FieldError {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = "ValidationError";
  }

  static field(field: string, message: string): ValidationError {
    return new ValidationError(message, [{ field, message }]);
  }

  static multiple(errors: FieldError[]): ValidationError {
    return new ValidationError("Validation failed", errors);
  }

  getFieldError(field: string): string | undefined {
    return this.fieldErrors.find((e) => e.field === field)?.message;
  }
}
```

### 4. Firebase/Database Errors

```typescript
// src/shared/errors/DatabaseError.ts

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation: "read" | "write" | "delete" | "query",
    public readonly isRetryable: boolean = true,
  ) {
    super(message);
    this.name = "DatabaseError";
  }

  static fromFirestoreError(error: any, operation: string): DatabaseError {
    const errorMap: Record<string, [string, boolean]> = {
      "permission-denied": [
        "You don't have permission to perform this action.",
        false,
      ],
      "not-found": ["The requested data was not found.", false],
      "already-exists": ["This item already exists.", false],
      "resource-exhausted": ["Too many requests. Please wait a moment.", true],
      unavailable: ["Service temporarily unavailable. Retrying...", true],
    };

    const [message, isRetryable] = errorMap[error.code] || [
      "Failed to save your changes. Please try again.",
      true,
    ];

    return new DatabaseError(message, operation as any, isRetryable);
  }
}
```

### 5. AI/API Errors

```typescript
// src/shared/errors/AIError.ts

export enum AIErrorCode {
  RATE_LIMITED = "RATE_LIMITED",
  CONTEXT_TOO_LONG = "CONTEXT_TOO_LONG",
  INVALID_RESPONSE = "INVALID_RESPONSE",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
}

export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    public readonly userMessage: string,
    public readonly isRetryable: boolean = false,
  ) {
    super(userMessage);
    this.name = "AIError";
  }

  static rateLimited(remainingCalls: number): AIError {
    return new AIError(
      AIErrorCode.RATE_LIMITED,
      remainingCalls === 0
        ? "You've used all your AI analyses for today. Check back tomorrow!"
        : `You can analyze ${remainingCalls} more goals today.`,
      false,
    );
  }

  static quotaExceeded(): AIError {
    return new AIError(
      AIErrorCode.QUOTA_EXCEEDED,
      "You've reached your monthly limit. Upgrade to Premium for unlimited analyses.",
      false,
    );
  }

  static serviceUnavailable(): AIError {
    return new AIError(
      AIErrorCode.SERVICE_UNAVAILABLE,
      "AI service is temporarily unavailable. Please try again in a few minutes.",
      true,
    );
  }

  static invalidResponse(): AIError {
    return new AIError(
      AIErrorCode.INVALID_RESPONSE,
      "Something went wrong analyzing your goal. Please try again.",
      true,
    );
  }
}
```

---

## User-Facing Error Messages

### Message Guidelines

| ✅ Good                                                                   | ❌ Bad                                         |
| ------------------------------------------------------------------------- | ---------------------------------------------- |
| "No internet connection. Your changes will sync when you're back online." | "Network request failed: ERR_NETWORK"          |
| "Invalid email or password. Please try again."                            | "Firebase Auth Error: auth/invalid-credential" |
| "Something went wrong. Please try again."                                 | "Unhandled exception at 0x00007FF..."          |

### Error Message Components

```typescript
// src/shared/types/ErrorMessage.ts

export interface ErrorMessage {
  title: string; // Short, clear heading
  message: string; // Explanation
  action?: {
    label: string; // Button text
    onPress: () => void; // Action handler
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  icon?: "error" | "warning" | "info" | "offline";
  dismissable?: boolean;
}

// Pre-defined error messages
export const ErrorMessages = {
  offline: {
    title: "You're Offline",
    message:
      "No worries! You can still view your tasks. Changes will sync when you're back online.",
    icon: "offline" as const,
    dismissable: true,
  },

  syncFailed: {
    title: "Sync Failed",
    message:
      "Some changes couldn't be saved. We'll keep trying in the background.",
    action: {
      label: "Retry Now",
      onPress: () => {}, // Will be set dynamically
    },
    icon: "warning" as const,
    dismissable: true,
  },

  sessionExpired: {
    title: "Session Expired",
    message: "Please sign in again to continue.",
    action: {
      label: "Sign In",
      onPress: () => {}, // Navigate to login
    },
    icon: "info" as const,
    dismissable: false,
  },

  aiUnavailable: {
    title: "AI Temporarily Unavailable",
    message:
      "We're having trouble generating your plan. Please try again in a few minutes.",
    action: {
      label: "Try Again",
      onPress: () => {},
    },
    icon: "warning" as const,
    dismissable: true,
  },

  genericError: {
    title: "Something Went Wrong",
    message: "Please try again. If the problem continues, contact support.",
    action: {
      label: "Try Again",
      onPress: () => {},
    },
    secondaryAction: {
      label: "Contact Support",
      onPress: () => {},
    },
    icon: "error" as const,
    dismissable: true,
  },
};
```

---

## Error Handling Patterns

### 1. Global Error Boundary

```typescript
// src/presentation/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service (post-MVP: Crashlytics)
    console.error('Error caught by boundary:', error, errorInfo);

    // In production, send to crash reporting
    // crashlytics().recordError(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            We're sorry for the inconvenience. Please try again.
          </Text>
          <Button title="Try Again" onPress={this.handleRetry} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
});
```

### 2. Async Error Handler Hook

```typescript
// src/presentation/hooks/useAsyncHandler.ts

import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { NetworkError } from "@shared/errors/NetworkError";
import { AuthError } from "@shared/errors/AuthError";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncHandlerOptions {
  showAlert?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export function useAsyncHandler<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncHandlerOptions = {},
) {
  const { showAlert = true, retryCount = 3, retryDelay = 1000 } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        const result = await asyncFn();
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        lastError = error as Error;

        // Don't retry non-retryable errors
        if (error instanceof NetworkError && !error.isRetryable) {
          break;
        }
        if (error instanceof AuthError) {
          break; // Auth errors shouldn't be retried
        }

        // Wait before retry
        if (attempt < retryCount - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1)),
          );
        }
      }
    }

    setState({ data: null, loading: false, error: lastError });

    if (showAlert && lastError) {
      const message = getErrorMessage(lastError);
      Alert.alert("Error", message);
    }

    throw lastError;
  }, [asyncFn, retryCount, retryDelay, showAlert]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

function getErrorMessage(error: Error): string {
  if (error instanceof AuthError) {
    return error.userMessage;
  }
  if (error instanceof NetworkError) {
    return "Connection failed. Please check your internet and try again.";
  }
  return "Something went wrong. Please try again.";
}
```

### 3. Form Error Handling

```typescript
// src/presentation/hooks/useFormWithErrors.ts

import { useForm, UseFormProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema } from "zod";

export function useFormWithErrors<T extends Record<string, any>>(
  schema: ZodSchema<T>,
  options?: Omit<UseFormProps<T>, "resolver">,
) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: "onBlur", // Validate on blur for better UX
    ...options,
  });

  const getFieldError = (fieldName: keyof T): string | undefined => {
    const error = form.formState.errors[fieldName];
    return error?.message as string | undefined;
  };

  const hasFieldError = (fieldName: keyof T): boolean => {
    return !!form.formState.errors[fieldName];
  };

  const clearFieldError = (fieldName: keyof T) => {
    form.clearErrors(fieldName);
  };

  return {
    ...form,
    getFieldError,
    hasFieldError,
    clearFieldError,
  };
}
```

### 4. API Error Interceptor

```typescript
// src/infrastructure/firebase/errorInterceptor.ts

import { DatabaseError } from "@shared/errors/DatabaseError";
import { AIError, AIErrorCode } from "@shared/errors/AIError";

type AsyncFunction<T> = () => Promise<T>;

export async function withFirestoreErrorHandling<T>(
  operation: string,
  fn: AsyncFunction<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    console.error(`Firestore ${operation} error:`, error);
    throw DatabaseError.fromFirestoreError(error, operation);
  }
}

export async function withCloudFunctionErrorHandling<T>(
  fn: AsyncFunction<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    console.error("Cloud Function error:", error);

    // Handle specific function errors
    if (error.code === "functions/resource-exhausted") {
      throw AIError.rateLimited(0);
    }
    if (error.code === "functions/unavailable") {
      throw AIError.serviceUnavailable();
    }
    if (error.message?.includes("quota")) {
      throw AIError.quotaExceeded();
    }

    throw AIError.invalidResponse();
  }
}
```

---

## Offline Error Handling

### Offline Detection

```typescript
// src/shared/hooks/useNetworkStatus.ts

import { useState, useEffect } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? true);
      setConnectionType(state.type);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, connectionType };
}
```

### Offline Queue

```typescript
// src/infrastructure/offline/OfflineQueue.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = "@offline_queue";

export class OfflineQueue {
  static async add(type: string, payload: any): Promise<void> {
    const queue = await this.getQueue();
    const action: QueuedAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(action);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  static async getQueue(): Promise<QueuedAction[]> {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static async remove(id: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((action) => action.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  }

  static async processQueue(
    handlers: Record<string, (payload: any) => Promise<void>>,
  ): Promise<{ success: number; failed: number }> {
    const queue = await this.getQueue();
    let success = 0;
    let failed = 0;

    for (const action of queue) {
      const handler = handlers[action.type];
      if (!handler) {
        await this.remove(action.id);
        continue;
      }

      try {
        await handler(action.payload);
        await this.remove(action.id);
        success++;
      } catch (error) {
        failed++;
        // Keep in queue for next attempt
        action.retryCount++;
        if (action.retryCount >= 5) {
          await this.remove(action.id); // Give up after 5 attempts
        }
      }
    }

    return { success, failed };
  }

  static async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }
}
```

---

## Logging Strategy

### Development vs Production

```typescript
// src/shared/utils/logger.ts

const isDev = __DEV__;

export const logger = {
  debug: (...args: any[]) => {
    if (isDev) {
      console.log("[DEBUG]", ...args);
    }
  },

  info: (...args: any[]) => {
    if (isDev) {
      console.info("[INFO]", ...args);
    }
    // In production: send to analytics
  },

  warn: (...args: any[]) => {
    console.warn("[WARN]", ...args);
    // In production: send to monitoring
  },

  error: (message: string, error?: Error, context?: object) => {
    console.error("[ERROR]", message, error);

    // In production: send to crash reporting
    // crashlytics().log(message);
    // if (error) crashlytics().recordError(error);

    // Track in analytics
    // analytics().logEvent('app_error', { message, ...context });
  },
};
```

---

## Testing Error Scenarios

### Error Simulation for Testing

```typescript
// __tests__/utils/errorSimulator.ts

export const simulateNetworkError = () => {
  throw new Error("Network request failed");
};

export const simulateAuthError = (code: string) => {
  const error = new Error("Auth error");
  (error as any).code = code;
  throw error;
};

export const simulateFirestoreError = (code: string) => {
  const error = new Error("Firestore error");
  (error as any).code = code;
  throw error;
};

// Use in tests
describe("Error Handling", () => {
  it("shows friendly message for network errors", async () => {
    // Mock the API to throw network error
    jest.spyOn(api, "fetchGoals").mockImplementation(simulateNetworkError);

    // Verify user sees friendly message
    // ...
  });
});
```

---

## Error Recovery Flows

### 1. Session Recovery

When session expires:

1. Show non-dismissable modal
2. Clear local auth state
3. Navigate to login screen
4. After successful login, restore previous screen

### 2. Sync Recovery

When offline changes fail to sync:

1. Show toast notification
2. Keep changes in offline queue
3. Retry on next app open or connectivity restore
4. If still failing after 5 attempts, prompt user

### 3. AI Generation Recovery

When AI fails:

1. Show retry option
2. If retry fails, suggest manual goal setup
3. Offer to save goal as draft without AI plan

---

**Remember**: A good error is invisible to the user. The best error handling is when things just work! 🎯
