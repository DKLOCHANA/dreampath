// src/presentation/screens/onboarding/CostAnchorScreen.tsx
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
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'CostAnchor'>;

const BRAND_NAME = 'VividGoals';

const ITEMS: Array<{ emoji: string; label: string; price: string }> = [
    { emoji: '☕', label: 'One coffee a week', price: '$20' },
    { emoji: '🍔', label: 'One takeout meal', price: '$18' },
    { emoji: '📺', label: 'A streaming service', price: '$15' },
];

export const CostAnchorScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <OnboardingLayout
            step={26}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Continue"
                    onPress={() => navigation.navigate('Commitment')}
                />
            }
        >
            <View style={styles.body}>
                <SectionLabel>WORTH MORE · COSTS LESS</SectionLabel>
                <Text style={styles.headline}>
                    Your dream costs less than your{' '}
                    <Text style={styles.accent}>monthly coffee.</Text>
                </Text>
                <Text style={styles.sub}>Here's what you already pay for, every month:</Text>

                <View style={styles.list}>
                    {ITEMS.map(({ emoji, label, price }) => (
                        <View key={label} style={styles.row}>
                            <Text style={styles.emoji}>{emoji}</Text>
                            <Text style={styles.rowLabel}>{label}</Text>
                            <Text style={styles.rowPrice}>{price}</Text>
                        </View>
                    ))}
                </View>

                <LinearGradient
                    colors={[colors.primary.main, colors.accent.main]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.brandRow}
                >
                    <View style={styles.brandRowHead}>
                        <Text style={styles.brandEmoji}>✨</Text>
                        <Text style={styles.brandLabel}>{BRAND_NAME} (full plan)</Text>
                        <Text style={styles.brandPrice}>$5/mo*</Text>
                    </View>
                    <Text style={styles.brandNote}>*billed annually · less than all three</Text>
                </LinearGradient>

                <Text style={styles.footnote}>
                    Your future self is the cheapest investment you'll ever make.
                </Text>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        paddingTop: spacing.sm,
        gap: spacing.md - 2,
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
    accent: {
        color: colors.primary.main,
    },
    sub: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    list: {
        gap: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md - 2,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.lg,
    },
    emoji: {
        fontSize: 24,
    },
    rowLabel: {
        ...typography.variants.label,
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: colors.text.primary,
    },
    rowPrice: {
        ...typography.variants.label,
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    brandRow: {
        borderRadius: spacing.borderRadius.lg + 2,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md + 2,
        ...shadows.lg,
        shadowColor: colors.primary.main,
        shadowOpacity: 0.35,
    },
    brandRowHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md - 2,
    },
    brandEmoji: {
        fontSize: 28,
    },
    brandLabel: {
        ...typography.variants.label,
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    brandPrice: {
        ...typography.variants.label,
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    brandNote: {
        ...typography.variants.caption,
        fontSize: 11,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 6,
        paddingLeft: 42,
    },
    footnote: {
        ...typography.variants.bodySmall,
        fontSize: 14,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 21,
        marginTop: spacing.sm,
    },
});

export default CostAnchorScreen;
