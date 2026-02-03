// src/presentation/navigation/RootNavigator.tsx
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { LoadingScreen } from '@/presentation/components/common';
import { useAuthStore } from '@/infrastructure/stores/authStore';
import { subscribeToAuthChanges } from '@/infrastructure/firebase/authService';

const Stack = createNativeStackNavigator<RootStackParamList>();

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

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((user) => {
            setUser(user);
            setInitialized(true);
        });

        return () => unsubscribe();
    }, [setUser, setInitialized]);

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

export default RootNavigator;
