// src/presentation/screens/onboarding/Report3Screen.tsx
// Style: Progress Meters with Big Numbers
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

// Unique data for each Question 3 answer
const getAnalytics = (answerId: string) => {
    const data: {
        [key: string]: {
            goalAchievement: number;
            dailyProgress: number;
            weeklyConsistency: number;
            monthlyGrowth: number;
            headline: string;
            motivationalText: string;
        }
    } = {
        '3a': {
            goalAchievement: 89,
            dailyProgress: 94,
            weeklyConsistency: 87,
            monthlyGrowth: 156,
            headline: 'Career Growth Potential',
            motivationalText: 'Turn your career aspirations into a structured promotion roadmap with daily actionable steps.',
        },
        '3b': {
            goalAchievement: 92,
            dailyProgress: 88,
            weeklyConsistency: 91,
            monthlyGrowth: 243,
            headline: 'Learning Acceleration',
            motivationalText: 'Master new skills 3x faster with AI-optimized learning schedules tailored to your pace.',
        },
        '3c': {
            goalAchievement: 85,
            dailyProgress: 91,
            weeklyConsistency: 83,
            monthlyGrowth: 178,
            headline: 'Health & Fitness Journey',
            motivationalText: 'Build lasting healthy habits with progressive goals that adapt to your lifestyle.',
        },
        '3d': {
            goalAchievement: 91,
            dailyProgress: 86,
            weeklyConsistency: 89,
            monthlyGrowth: 312,
            headline: 'Financial Freedom Path',
            motivationalText: 'Achieve your financial goals with smart milestones and daily money habits.',
        },
    };
    return data[answerId] || data['3a'];
};

// Animated Progress Meter
const ProgressMeter: React.FC<{
    value: number;
    label: string;
    suffix?: string;
    color: string;
    animValue: Animated.Value;
}> = ({ value, label, suffix = '%', color, animValue }) => {
    const width = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', `${Math.min(value, 100)}%`],
    });

    return (
        <View style={meterStyles.container}>
            <View style={meterStyles.header}>
                <Text style={meterStyles.label}>{label}</Text>
                <Text style={[meterStyles.value, { color }]}>{value}{suffix}</Text>
            </View>
            <View style={meterStyles.track}>
                <Animated.View style={[meterStyles.fill, { width, backgroundColor: color }]} />
            </View>
        </View>
    );
};

const meterStyles = StyleSheet.create({
    container: { marginBottom: spacing.md },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    label: { fontSize: 13, fontWeight: '500', color: colors.text.secondary },
    value: { fontSize: 16, fontWeight: '800' },
    track: { height: 10, backgroundColor: colors.background.tertiary, borderRadius: 5, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 5 },
});

export const Report3Screen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { selectedAnswer } = route.params;
    const analytics = getAnalytics(selectedAnswer.answerId);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const meterAnim = useRef(new Animated.Value(0)).current;
    const numberAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(meterAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        ]).start();

        // Animate stat cards
        Animated.stagger(100, numberAnims.map(anim =>
            Animated.spring(anim, { toValue: 1, friction: 8, useNativeDriver: true })
        )).start();
    }, []);

    const handleContinue = () => {
        navigation.navigate('Question', { questionIndex: 3 });
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
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    {/* Profile Badge */}
                    <View style={styles.profileBadge}>
                        <View style={styles.profileIcon}>
                            <Ionicons name={selectedAnswer.icon as any} size={20} color="#fff" />
                        </View>
                        <Text style={styles.profileText}>{selectedAnswer.userProfile}</Text>
                    </View>

                    {/* Big Stat Cards Row */}
                    <View style={styles.statCardsRow}>
                        <Animated.View style={[styles.bigStatCard, { opacity: numberAnims[0], transform: [{ scale: numberAnims[0] }] }]}>
                            <Text style={styles.bigStatValue}>{analytics.goalAchievement}%</Text>
                            <Text style={styles.bigStatLabel}>Goal Success</Text>
                        </Animated.View>
                        <Animated.View style={[styles.bigStatCard, styles.bigStatCardHighlight, { opacity: numberAnims[1], transform: [{ scale: numberAnims[1] }] }]}>
                            <Text style={[styles.bigStatValue, { color: '#fff' }]}>{analytics.monthlyGrowth}%</Text>
                            <Text style={[styles.bigStatLabel, { color: 'rgba(255,255,255,0.9)' }]}>Growth Rate</Text>
                        </Animated.View>
                    </View>

                    {/* Progress Meters Card */}
                    <View style={styles.metersCard}>
                        <Text style={styles.metersTitle}>Your Projected Performance</Text>

                        <ProgressMeter
                            value={analytics.dailyProgress}
                            label="Daily Task Completion"
                            color={colors.success.main}
                            animValue={meterAnim}
                        />
                        <ProgressMeter
                            value={analytics.weeklyConsistency}
                            label="Weekly Consistency"
                            color={colors.primary.main}
                            animValue={meterAnim}
                        />
                        <ProgressMeter
                            value={analytics.goalAchievement}
                            label="Goal Achievement Rate"
                            color="#f59e0b"
                            animValue={meterAnim}
                        />
                    </View>

                    {/* Motivational Message */}
                    <View style={styles.motivationCard}>
                        <Ionicons name="flash" size={20} color={colors.primary.main} />
                        <Text style={styles.motivationText}>{analytics.motivationalText}</Text>
                    </View>

                    {/* Bottom Stats */}
                    <View style={styles.bottomStats}>
                        <View style={styles.bottomStatItem}>
                            <Ionicons name="people" size={16} color={colors.success.main} />
                            <Text style={styles.bottomStatText}>15K+ similar users succeeded</Text>
                        </View>
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
    headerTitle: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
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
    profileText: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
    statCardsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    bigStatCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: spacing.md,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    bigStatCardHighlight: {
        backgroundColor: colors.primary.main,
    },
    bigStatValue: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.primary.main,
    },
    bigStatLabel: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: 2,
    },
    metersCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    metersTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    motivationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        backgroundColor: colors.primary.main + '10',
        padding: spacing.md,
        borderRadius: 14,
        marginBottom: spacing.sm,
    },
    motivationText: { flex: 1, fontSize: 13, color: colors.text.primary, lineHeight: 20 },
    bottomStats: {
        alignItems: 'center',
    },
    bottomStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    bottomStatText: { fontSize: 12, color: colors.text.secondary },
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

export default Report3Screen;
