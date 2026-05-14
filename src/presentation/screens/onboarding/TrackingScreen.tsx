// src/presentation/screens/onboarding/TrackingScreen.tsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { QuestionFrame, QuestionOption } from './_QuestionFrame';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Tracking'>;

const OPTIONS: QuestionOption[] = [
    { value: 'All in my head', emoji: '🧠' },
    { value: 'A notes app or spreadsheet', emoji: '📝' },
    { value: 'I keep starting apps and abandoning them', emoji: '📱' },
    { value: "I don't track — I just hope", emoji: '🤷' },
];

export const TrackingScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const tracking = useOnboardingStore((s) => s.tracking);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <QuestionFrame
            step={11}
            label="QUESTION 3/6"
            title="How do you track your goals today?"
            options={OPTIONS}
            value={tracking}
            onChange={(v) => setAnswer('tracking', v)}
            onBack={() => navigation.goBack()}
            onContinue={() => navigation.navigate('Momentum')}
        />
    );
};

export default TrackingScreen;
