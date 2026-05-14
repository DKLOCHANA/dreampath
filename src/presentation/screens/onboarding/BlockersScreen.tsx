// src/presentation/screens/onboarding/BlockersScreen.tsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { QuestionFrame, QuestionOption } from './_QuestionFrame';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Blockers'>;

const OPTIONS: QuestionOption[] = [
    { value: "I don't know where to start", emoji: '🧭' },
    { value: 'I lose steam after a few weeks', emoji: '📉' },
    { value: "I'm too busy with life right now", emoji: '⏰' },
    { value: 'I doubt I can actually do it', emoji: '😬' },
    { value: 'Every plan I make falls apart', emoji: '💥' },
    { value: 'I get distracted by new ideas', emoji: '⚡' },
];

export const BlockersScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const blockers = useOnboardingStore((s) => s.blockers);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <QuestionFrame
            multi
            max={2}
            step={10}
            label="QUESTION 2/6"
            title="What's actually stopping you?"
            sub="Pick up to 2 — be honest."
            options={OPTIONS}
            value={blockers}
            onChange={(v) => setAnswer('blockers', v)}
            onBack={() => navigation.goBack()}
            onContinue={() => navigation.navigate('Tracking')}
        />
    );
};

export default BlockersScreen;
