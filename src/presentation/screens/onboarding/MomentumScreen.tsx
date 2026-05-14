// src/presentation/screens/onboarding/MomentumScreen.tsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { QuestionFrame, QuestionOption } from './_QuestionFrame';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Momentum'>;

const OPTIONS: QuestionOption[] = [
    { value: 'This week', emoji: '🔥' },
    { value: 'This month', emoji: '📅' },
    { value: 'This year', emoji: '🗓️' },
    { value: "I honestly can't remember", emoji: '💭' },
];

export const MomentumScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const lastMomentum = useOnboardingStore((s) => s.lastMomentum);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <QuestionFrame
            step={12}
            label="QUESTION 4/6"
            title="When was the last time you felt real momentum on this?"
            options={OPTIONS}
            value={lastMomentum}
            onChange={(v) => setAnswer('lastMomentum', v)}
            onBack={() => navigation.goBack()}
            onContinue={() => navigation.navigate('DailyTime')}
        />
    );
};

export default MomentumScreen;
