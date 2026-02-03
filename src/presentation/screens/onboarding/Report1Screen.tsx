// src/presentation/screens/onboarding/Report1Screen.tsx
// Style: Circular Progress Comparison (Why vs With)
import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Report'>;
type RouteProps = RouteProp<OnboardingStackParamList, 'Report'>;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularProgress: React.FC<{
    progress: number;
    size: number;
    strokeWidth: number;
    color: string;
    backgroundColor?: string;
    animatedProgress: Animated.Value;
    children?: React.ReactNode;
}> = ({ progress, size, strokeWidth, color, backgroundColor = 'rgba(0,0,0,0.1)', animatedProgress, children }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const strokeDashoffset = animatedProgress.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, circumference - (progress / 100) * circumference],
    });

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            {children}
        </View>
    );
};

// Analytics data for Question 1 answers
const getAnalytics = (answerId: string) => {
    const data: {
        [key: string]: {
            failRate: number;
            successRate: number;
            timeframe: string;
            users: string;
            headline: string;
            motivationalText: string;
        }
    } = {
        '1a': {
            failRate: 67,
            successRate: 89,
            timeframe: '3 months',
            users: '10K+',
            headline: 'Clear Vision, Clear Path',
            motivationalText: 'Transform your goals from wishful thinking into achievable milestones with AI-powered daily guidance.',
        },
        '1b': {
            failRate: 92,
            successRate: 85,
            timeframe: '6 months',
            users: '8K+',
            headline: 'Direction Finder',
            motivationalText: 'Discover your true potential with personalized goal recommendations that align with your values.',
        },
        '1c': {
            failRate: 78,
            successRate: 91,
            timeframe: '4 months',
            users: '12K+',
            headline: 'Restart Your Journey',
            motivationalText: 'This time is different. Our AI learns from past attempts to create a success path tailored just for you.',
        },
        '1d': {
            failRate: 73,
            successRate: 78,
            timeframe: '2 months',
            users: '6K+',
            headline: 'Curiosity to Mastery',
            motivationalText: 'Explore new possibilities with a flexible roadmap that adapts as you discover what truly motivates you.',
        },
    };
    return data[answerId] || data['1a'];
};

export const Report1Screen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { selectedAnswer } = route.params;
    const analytics = getAnalytics(selectedAnswer.answerId);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const circleProgressAnim = useRef(new Animated.Value(0)).current;

    const [displayFailRate, setDisplayFailRate] = useState(0);
    const [displaySuccessRate, setDisplaySuccessRate] = useState(0);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();

        // Animate circle progress after a short delay
        setTimeout(() => {
            Animated.timing(circleProgressAnim, {
                toValue: 100,
                duration: 1200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();

            // Animate the percentage text
            const duration = 1200;
            const steps = 60;
            const stepDuration = duration / steps;
            let step = 0;

            const interval = setInterval(() => {
                step++;
                const progress = step / steps;
                const easedProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
                setDisplayFailRate(Math.round(analytics.failRate * easedProgress));
                setDisplaySuccessRate(Math.round(analytics.successRate * easedProgress));

                if (step >= steps) {
                    clearInterval(interval);
                }
            }, stepDuration);
        }, 300);
    }, []);

    const handleContinue = () => {
        navigation.navigate('Question', { questionIndex: 1 });
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{analytics.headline}</Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Content */}
                <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    {/* Profile Badge */}
                    <View style={styles.profileBadge}>
                        <View style={styles.profileIcon}>
                            <Ionicons name={selectedAnswer.icon as any} size={20} color="#fff" />
                        </View>
                        <Text style={styles.profileText}>{selectedAnswer.userProfile}</Text>
                    </View>

                    {/* Main Comparison */}
                    <View style={styles.comparisonRow}>
                        {/* Without App */}
                        <View style={styles.statCard}>
                            <CircularProgress
                                progress={analytics.failRate}
                                size={90}
                                strokeWidth={10}
                                color={colors.error.main}
                                backgroundColor={colors.error.main + '20'}
                                animatedProgress={circleProgressAnim}
                            >
                                <Text style={[styles.statValue, { color: colors.error.main }]}>
                                    {displayFailRate}%
                                </Text>
                            </CircularProgress>
                            <Text style={styles.statLabel}>Give up</Text>
                            <Text style={styles.statSubLabel}>without structure</Text>
                        </View>

                        <View style={styles.vsContainer}>
                            <Text style={styles.vsText}>VS</Text>
                        </View>

                        {/* With DreamPath */}
                        <View style={styles.statCard}>
                            <CircularProgress
                                progress={analytics.successRate}
                                size={90}
                                strokeWidth={10}
                                color={colors.success.main}
                                backgroundColor={colors.success.main + '20'}
                                animatedProgress={circleProgressAnim}
                            >
                                <Text style={[styles.statValue, { color: colors.success.main }]}>
                                    {displaySuccessRate}%
                                </Text>
                            </CircularProgress>
                            <Text style={styles.statLabel}>Succeed</Text>
                            <Text style={styles.statSubLabel}>with DreamPath</Text>
                        </View>
                    </View>

                    {/* Motivational Message */}
                    <LinearGradient
                        colors={['#667eea15', '#764ba210']}
                        style={styles.motivationCard}
                    >
                        <Ionicons name="sparkles" size={24} color={colors.primary.main} />
                        <Text style={styles.motivationText}>
                            {analytics.motivationalText}
                        </Text>
                    </LinearGradient>

                    {/* Quick Stats */}
                    <View style={styles.quickStats}>
                        <View style={styles.quickStatItem}>
                            <Text style={styles.quickStatValue}>{analytics.timeframe}</Text>
                            <Text style={styles.quickStatLabel}>Avg. goal time</Text>
                        </View>
                        <View style={styles.quickStatDivider} />
                        <View style={styles.quickStatItem}>
                            <Text style={styles.quickStatValue}>{analytics.users}</Text>
                            <Text style={styles.quickStatLabel}>Users succeeded</Text>
                        </View>
                    </View>

                    {/* Unique Value Prop */}
                    <View style={styles.valueProposition}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.success.main} />
                        <Text style={styles.valuePropText}>
                            Never lose sight of what matters most to you
                        </Text>
                    </View>
                </Animated.View>

                {/* Continue Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.9}>
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.continueGradient}
                        >
                            <Text style={styles.continueText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.primary },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text.primary },
    headerSpacer: { width: 40 },
    content: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center' },
    profileBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    profileIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileText: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
    comparisonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    statValue: { fontSize: 22, fontWeight: '800' },
    statLabel: { fontSize: 13, fontWeight: '600', color: colors.text.primary, marginTop: spacing.sm },
    statSubLabel: { fontSize: 11, color: colors.text.secondary },
    vsContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: spacing.xs,
    },
    vsText: { fontSize: 12, fontWeight: '700', color: colors.text.secondary },
    motivationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: 16,
        marginBottom: spacing.lg,
    },
    motivationText: { flex: 1, fontSize: 14, color: colors.text.primary, lineHeight: 20 },
    quickStats: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: spacing.md,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    quickStatItem: { flex: 1, alignItems: 'center' },
    quickStatValue: { fontSize: 20, fontWeight: '800', color: colors.primary.main },
    quickStatLabel: { fontSize: 11, color: colors.text.secondary, marginTop: 2 },
    quickStatDivider: { width: 1, backgroundColor: colors.border.light },
    valueProposition: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    valuePropText: { fontSize: 13, color: colors.text.secondary, fontStyle: 'italic' },
    buttonContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    continueButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    continueGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md + 2,
    },
    continueText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});

export default Report1Screen;
