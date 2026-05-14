// src/presentation/screens/onboarding/GoalAreaScreen.tsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { QuestionFrame, QuestionOption } from './_QuestionFrame';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'GoalArea'>;

const OPTIONS: QuestionOption[] = [
    { value: 'Career — promotion or new job', emoji: '💼' },
    { value: 'Start or grow a business', emoji: '🚀' },
    { value: 'Health, fitness, weight', emoji: '💪' },
    { value: 'Financial freedom or debt-free', emoji: '💰' },
    { value: 'A creative project (book, music, art)', emoji: '🎨' },
    { value: 'Learn a skill or study', emoji: '📚' },
    { value: 'Relationships or family', emoji: '❤️' },
    { value: 'Something personal', emoji: '✨' },
];

export const GoalAreaScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const goalArea = useOnboardingStore((s) => s.goalArea);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <QuestionFrame
            step={9}
            label="QUESTION 1/6"
            title="What's your dream about?"
            sub="Pick the one that matters most right now."
            options={OPTIONS}
            value={goalArea}
            onChange={(v) => setAnswer('goalArea', v)}
            onBack={() => navigation.goBack()}
            onContinue={() => navigation.navigate('Blockers')}
        />
    );
};

export default GoalAreaScreen;
