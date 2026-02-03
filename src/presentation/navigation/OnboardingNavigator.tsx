// src/presentation/navigation/OnboardingNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingStackParamList } from './types';
import {
    OnboardingWelcomeScreen,
    QuestionScreen,
    Report1Screen,
    Report2Screen,
    Report3Screen,
    Report4Screen,
    FinalWelcomeScreen,
} from '@/presentation/screens/onboarding';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: false,
            }}
        >
            <Stack.Screen
                name="OnboardingWelcome"
                component={OnboardingWelcomeScreen}
            />
            <Stack.Screen
                name="Question"
                component={QuestionScreen}
            />
            <Stack.Screen
                name="Report1"
                component={Report1Screen}
            />
            <Stack.Screen
                name="Report2"
                component={Report2Screen}
            />
            <Stack.Screen
                name="Report3"
                component={Report3Screen}
            />
            <Stack.Screen
                name="Report4"
                component={Report4Screen}
            />
            <Stack.Screen
                name="FinalWelcome"
                component={FinalWelcomeScreen}
            />
        </Stack.Navigator>
    );
};

export default OnboardingNavigator;
