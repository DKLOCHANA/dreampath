// src/presentation/screens/onboarding/PlanLoadingScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { OnboardingLayout } from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { shadows } from '@/presentation/theme/shadows';
import {
    dailyMinutesLabel,
    useOnboardingStore,
} from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { requestTrackingPermission } from '@/services/appsflyerService';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'PlanLoading'>;

const BACKGROUND: readonly [string, string] = [colors.background.dark, '#1A0D3A'];
const TOTAL_MS = 4000;
const LINE_INTERVAL = 1000;

export const PlanLoadingScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const daily = useOnboardingStore((s) => s.daily);

    const lines = [
        'Analyzing your goal...',
        `Mapping daily steps to your ${dailyMinutesLabel(daily)} window...`,
        'Calibrating for your blockers...',
        'Finalizing your roadmap...',
    ];

    const progress = useRef(new Animated.Value(0)).current;
    const spin = useRef(new Animated.Value(0)).current;
    const [percent, setPercent] = useState(0);
    const [lineIdx, setLineIdx] = useState(0);

    // Request ATT here — the "Building your personalized plan" headline gives
    // the user the contextual justification Apple requires before the system
    // prompt appears. SKAN keeps working if they deny.
    useEffect(() => {
        const t = setTimeout(() => {
            requestTrackingPermission();
        }, 800);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const listener = progress.addListener(({ value }) => {
            setPercent(Math.round(value * 100));
        });

        Animated.timing(progress, {
            toValue: 1,
            duration: TOTAL_MS,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start(() => {
            navigation.navigate('Summary');
        });

        Animated.loop(
            Animated.timing(spin, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ).start();

        const lineTimers = lines.map((_, i) =>
            setTimeout(() => setLineIdx(i), i * LINE_INTERVAL),
        );

        return () => {
            progress.removeListener(listener);
            lineTimers.forEach(clearTimeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rotate = spin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const barWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <OnboardingLayout dark hideTopBar background={BACKGROUND}>
            <View style={styles.body}>
                <Animated.View style={{ transform: [{ rotate }] }}>
                    <LinearGradient
                        colors={[colors.primary.main, colors.accent.main]}
                        style={styles.iconFrame}
                    >
                        <Text style={styles.iconEmoji}>✨</Text>
                    </LinearGradient>
                </Animated.View>

                <View style={styles.textCol}>
                    <Text style={styles.headline}>
                        Building your personalized{'\n'}30-day plan
                    </Text>
                    <Text style={styles.status} key={lineIdx}>
                        {lines[lineIdx]}
                    </Text>
                </View>

                <View style={styles.track}>
                    <Animated.View style={[styles.fillContainer, { width: barWidth }]}>
                        <LinearGradient
                            colors={[colors.primary.main, colors.accent.main]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                </View>
                <Text style={styles.percent}>{percent}%</Text>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    iconFrame: {
        width: 90,
        height: 90,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.xl,
        shadowColor: colors.primary.main,
        shadowOpacity: 0.6,
    },
    iconEmoji: {
        fontSize: 44,
    },
    textCol: {
        alignItems: 'center',
        gap: spacing.sm,
        maxWidth: 320,
    },
    headline: {
        ...typography.variants.h4,
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '700',
        color: colors.text.inverse,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    status: {
        ...typography.variants.bodySmall,
        fontSize: 14,
        color: colors.accent.light,
        textAlign: 'center',
        minHeight: 22,
    },
    track: {
        width: '100%',
        maxWidth: 280,
        height: 6,
        borderRadius: spacing.borderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    fillContainer: {
        height: '100%',
        borderRadius: spacing.borderRadius.full,
        overflow: 'hidden',
    },
    percent: {
        ...typography.variants.caption,
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
    },
});

export default PlanLoadingScreen;
