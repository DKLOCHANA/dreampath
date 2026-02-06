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
import { subscribeToAuthChanges } from '@/infrastructure/firebase/authService';
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
        return <LoadingScreen message="Starting DreamPath..." />;
    }

    // Navigation logic:
    // 1. Authenticated → Main (Home)
    // 2. Not authenticated → Onboarding first, then Auth (Register/Login)

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                <Stack.Screen name="Main" component={MainNavigator} />
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
