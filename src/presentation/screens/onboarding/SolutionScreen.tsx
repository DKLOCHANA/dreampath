// src/presentation/screens/onboarding/SolutionScreen.tsx
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
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Solution'>;

const FEATURES: Array<[string, string]> = [
    ['🎯', 'A roadmap built for your goal'],
    ['⚡', 'One small step every single day'],
    ['📈', 'Visible progress in 30 days'],
];

export const SolutionScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <OnboardingLayout
            step={3}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton title="Show me how" onPress={() => navigation.navigate('Name')} />
            }
        >
            <View style={styles.body}>
                <SectionLabel variant="pill">THE FIX</SectionLabel>
                <Text style={styles.headline}>
                    VividGoals turns the dream in your head{' '}
                    <Text style={styles.accent}>into a plan on your phone.</Text>
                </Text>
                <Text style={styles.sub}>
                    AI builds your personal roadmap.{'\n'}You just take today's step.
                </Text>
                <View style={styles.featureList}>
                    {FEATURES.map(([emoji, label]) => (
                        <View key={label} style={styles.featureRow}>
                            <Text style={styles.featureEmoji}>{emoji}</Text>
                            <Text style={styles.featureLabel}>{label}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        justifyContent: 'center',
        gap: spacing.md,
    },
    headline: {
        ...typography.variants.h1,
        fontSize: 32,
        lineHeight: 38,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.6,
        marginTop: spacing.sm,
    },
    accent: {
        color: colors.primary.main,
    },
    sub: {
        ...typography.variants.bodyLarge,
        fontSize: 17,
        lineHeight: 26,
        color: colors.text.secondary,
    },
    featureList: {
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md - 2,
        paddingVertical: 12,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.lg,
    },
    featureEmoji: {
        fontSize: 22,
    },
    featureLabel: {
        ...typography.variants.label,
        fontSize: 15,
        fontWeight: '500',
        color: colors.text.primary,
    },
});

export default SolutionScreen;
