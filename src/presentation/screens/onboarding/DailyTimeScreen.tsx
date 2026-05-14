// src/presentation/screens/onboarding/DailyTimeScreen.tsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    DailyTimeBand,
    useOnboardingStore,
} from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { QuestionFrame, QuestionOption } from './_QuestionFrame';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'DailyTime'>;

const OPTIONS: QuestionOption[] = [
    { value: "10 minutes — I'm slammed", emoji: '⚡' },
    { value: '20–30 minutes', emoji: '⏳' },
    { value: 'An hour', emoji: '🕐' },
    { value: 'More if I see it working', emoji: '🚀' },
];

export const DailyTimeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const daily = useOnboardingStore((s) => s.daily);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <QuestionFrame
            step={13}
            label="QUESTION 5/6"
            title="How much time can you actually give it each day?"
            sub="Pick what's true, not what sounds good."
            options={OPTIONS}
            value={daily}
            onChange={(v) => setAnswer('daily', v as DailyTimeBand)}
            onBack={() => navigation.goBack()}
            onContinue={() => navigation.navigate('Payoff')}
        />
    );
};

export default DailyTimeScreen;
