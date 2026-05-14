// src/presentation/screens/onboarding/BombshellScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
    ageMidpoint,
    useOnboardingStore,
    yearsStuckMidpoint,
} from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Bombshell'>;

const BACKGROUND: readonly [string, string] = ['#2A0E4D', colors.background.dark];

const Reveal: React.FC<{ delay: number; children: React.ReactNode }> = ({
    delay,
    children,
}) => {
    const value = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(value, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
        }).start();
    }, [delay, value]);

    const translateY = value.interpolate({
        inputRange: [0, 1],
        outputRange: [10, 0],
    });

    return (
        <Animated.View style={{ opacity: value, transform: [{ translateY }] }}>
            {children}
        </Animated.View>
    );
};

export const BombshellScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const name = useOnboardingStore((s) => s.name);
    const age = useOnboardingStore((s) => s.age);
    const years = useOnboardingStore((s) => s.years);

    const current = ageMidpoint(age);
    const stuck = yearsStuckMidpoint(years);
    const projected = Math.max(stuck, 3);
    const future = current + projected;
    const days = (projected * 365).toLocaleString();

    return (
        <OnboardingLayout
            dark
            step={7}
            background={BACKGROUND}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Okay, I'm listening"
                    onPress={() => navigation.navigate('Bridge')}
                />
            }
        >
            <View style={styles.body}>
                <Reveal delay={200}>
                    <SectionLabel dark>THE MATH</SectionLabel>
                    <Text style={styles.headline}>
                        {name || 'Hey'} — here's the truth nobody told you.
                    </Text>
                </Reveal>

                <Reveal delay={900}>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>AT YOUR CURRENT PACE</Text>
                        <Text style={styles.cardBody}>
                            You're <Text style={styles.cardBold}>{current}</Text>.{'\n'}
                            You've been chasing this for{' '}
                            <Text style={styles.cardBold}>
                                {stuck} {stuck === 1 ? 'year' : 'years'}
                            </Text>
                            .
                        </Text>
                        <View style={styles.divider} />
                        <Text style={styles.cardLabel}>YOU'LL BE</Text>
                        <Text style={styles.bigNumber}>{future}</Text>
                        <Text style={styles.cardSub}>before you actually get there.</Text>
                    </View>
                </Reveal>

                <Reveal delay={1700}>
                    <Text style={styles.tail}>
                        That's <Text style={styles.tailAccent}>{days}</Text> more days of "not yet."{'\n'}
                        <Text style={styles.tailMuted}>
                            Most people don't fail at their goals. They run out of time.
                        </Text>
                    </Text>
                </Reveal>
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
        color: colors.text.inverse,
        letterSpacing: -0.5,
        marginTop: spacing.sm,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.25)',
        borderRadius: spacing.borderRadius.xl + 2,
        padding: spacing.md + 4,
    },
    cardLabel: {
        ...typography.variants.labelSmall,
        fontSize: 13,
        fontWeight: '600',
        color: colors.accent.light,
        marginBottom: 6,
    },
    cardBody: {
        ...typography.variants.body,
        fontSize: 17,
        lineHeight: 26,
        color: 'rgba(255,255,255,0.85)',
    },
    cardBold: {
        color: colors.text.inverse,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginVertical: spacing.md,
    },
    bigNumber: {
        fontSize: 64,
        lineHeight: 70,
        fontWeight: '900',
        color: colors.text.inverse,
        letterSpacing: -2,
    },
    cardSub: {
        ...typography.variants.body,
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        marginTop: spacing.xs + 2,
    },
    tail: {
        ...typography.variants.body,
        fontSize: 15,
        lineHeight: 22,
        color: 'rgba(255,255,255,0.85)',
        paddingHorizontal: spacing.xs,
    },
    tailAccent: {
        color: colors.accent.main,
        fontWeight: '700',
    },
    tailMuted: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
    },
});

export default BombshellScreen;
