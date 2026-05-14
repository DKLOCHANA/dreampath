// src/presentation/screens/onboarding/ChartScreen.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, {
    Circle,
    Defs,
    LinearGradient as SvgLinearGradient,
    Path,
    Stop,
    Line,
} from 'react-native-svg';

import {
    OnboardingLayout,
    OnboardingButton,
    SectionLabel,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Chart'>;

const FLAT_PATH = 'M 0 130 Q 80 128 160 125 T 320 118';
const STEEP_PATH = 'M 0 130 Q 60 100 130 70 T 320 10';

// Overestimate of the steep line's stroke length — used as dasharray + initial
// offset so the path starts fully hidden and reveals as offset → 0.
const STEEP_LENGTH = 460;

const BASELINE_DURATION = 600;
const STEEP_DURATION = 1400;
const FILL_DELAY = BASELINE_DURATION + STEEP_DURATION - 200;
const DOTS_DELAY = BASELINE_DURATION + STEEP_DURATION - 100;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const ChartScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    const flatOpacity = useRef(new Animated.Value(0)).current;
    const steepOffset = useRef(new Animated.Value(STEEP_LENGTH)).current;
    const fillOpacity = useRef(new Animated.Value(0)).current;
    const dotsScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(flatOpacity, {
                toValue: 1,
                duration: BASELINE_DURATION,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }),
            Animated.parallel([
                Animated.timing(steepOffset, {
                    toValue: 0,
                    duration: STEEP_DURATION,
                    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                    useNativeDriver: false,
                }),
                Animated.timing(fillOpacity, {
                    toValue: 1,
                    duration: 600,
                    delay: FILL_DELAY - BASELINE_DURATION,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: false,
                }),
                Animated.spring(dotsScale, {
                    toValue: 1,
                    delay: DOTS_DELAY - BASELINE_DURATION,
                    friction: 5,
                    tension: 140,
                    useNativeDriver: false,
                }),
            ]),
        ]).start();
    }, [dotsScale, fillOpacity, flatOpacity, steepOffset]);

    return (
        <OnboardingLayout
            step={19}
            onBack={() => navigation.goBack()}
            scrollable
            footer={
                <OnboardingButton
                    title="I'm ready to start"
                    onPress={() => navigation.navigate('Checkin1')}
                />
            }
        >
            <View style={styles.body}>
                <SectionLabel>EVIDENCE</SectionLabel>
                <Text style={styles.headline}>
                    People like you achieve their goal{' '}
                    <Text style={styles.accent}>6.4× faster</Text> with a structured plan.
                </Text>

                <View style={styles.chartCard}>
                    <Svg viewBox="0 0 320 150" width="100%" height={150}>
                        <Defs>
                            <SvgLinearGradient id="chart-line" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor={colors.primary.main} />
                                <Stop offset="1" stopColor={colors.chart.pink} />
                            </SvgLinearGradient>
                            <SvgLinearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={colors.primary.main} stopOpacity="0.25" />
                                <Stop offset="1" stopColor={colors.primary.main} stopOpacity="0" />
                            </SvgLinearGradient>
                        </Defs>
                        {[0, 30, 60, 90, 120].map((y) => (
                            <Line
                                key={y}
                                x1="0"
                                x2="320"
                                y1={y + 10}
                                y2={y + 10}
                                stroke={colors.border.light}
                                strokeWidth="1"
                                strokeDasharray="2,4"
                            />
                        ))}
                        <AnimatedPath
                            d={`${STEEP_PATH} L 320 150 L 0 150 Z`}
                            fill="url(#chart-fill)"
                            opacity={fillOpacity}
                        />
                        <AnimatedPath
                            d={FLAT_PATH}
                            stroke={colors.text.tertiary}
                            strokeWidth="2.5"
                            fill="none"
                            strokeDasharray="4,4"
                            opacity={flatOpacity}
                        />
                        <AnimatedPath
                            d={STEEP_PATH}
                            stroke="url(#chart-line)"
                            strokeWidth="3.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={STEEP_LENGTH}
                            strokeDashoffset={steepOffset}
                        />
                        <AnimatedCircle
                            cx="320"
                            cy="10"
                            r={dotsScale.interpolate({ inputRange: [0, 1], outputRange: [0, 6] })}
                            fill={colors.chart.pink}
                        />
                        <AnimatedCircle
                            cx="320"
                            cy="118"
                            r={dotsScale.interpolate({ inputRange: [0, 1], outputRange: [0, 5] })}
                            fill={colors.text.tertiary}
                        />
                    </Svg>

                    <View style={styles.legendRow}>
                        <Legend color={colors.primary.main} label="With VividGoals" bold />
                        <Legend color={colors.text.tertiary} label="Without a system" />
                    </View>
                    <View style={styles.axisRow}>
                        {['Day 0', 'Day 30', 'Day 60', 'Day 90'].map((d) => (
                            <Text key={d} style={styles.axisLabel}>
                                {d}
                            </Text>
                        ))}
                    </View>
                </View>

                <View style={styles.quoteCard}>
                    <Text style={styles.quoteText}>
                        "The number-one predictor of goal achievement isn't talent or willpower —
                        it's structure."
                    </Text>
                    <Text style={styles.quoteAttr}>
                        — Dr. Gail Matthews · Dominican University study
                    </Text>
                </View>
            </View>
        </OnboardingLayout>
    );
};

interface LegendProps {
    color: string;
    label: string;
    bold?: boolean;
}

const Legend: React.FC<LegendProps> = ({ color, label, bold }) => (
    <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={[styles.legendLabel, bold && styles.legendLabelBold]}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    body: {
        paddingTop: spacing.md,
        gap: spacing.md,
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
    chartCard: {
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.light,
        borderRadius: spacing.borderRadius.xl + 2,
        padding: spacing.md + 2,
    },
    legendRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.sm,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs + 2,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendLabel: {
        ...typography.variants.caption,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    legendLabelBold: {
        fontWeight: '700',
    },
    axisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md - 2,
    },
    axisLabel: {
        ...typography.variants.caption,
        fontSize: 11,
        color: colors.text.tertiary,
    },
    quoteCard: {
        backgroundColor: colors.primary.background,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary.main,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        borderRadius: spacing.borderRadius.lg,
    },
    quoteText: {
        ...typography.variants.body,
        fontSize: 14,
        lineHeight: 20,
        color: colors.text.primary,
        fontStyle: 'italic',
    },
    quoteAttr: {
        ...typography.variants.caption,
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: 6,
    },
});

export default ChartScreen;
