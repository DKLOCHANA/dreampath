// src/presentation/screens/onboarding/AnalyticsScreen.tsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { QuestionFrame, QuestionOption } from './_QuestionFrame';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Analytics'>;

const OPTIONS: QuestionOption[] = [
    { value: 'A specific person or relationship', emoji: '👤' },
    { value: 'My own self-doubt', emoji: '😔' },
    { value: 'Money / resources', emoji: '💸' },
    { value: 'Just life — kids, work, chaos', emoji: '🌀' },
    { value: 'Honestly? Myself.', emoji: '🪞' },
];

export const AnalyticsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const analytics1 = useOnboardingStore((s) => s.analytics1);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <QuestionFrame
            step={16}
            label="REFLECTION"
            title="What's gotten in your way before?"
            options={OPTIONS}
            value={analytics1}
            onChange={(v) => setAnswer('analytics1', v)}
            onBack={() => navigation.goBack()}
            onContinue={() => navigation.navigate('Phone')}
        />
    );
};

export default AnalyticsScreen;
