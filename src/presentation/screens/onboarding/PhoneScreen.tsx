// src/presentation/screens/onboarding/PhoneScreen.tsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { QuestionFrame, QuestionOption } from './_QuestionFrame';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Phone'>;

const OPTIONS: QuestionOption[] = [
    { value: 'It runs my day', emoji: '📵' },
    { value: "I'm working on it", emoji: '⚖️' },
    { value: 'I use it as a tool', emoji: '🛠️' },
    { value: "It's the enemy", emoji: '⚔️' },
];

export const PhoneScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const phone = useOnboardingStore((s) => s.phone);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <QuestionFrame
            step={17}
            label="REFLECTION"
            title="What's your relationship with your phone right now?"
            options={OPTIONS}
            value={phone}
            onChange={(v) => setAnswer('phone', v)}
            onBack={() => navigation.goBack()}
            onContinue={() => navigation.navigate('SecondMirror')}
        />
    );
};

export default PhoneScreen;
