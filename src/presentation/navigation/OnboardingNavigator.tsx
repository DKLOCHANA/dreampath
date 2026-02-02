// src/presentation/navigation/OnboardingNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';

// Screens
import OnboardingIntroScreen from '@/presentation/screens/onboarding/OnboardingIntroScreen';
import OnboardingGoalScreen from '@/presentation/screens/onboarding/OnboardingGoalScreen';
import OnboardingPersonalScreen from '@/presentation/screens/onboarding/OnboardingPersonalScreen';
import OnboardingSkillsScreen from '@/presentation/screens/onboarding/OnboardingSkillsScreen';
import OnboardingCompleteScreen from '@/presentation/screens/onboarding/OnboardingCompleteScreen';

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
            <Stack.Screen name="OnboardingIntro" component={OnboardingIntroScreen} />
            <Stack.Screen name="OnboardingGoal" component={OnboardingGoalScreen} />
            <Stack.Screen name="OnboardingPersonal" component={OnboardingPersonalScreen} />
            <Stack.Screen name="OnboardingSkills" component={OnboardingSkillsScreen} />
            <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
        </Stack.Navigator>
    );
};

export default OnboardingNavigator;
