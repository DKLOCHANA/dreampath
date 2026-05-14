// src/presentation/screens/onboarding/MiniPlanScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import {
    OnboardingLayout,
    OnboardingButton,
    SectionLabel,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { shadows } from '@/presentation/theme/shadows';
import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'MiniPlan'>;

// Curated first-step content per goal area (no live AI call in onboarding).
const MINI_PLANS: Record<string, string> = {
    career:
        "Write the 3 specific reasons you deserve the next role. Save it as a note on your phone. That's it for today.",
    business:
        'Write a 5-sentence description of your first customer. Not who you wish — who you actually know is out there.',
    health:
        "Drink one full glass of water right now, then walk for exactly 10 minutes. Track the time. Don't think.",
    financial:
        'Open your bank app. Write down 3 subscriptions you forgot you had. Cancel one.',
    creative:
        'Open a blank doc. Write 200 words on the project — terrible is fine. Save and close.',
    learn:
        'Pick one specific concept in your skill. Watch a 10-min video on it. Write 2 sentences about what stuck.',
    relationships:
        "Text one person you've been meaning to reach out to. One sentence. Hit send.",
    personal:
        "Write down — in one sentence — what 'done' actually looks like for this goal. Lock it in.",
};

const pickMiniPlan = (goalArea: string | null): string => {
    if (!goalArea) return MINI_PLANS.personal;
    const lower = goalArea.toLowerCase();
    const key = Object.keys(MINI_PLANS).find((k) => lower.includes(k));
    return key ? MINI_PLANS[key] : MINI_PLANS.personal;
};

export const MiniPlanScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const goalArea = useOnboardingStore((s) => s.goalArea);

    const step = pickMiniPlan(goalArea);
    const goalLabel = goalArea?.split('—')[0]?.trim().slice(0, 18) ?? 'Your goal';

    return (
        <OnboardingLayout
            step={22}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="I'll do this today"
                    onPress={() => navigation.navigate('Streak')}
                />
            }
        >
            <View style={styles.body}>
                <SectionLabel variant="pill">✨ GENERATED FOR YOU</SectionLabel>
                <Text style={styles.headline}>
                    Based on today, here's your{' '}
                    <Text style={styles.accent}>one move.</Text>
                </Text>

                <LinearGradient
                    colors={[colors.primary.main, colors.accent.main]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.planCard}
                >
                    <Text style={styles.cardLabel}>TODAY'S STEP</Text>
                    <Text style={styles.cardStep}>{step}</Text>
                    <View style={styles.pillRow}>
                        <View style={styles.pill}>
                            <Text style={styles.pillIcon}>⏱️</Text>
                            <Text style={styles.pillText}>≈ 10 min</Text>
                        </View>
                        <View style={styles.pill}>
                            <Text style={styles.pillIcon}>🎯</Text>
                            <Text style={styles.pillText}>{goalLabel}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.note}>
                    <Text style={styles.noteText}>
                        That's day one.{' '}
                        <Text style={styles.noteBold}>
                            Come back tomorrow and we'll build on this.
                        </Text>
                    </Text>
                </View>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        paddingTop: spacing.md,
        gap: spacing.md,
    },
    headline: {
        ...typography.variants.h2,
        fontSize: 26,
        lineHeight: 32,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.4,
        marginTop: spacing.sm,
    },
    accent: {
        color: colors.primary.main,
    },
    planCard: {
        borderRadius: spacing.borderRadius['2xl'] - 2,
        padding: spacing.md + 6,
        ...shadows.xl,
        shadowColor: colors.primary.main,
        shadowOpacity: 0.35,
    },
    cardLabel: {
        ...typography.variants.labelSmall,
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 1.5,
        marginBottom: spacing.sm,
    },
    cardStep: {
        ...typography.variants.bodyLarge,
        fontSize: 19,
        lineHeight: 28,
        color: colors.text.inverse,
        fontWeight: '600',
    },
    pillRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: spacing.borderRadius.full,
    },
    pillIcon: {
        fontSize: 13,
    },
    pillText: {
        ...typography.variants.caption,
        fontSize: 12,
        fontWeight: '600',
        color: colors.text.inverse,
    },
    note: {
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
    },
    noteText: {
        ...typography.variants.bodySmall,
        fontSize: 14,
        lineHeight: 21,
        color: colors.text.secondary,
    },
    noteBold: {
        color: colors.text.primary,
        fontWeight: '700',
    },
});

export default MiniPlanScreen;
