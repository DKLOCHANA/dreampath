// src/presentation/screens/onboarding/Report2Screen.tsx
// Style: Horizontal Bar Charts Comparison
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Report'>;
type RouteProps = RouteProp<OnboardingStackParamList, 'Report'>;

// Analytics data for Question 2 answers
const getAnalytics = (answerId: string) => {
    const data: {
        [key: string]: {
            withoutApp: { motivation: number; consistency: number; clarity: number };
            withApp: { motivation: number; consistency: number; clarity: number };
            improvement: string;
            headline: string;
            motivationalText: string;
            whyPoints: string[];
        }
    } = {
        '2a': {
            withoutApp: { motivation: 35, consistency: 28, clarity: 40 },
            withApp: { motivation: 88, consistency: 85, clarity: 92 },
            improvement: '3.2x',
            headline: 'Consistency Builder',
            motivationalText: 'Stop guessing what to do next. Get AI-powered daily tasks that keep you moving forward, even on your hardest days.',
            whyPoints: ['Smart task breakdown for any goal', 'Adapts to your daily energy levels'],
        },
        '2b': {
            withoutApp: { motivation: 42, consistency: 30, clarity: 35 },
            withApp: { motivation: 85, consistency: 88, clarity: 90 },
            improvement: '2.8x',
            headline: 'Motivation Amplifier',
            motivationalText: 'Turn fleeting motivation into lasting habits. Our AI keeps you engaged when willpower fades.',
            whyPoints: ['Daily motivation boosters', 'Progress celebrations that matter'],
        },
        '2c': {
            withoutApp: { motivation: 38, consistency: 25, clarity: 45 },
            withApp: { motivation: 90, consistency: 92, clarity: 88 },
            improvement: '3.5x',
            headline: 'Focus Maximizer',
            motivationalText: 'Cut through the noise. Get crystal-clear priorities that make every hour count.',
            whyPoints: ['Priority-based scheduling', 'Distraction-free focus sessions'],
        },
        '2d': {
            withoutApp: { motivation: 40, consistency: 32, clarity: 38 },
            withApp: { motivation: 86, consistency: 84, clarity: 91 },
            improvement: '2.9x',
            headline: 'Clarity Creator',
            motivationalText: 'No more confusion about what to do. Your personalized roadmap makes every step obvious.',
            whyPoints: ['Step-by-step action plans', 'Visual progress tracking'],
        },
    };
    return data[answerId] || data['2a'];
};

const BarComparison: React.FC<{
    label: string;
    withoutValue: number;
    withValue: number;
    animValue: Animated.Value;
}> = ({ label, withoutValue, withValue, animValue }) => {
    const withoutWidth = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', `${withoutValue}%`],
    });
    const withWidth = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', `${withValue}%`],
    });

    return (
        <View style={barStyles.container}>
            <Text style={barStyles.label}>{label}</Text>
            <View style={barStyles.barsContainer}>
                {/* Without App */}
                <View style={barStyles.barRow}>
                    <Text style={barStyles.barLabel}>Without</Text>
                    <View style={barStyles.barTrack}>
                        <Animated.View style={[barStyles.barFillRed, { width: withoutWidth }]} />
                    </View>
                    <Text style={[barStyles.barValue, { color: colors.error.main }]}>{withoutValue}%</Text>
                </View>
                {/* With App */}
                <View style={barStyles.barRow}>
                    <Text style={barStyles.barLabel}>With App</Text>
                    <View style={barStyles.barTrack}>
                        <Animated.View style={[barStyles.barFillGreen, { width: withWidth }]} />
                    </View>
                    <Text style={[barStyles.barValue, { color: colors.success.main }]}>{withValue}%</Text>
                </View>
            </View>
        </View>
    );
};

const barStyles = StyleSheet.create({
    container: { marginBottom: spacing.md },
    label: { fontSize: 13, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.xs },
    barsContainer: { gap: 6 },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    barLabel: { fontSize: 10, color: colors.text.secondary, width: 50 },
    barTrack: { flex: 1, height: 12, backgroundColor: colors.background.tertiary, borderRadius: 6, overflow: 'hidden' },
    barFillRed: { height: '100%', backgroundColor: colors.error.main, borderRadius: 6 },
    barFillGreen: { height: '100%', backgroundColor: colors.success.main, borderRadius: 6 },
    barValue: { fontSize: 12, fontWeight: '700', width: 35, textAlign: 'right' },
});

export const Report2Screen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { selectedAnswer } = route.params;
    const analytics = getAnalytics(selectedAnswer.answerId);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const barAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(barAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        ]).start();
    }, []);

    const handleContinue = () => {
        navigation.navigate('Question', { questionIndex: 2 });
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
                    <Text style={styles.headerTitle}>Performance Comparison</Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Content */}
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    {/* Profile Badge */}
                    <View style={styles.profileBadge}>
                        <View style={styles.profileIcon}>
                            <Ionicons name={selectedAnswer.icon as any} size={20} color="#fff" />
                        </View>
                        <Text style={styles.profileText}>{selectedAnswer.userProfile}</Text>
                    </View>

                    {/* Bar Charts Card */}
                    <View style={styles.chartsCard}>
                        <View style={styles.chartHeader}>
                            <Text style={styles.chartTitle}>{analytics.headline}</Text>
                            <View style={styles.improvementBadge}>
                                <Ionicons name="trending-up" size={14} color={colors.success.main} />
                                <Text style={styles.improvementText}>{analytics.improvement} better</Text>
                            </View>
                        </View>

                        <BarComparison
                            label="Motivation Level"
                            withoutValue={analytics.withoutApp.motivation}
                            withValue={analytics.withApp.motivation}
                            animValue={barAnim}
                        />
                        <BarComparison
                            label="Daily Consistency"
                            withoutValue={analytics.withoutApp.consistency}
                            withValue={analytics.withApp.consistency}
                            animValue={barAnim}
                        />
                        <BarComparison
                            label="Goal Clarity"
                            withoutValue={analytics.withoutApp.clarity}
                            withValue={analytics.withApp.clarity}
                            animValue={barAnim}
                        />
                    </View>

                    {/* Motivational Message */}
                    <View style={styles.motivationCard}>
                        <Ionicons name="bulb" size={22} color="#f59e0b" />
                        <Text style={styles.motivationText}>
                            {analytics.motivationalText}
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
    chartsCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    chartTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
    improvementBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.success.main + '15',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 10,
    },
    improvementText: { fontSize: 12, fontWeight: '600', color: colors.success.main },
    motivationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        backgroundColor: '#fef3c720',
        padding: spacing.md,
        borderRadius: 14,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
        marginBottom: spacing.md,
    },
    motivationText: { flex: 1, fontSize: 13, color: colors.text.primary, lineHeight: 20 },
    whySection: { gap: spacing.xs },
    whyTitle: { fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginBottom: 4 },
    whyItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    whyText: { fontSize: 13, color: colors.text.primary },
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

export default Report2Screen;
