// src/presentation/screens/onboarding/AnalyticsScreen.tsx
// Post-Q6 insight reveal — uses momentum + dailyTime + payoff to surface
// the cost of the gap since the user last felt real momentum.
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
    dailyMinutesValue,
    momentumDaysSince,
    useOnboardingStore,
} from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Analytics'>;

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

const payoffWord = (raw: string | null): string =>
    (raw ?? 'Relief').split('—')[0].trim().toLowerCase();

export const AnalyticsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const name = useOnboardingStore((s) => s.name);
    const lastMomentum = useOnboardingStore((s) => s.lastMomentum);
    const daily = useOnboardingStore((s) => s.daily);
    const payoff = useOnboardingStore((s) => s.payoff);

    const momentumDays = momentumDaysSince(lastMomentum);
    const minutes = dailyMinutesValue(daily);
    const lostHours = Math.round((minutes * momentumDays) / 60);
    const payoffLabel = payoffWord(payoff);
    const isVague = lastMomentum === "I honestly can't remember";

    return (
        <OnboardingLayout
            dark
            step={16}
            background={BACKGROUND}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Keep going"
                    onPress={() => navigation.navigate('Phone')}
                />
            }
        >
            <View style={styles.body}>
                <Reveal delay={200}>
                    <SectionLabel dark>THE GAP</SectionLabel>
                    <Text style={styles.headline}>
                        Here is the truth{'\n'}nobody told you, {name || 'friend'}.
                    </Text>
                </Reveal>

                <Reveal delay={700}>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>
                                {isVague ? '365+' : momentumDays}
                            </Text>
                            <Text style={styles.statLabel}>
                                {isVague ? 'DAYS WITHOUT MOMENTUM' : 'DAYS SINCE MOMENTUM'}
                            </Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{minutes}</Text>
                            <Text style={styles.statLabel}>MIN/DAY READY</Text>
                        </View>
                    </View>
                </Reveal>

                <Reveal delay={1200}>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>
                            {minutes} MIN/DAY × {isVague ? '365+' : momentumDays} DAYS
                        </Text>
                        <Text style={styles.bigNumber}>
                            {lostHours.toLocaleString()}
                            {isVague ? '+' : ''}
                        </Text>
                        <Text style={styles.cardSub}>
                            hours of progress sitting on the table.
                        </Text>
                        <View style={styles.divider} />
                        <Text style={styles.cardLabel}>WHAT'S WAITING FOR YOU</Text>
                        <Text style={styles.cardBody}>
                            <Text style={styles.cardBold}>{payoffLabel}</Text>
                            {' '}— on the other side of the gap.
                        </Text>
                    </View>
                </Reveal>

                <Reveal delay={2000}>
                    <Text style={styles.tail}>
                        The gap was never{' '}
                        <Text style={styles.tailAccent}>time</Text>.{'\n'}
                        <Text style={styles.tailMuted}>
                            It was a system. We're about to give you one.
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
    statsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    statBox: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.25)',
        borderRadius: spacing.borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 36,
        fontWeight: '900',
        color: colors.text.inverse,
        letterSpacing: -1,
        lineHeight: 40,
    },
    statLabel: {
        ...typography.variants.labelSmall,
        fontSize: 10,
        fontWeight: '600',
        color: colors.accent.light,
        marginTop: 4,
        letterSpacing: 0.5,
        textAlign: 'center',
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
        textTransform: 'capitalize',
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

export default AnalyticsScreen;
