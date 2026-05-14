// src/presentation/screens/onboarding/Checkin2Screen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    OnboardingLayout,
    OnboardingButton,
    SectionLabel,
    EmojiCard,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Checkin2'>;

const OPTIONS: Array<{ label: string; emoji: string }> = [
    { label: 'Drained', emoji: '🪫' },
    { label: 'Low', emoji: '😴' },
    { label: 'Steady', emoji: '🔋' },
    { label: 'Charged', emoji: '⚡' },
];

export const Checkin2Screen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const checkin2 = useOnboardingStore((s) => s.checkin2);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <OnboardingLayout
            step={21}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Build today's step"
                    onPress={() => navigation.navigate('MiniPlan')}
                    disabled={!checkin2}
                />
            }
        >
            <View style={styles.body}>
                <SectionLabel>YOUR DAILY CHECK-IN · 2 OF 2</SectionLabel>
                <Text style={styles.headline}>And how's the energy?</Text>
                <Text style={styles.sub}>We'll size today's step to fit it.</Text>
                <View style={styles.grid}>
                    <View style={styles.row}>
                        {OPTIONS.slice(0, 2).map((opt) => (
                            <EmojiCard
                                key={opt.label}
                                label={opt.label}
                                emoji={opt.emoji}
                                active={checkin2 === opt.label}
                                onPress={() => setAnswer('checkin2', opt.label)}
                            />
                        ))}
                    </View>
                    <View style={styles.row}>
                        {OPTIONS.slice(2).map((opt) => (
                            <EmojiCard
                                key={opt.label}
                                label={opt.label}
                                emoji={opt.emoji}
                                active={checkin2 === opt.label}
                                onPress={() => setAnswer('checkin2', opt.label)}
                            />
                        ))}
                    </View>
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
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.5,
        marginTop: spacing.xs + 2,
    },
    sub: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    grid: {
        gap: spacing.md - 2,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md - 2,
    },
});

export default Checkin2Screen;
