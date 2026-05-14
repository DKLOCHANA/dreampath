// src/presentation/screens/onboarding/BridgeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    OnboardingLayout,
    OnboardingButton,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Bridge'>;

const BACKGROUND: readonly [string, string] = [colors.background.dark, '#1A0D3A'];

export const BridgeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <OnboardingLayout
            dark
            step={8}
            background={BACKGROUND}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Let's build my plan"
                    onPress={() => navigation.navigate('GoalArea')}
                />
            }
        >
            <View style={styles.body}>
                <Text style={styles.emoji}>🌱</Text>
                <Text style={styles.headline}>It doesn't have to keep going like this.</Text>
                <Text style={styles.sub}>
                    Give us <Text style={styles.bold}>10 minutes a day</Text>.{'\n'}
                    We'll build the plan. You take the step.
                </Text>
                <View style={styles.callout}>
                    <Text style={styles.calloutText}>
                        <Text style={styles.calloutAccent}>Today, not "someday."</Text> Let's start.
                    </Text>
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
    emoji: {
        fontSize: 56,
    },
    headline: {
        ...typography.variants.h1,
        fontSize: 36,
        lineHeight: 42,
        fontWeight: '800',
        color: colors.text.inverse,
        letterSpacing: -0.8,
    },
    sub: {
        ...typography.variants.bodyLarge,
        fontSize: 18,
        lineHeight: 28,
        color: 'rgba(255,255,255,0.75)',
    },
    bold: {
        color: colors.text.inverse,
        fontWeight: '700',
    },
    callout: {
        backgroundColor: 'rgba(168, 85, 247, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        borderRadius: spacing.borderRadius.lg + 2,
    },
    calloutText: {
        ...typography.variants.bodySmall,
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
    },
    calloutAccent: {
        color: colors.accent.light,
        fontWeight: '700',
    },
});

export default BridgeScreen;
