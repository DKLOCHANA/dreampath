// src/presentation/screens/onboarding/YearsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    OnboardingLayout,
    OnboardingButton,
    OptionChip,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import {
    YearsBand,
    useOnboardingStore,
} from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Years'>;

const YEAR_OPTIONS: YearsBand[] = [
    'Less than a year',
    '1–3 years',
    '3–5 years',
    '5+ years',
    'I keep restarting',
];

export const YearsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const name = useOnboardingStore((s) => s.name);
    const years = useOnboardingStore((s) => s.years);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <OnboardingLayout
            step={6}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Continue"
                    onPress={() => navigation.navigate('Bombshell')}
                    disabled={!years}
                />
            }
        >
            <View style={styles.body}>
                <Text style={styles.headline}>
                    Be honest, {name || 'friend'}.{'\n'}
                    <Text style={styles.accent}>How long</Text> have you been trying to make this happen?
                </Text>
                <Text style={styles.sub}>No judgement. Just data.</Text>
                <View style={styles.list}>
                    {YEAR_OPTIONS.map((option) => (
                        <OptionChip
                            key={option}
                            label={option}
                            active={years === option}
                            onPress={() => setAnswer('years', option)}
                        />
                    ))}
                </View>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        paddingTop: spacing.md,
    },
    headline: {
        ...typography.variants.h2,
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.5,
        marginBottom: spacing.sm,
    },
    accent: {
        color: colors.primary.main,
    },
    sub: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        marginBottom: spacing.lg,
    },
    list: {
        gap: spacing.sm + 2,
    },
});

export default YearsScreen;
