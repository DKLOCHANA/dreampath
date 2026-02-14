import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/presentation/navigation/RootNavigator';
import { ErrorBoundary } from './src/presentation/components/common/ErrorBoundary';
import { useSubscriptionStore } from './src/infrastructure/stores/subscriptionStore';
import { useAuthStore } from './src/infrastructure/stores/authStore';

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
  useRevenueCatSetup();

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
