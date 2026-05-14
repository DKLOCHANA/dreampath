// src/presentation/screens/onboarding/SummaryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    OnboardingLayout,
    OnboardingButton,
    SectionLabel,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import {
    dailyMinutesLabel,
    useOnboardingStore,
    yearsStuckMidpoint,
} from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Summary'>;

interface SummaryCardProps {
    emoji: string;
    label: string;
    value: string;
    accent: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ emoji, label, value, accent }) => (
    <View style={styles.card}>
        <View style={[styles.cardIcon, { backgroundColor: accent + '20' }]}>
            <Text style={styles.cardEmoji}>{emoji}</Text>
        </View>
        <View style={styles.cardText}>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
                {value}
            </Text>
        </View>
    </View>
);

export const SummaryScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { name, goalArea, years, daily } = useOnboardingStore();

    const goalLabel = (goalArea ?? '').split('—')[0].trim().toLowerCase() || 'this';
    const stuck = yearsStuckMidpoint(years);
    const time = dailyMinutesLabel(daily);

    const milestoneDate = new Date(Date.now() + 30 * 86400000).toLocaleDateString(
        undefined,
        { month: 'short', day: 'numeric', year: 'numeric' },
    );

    return (
        <OnboardingLayout
            step={25}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="This is my plan"
                    onPress={() => navigation.navigate('CostAnchor')}
                />
            }
        >
            <View style={styles.body}>
                <SectionLabel>YOUR VIVIDPATH</SectionLabel>
                <Text style={styles.headline}>
                    This is your plan,{' '}
                    <Text style={styles.accent}>{name || 'friend'}.</Text>
                </Text>
                <View style={styles.cards}>
                    <SummaryCard
                        emoji="🎯"
                        label="Where you are"
                        value={`Stuck on ${goalLabel} for ${stuck} yr`}
                        accent={colors.warning.main}
                    />
                    <SummaryCard
                        emoji="🚀"
                        label="Where you're going"
                        value="Visible progress · 30 days"
                        accent={colors.primary.main}
                    />
                    <SummaryCard
                        emoji="🛠️"
                        label="How we'll get there"
                        value={`${time}/day · Daily AI step`}
                        accent={colors.accent.main}
                    />
                    <SummaryCard
                        emoji="📅"
                        label="Your first milestone"
                        value={milestoneDate}
                        accent={colors.success.main}
                    />
                </View>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        paddingTop: spacing.sm,
    },
    headline: {
        ...typography.variants.h2,
        fontSize: 28,
        lineHeight: 32,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.5,
        marginTop: spacing.xs + 2,
        marginBottom: spacing.lg,
    },
    accent: {
        color: colors.primary.main,
    },
    cards: {
        gap: spacing.sm + 2,
    },
    card: {
        flexDirection: 'row',
        gap: spacing.md - 2,
        padding: spacing.md,
        backgroundColor: colors.background.primary,
        borderRadius: spacing.borderRadius.lg + 2,
        borderWidth: 1,
        borderColor: colors.border.light,
        alignItems: 'center',
    },
    cardIcon: {
        width: 44,
        height: 44,
        borderRadius: spacing.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardEmoji: {
        fontSize: 22,
    },
    cardText: {
        flex: 1,
        minWidth: 0,
    },
    cardLabel: {
        ...typography.variants.labelSmall,
        fontSize: 11,
        fontWeight: '600',
        color: colors.text.tertiary,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    cardValue: {
        ...typography.variants.label,
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: 2,
    },
});

export default SummaryScreen;
