// src/presentation/screens/onboarding/PayoffScreen.tsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { QuestionFrame, QuestionOption } from './_QuestionFrame';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Payoff'>;

const OPTIONS: QuestionOption[] = [
    { value: 'Relief — I stop dragging it around', emoji: '😮‍💨' },
    { value: 'Pride — I prove it to myself', emoji: '🏆' },
    { value: 'Freedom — it changes my whole life', emoji: '🕊️' },
    { value: 'Peace — for me and the people I love', emoji: '🤍' },
];

export const PayoffScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const payoff = useOnboardingStore((s) => s.payoff);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <QuestionFrame
            step={14}
            label="QUESTION 6/6"
            title="When this is done — what does it feel like?"
            options={OPTIONS}
            value={payoff}
            onChange={(v) => setAnswer('payoff', v)}
            onBack={() => navigation.goBack()}
            onContinue={() => navigation.navigate('Mirror')}
        />
    );
};

export default PayoffScreen;
