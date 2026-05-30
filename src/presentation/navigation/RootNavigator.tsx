// src/presentation/navigation/RootNavigator.tsx
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { LoadingScreen } from '@/presentation/components/common';
import { useAuthStore } from '@/infrastructure/stores/authStore';
import { useSubscriptionStore } from '@/infrastructure/stores/subscriptionStore';
import { subscribeToAuthChanges } from '@/infrastructure/firebase/authService';
import PaywallScreen from '@/presentation/screens/main/PaywallScreen';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Timeout for initialization (15 seconds)
const INIT_TIMEOUT = 15000;

export const RootNavigator: React.FC = () => {
    const {
        isAuthenticated,
        isLoading,
        isInitialized,
        user,
        setUser,
        setInitialized,
        setLoading,
    } = useAuthStore();

    const [initError, setInitError] = useState<string | null>(null);
    const [isTimedOut, setIsTimedOut] = useState(false);

    // Subscription gate: after authentication, non-pro users are forced into
    // the hard paywall. We wait until RevenueCat has identified the current
    // Firebase user (identifiedUserId === user.id) before deciding, so a
    // returning pro user doesn't briefly flicker through the paywall while
    // the anonymous customerInfo is being swapped for their identified one.
    const isPro = useSubscriptionStore((s) => s.isPro);
    const isSubscriptionConfigured = useSubscriptionStore((s) => s.isConfigured);
    const identifiedUserId = useSubscriptionStore((s) => s.identifiedUserId);
    const identifyError = useSubscriptionStore((s) => s.identifyError);
    const isUserIdentified = !!user && identifiedUserId === user.id;

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;
        let timeoutId: NodeJS.Timeout;

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
            if (!isInitialized) {
                console.warn('[RootNavigator] Initialization timed out');
                setIsTimedOut(true);
                // Force initialization to allow app to continue
                setInitialized(true);
            }
        }, INIT_TIMEOUT);

        try {
            unsubscribe = subscribeToAuthChanges((user) => {
                clearTimeout(timeoutId);
                setUser(user);
                setInitialized(true);
                setInitError(null);
            });
        } catch (error) {
            console.error('[RootNavigator] Auth subscription error:', error);
            setInitError('Failed to connect to authentication service');
            setInitialized(true); // Allow app to continue to show error
            clearTimeout(timeoutId);
        }

        return () => {
            clearTimeout(timeoutId);
            if (unsubscribe) unsubscribe();
        };
    }, [setUser, setInitialized]);

    // Show error screen if there was an initialization error
    if (initError || isTimedOut) {
        return (
            <View style={errorStyles.container}>
                <Text style={errorStyles.emoji}>⚠️</Text>
                <Text style={errorStyles.title}>Connection Issue</Text>
                <Text style={errorStyles.message}>
                    {initError || 'Unable to connect to the server. Please check your internet connection and try again.'}
                </Text>
                <TouchableOpacity
                    style={errorStyles.button}
                    onPress={() => {
                        setInitError(null);
                        setIsTimedOut(false);
                        setInitialized(false);
                        setLoading(true);
                    }}
                >
                    <Text style={errorStyles.buttonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!isInitialized || isLoading) {
        return <LoadingScreen message="Starting VividGoals..." />;
    }

    // If RevenueCat couldn't identify the current user (network failure after
    // retries), show a retry UI instead of leaving the user stuck on the
    // loading spinner. Tapping Retry re-runs logIn(user.id).
    if (isAuthenticated && identifyError && !isUserIdentified && user) {
        return (
            <View style={errorStyles.container}>
                <Text style={errorStyles.emoji}>⚠️</Text>
                <Text style={errorStyles.title}>Connection Issue</Text>
                <Text style={errorStyles.message}>
                    We couldn't verify your subscription. Please check your internet connection and try again.
                </Text>
                <TouchableOpacity
                    style={errorStyles.button}
                    onPress={() => {
                        useSubscriptionStore.getState().logIn(user.id);
                    }}
                >
                    <Text style={errorStyles.buttonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Wait for RevenueCat before routing an authenticated user — prevents a
    // pro user from briefly seeing the hard paywall on launch.
    if (isAuthenticated && (!isSubscriptionConfigured || !isUserIdentified)) {
        return <LoadingScreen message="Starting VividGoals..." />;
    }

    // Navigation logic:
    // 1. Authenticated + pro → Main (Home)
    // 2. Authenticated + non-pro → Hard paywall (cannot be skipped)
    // 3. Not authenticated → Onboarding first, then Auth (Register/Login)

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                isPro ? (
                    <Stack.Screen name="Main" component={MainNavigator} />
                ) : (
                    <Stack.Screen
                        name="HardPaywall"
                        component={PaywallScreen}
                        initialParams={{ hard: true }}
                        options={{ gestureEnabled: false }}
                    />
                )
            ) : (
                <>
                    <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                </>
            )}
        </Stack.Navigator>
    );
};

const errorStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
        padding: spacing.screenPadding,
    },
    emoji: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.variants.h2,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    message: {
        ...typography.variants.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        maxWidth: 300,
    },
    button: {
        backgroundColor: colors.primary.main,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 12,
        minWidth: 160,
    },
    buttonText: {
        ...typography.variants.buttonMedium,
        color: colors.text.inverse,
        textAlign: 'center',
    },
});

export default RootNavigator;
