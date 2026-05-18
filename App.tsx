import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/presentation/navigation/RootNavigator';
import { ErrorBoundary } from './src/presentation/components/common/ErrorBoundary';
import { useSubscriptionStore } from './src/infrastructure/stores/subscriptionStore';
import { useAuthStore } from './src/infrastructure/stores/authStore';
import { initializeAppsFlyer, syncAppsFlyerIdToRevenueCat } from './src/services/appsflyerService';
import { initializeNotificationHandler, handleAppLaunch } from './src/services/notificationService';

// Configure notification display behavior before any notification can arrive
initializeNotificationHandler();

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Initializes AppsFlyer early (install attribution + ATT wait window), then
 * sets `$appsflyerId` on the RevenueCat subscriber when Purchases is ready.
 * After Firebase login, `subscriptionStore.logIn` runs `syncAppsFlyerIdToRevenueCat`
 * again so the identified customer carries the AppsFlyer ID.
 */
function useAppsFlyerSetup() {
  const isConfigured = useSubscriptionStore((s) => s.isConfigured);

  useEffect(() => {
    initializeAppsFlyer().catch(() => {
      // Non-critical — app continues without attribution
    });
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    syncAppsFlyerIdToRevenueCat();
  }, [isConfigured]);
}

/**
 * Initializes RevenueCat and syncs user identity when auth state changes.
 */
function useRevenueCatSetup() {
  const initialize = useSubscriptionStore((s) => s.initialize);
  const logIn = useSubscriptionStore((s) => s.logIn);
  const logOut = useSubscriptionStore((s) => s.logOut);
  const isConfigured = useSubscriptionStore((s) => s.isConfigured);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Initialize RevenueCat on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync RevenueCat user identity with Firebase auth
  useEffect(() => {
    if (!isConfigured) return;

    if (isAuthenticated && user?.id) {
      // User logged in — identify them in RevenueCat
      logIn(user.id);
    } else if (!isAuthenticated) {
      // User logged out — reset to anonymous
      logOut();
    }
  }, [isConfigured, isAuthenticated, user?.id, logIn, logOut]);
}

function AppContent() {
  useAppsFlyerSetup();
  useRevenueCatSetup();

  // Reset the 12-hour reengagement window on every launch
  useEffect(() => {
    handleAppLaunch();
  }, []);

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AppContent />
          </QueryClientProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
