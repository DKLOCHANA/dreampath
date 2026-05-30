// src/presentation/screens/onboarding/TrialReminderScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import {
    OnboardingLayout,
    OnboardingButton,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

type Feature = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
};

const FEATURES: Feature[] = [
    {
        icon: 'sparkles',
        title: 'AI Goal Breakdowns',
        subtitle: 'Big dreams into daily steps',
    },
    {
        icon: 'calendar',
        title: 'Smart Planning',
        subtitle: 'Tasks scheduled for you',
    },
    {
        icon: 'trending-up',
        title: 'Progress Insights',
        subtitle: 'See what is actually moving',
    },
    {
        icon: 'flame',
        title: 'Daily Momentum',
        subtitle: 'Streaks that keep you going',
    },
];

export const TrialReminderScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleContinue = () => {
        navigation.navigate('Notifications');
    };

    return (
        <OnboardingLayout
            step={28}
            onBack={() => navigation.goBack()}
            scrollable
            contentContainerStyle={styles.content}
            footer={
                <OnboardingButton title="Try for $0" onPress={handleContinue} />
            }
        >
            <Text style={styles.title}>
                We want you to try{'\n'}
                <Text style={styles.titleAccent}>VividGoals</Text> for free.
            </Text>

            <View style={styles.featureList}>
                {FEATURES.map((feature) => (
                    <View key={feature.title} style={styles.featureCard}>
                        <View style={styles.featureIconWrap}>
                            <Ionicons
                                name={feature.icon}
                                size={22}
                                color={colors.primary.main}
                            />
                        </View>
                        <View style={styles.featureBody}>
                            <Text style={styles.featureTitle}>{feature.title}</Text>
                            <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.reassureRow}>
                <View style={styles.reassureIcon}>
                    <Ionicons name="checkmark" size={14} color={colors.text.inverse} />
                </View>
                <Text style={styles.reassureText}>No payment due now</Text>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    title: {
        ...typography.variants.h1,
        fontSize: 32,
        lineHeight: 40,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.6,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    titleAccent: {
        color: colors.primary.main,
    },
    featureList: {
        gap: spacing.md - 4,
        marginBottom: spacing.lg,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.light,
        borderRadius: spacing.borderRadius.xl,
        padding: spacing.md,
    },
    featureIconWrap: {
        width: 48,
        height: 48,
        borderRadius: spacing.borderRadius.lg,
        backgroundColor: colors.background.primary,
        borderWidth: 1,
        borderColor: colors.border.light,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureBody: {
        flex: 1,
    },
    featureTitle: {
        ...typography.variants.h6,
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 2,
    },
    featureSubtitle: {
        ...typography.variants.bodySmall,
        fontSize: 13,
        color: colors.text.secondary,
    },
    reassureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    reassureIcon: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.text.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reassureText: {
        ...typography.variants.label,
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.primary,
    },
});

export default TrialReminderScreen;
