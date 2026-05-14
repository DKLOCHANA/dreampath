// src/presentation/screens/onboarding/Checkin1Screen.tsx
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

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Checkin1'>;

const OPTIONS: Array<{ label: string; emoji: string }> = [
    { label: 'Off-track', emoji: '😶' },
    { label: 'Distracted', emoji: '😐' },
    { label: 'Okay', emoji: '🙂' },
    { label: 'Locked in', emoji: '🔥' },
];

export const Checkin1Screen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const checkin1 = useOnboardingStore((s) => s.checkin1);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <OnboardingLayout
            step={20}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Next"
                    onPress={() => navigation.navigate('Checkin2')}
                    disabled={!checkin1}
                />
            }
        >
            <View style={styles.body}>
                <SectionLabel>YOUR DAILY CHECK-IN · 1 OF 2</SectionLabel>
                <Text style={styles.headline}>How focused did you feel today?</Text>
                <Text style={styles.sub}>This is the whole app. Two taps, every day.</Text>
                <View style={styles.grid}>
                    <View style={styles.row}>
                        {OPTIONS.slice(0, 2).map((opt) => (
                            <EmojiCard
                                key={opt.label}
                                label={opt.label}
                                emoji={opt.emoji}
                                active={checkin1 === opt.label}
                                onPress={() => setAnswer('checkin1', opt.label)}
                            />
                        ))}
                    </View>
                    <View style={styles.row}>
                        {OPTIONS.slice(2).map((opt) => (
                            <EmojiCard
                                key={opt.label}
                                label={opt.label}
                                emoji={opt.emoji}
                                active={checkin1 === opt.label}
                                onPress={() => setAnswer('checkin1', opt.label)}
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

export default Checkin1Screen;
