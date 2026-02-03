// src/presentation/screens/onboarding/ReportScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
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
import { onboardingData } from './onboardingData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Report'>;
type RouteProps = RouteProp<OnboardingStackParamList, 'Report'>;

// Analytics data based on answer
const getAnalyticsData = (answerId: string) => {
    const analyticsMap: { [key: string]: { failRate: number; successRate: number; improvement: number; users: string } } = {
        '1a': { failRate: 67, successRate: 89, improvement: 4.2, users: '10K+' },
        '1b': { failRate: 92, successRate: 85, improvement: 4.5, users: '8K+' },
        '1c': { failRate: 78, successRate: 91, improvement: 3.0, users: '12K+' },
        '1d': { failRate: 73, successRate: 78, improvement: 3.8, users: '6K+' },
        '2a': { failRate: 81, successRate: 87, improvement: 63, users: '9K+' },
        '2b': { failRate: 65, successRate: 82, improvement: 5.0, users: '7K+' },
        '2c': { failRate: 85, successRate: 94, improvement: 5.7, users: '11K+' },
        '2d': { failRate: 76, successRate: 94, improvement: 4.8, users: '15K+' },
        '3a': { failRate: 71, successRate: 88, improvement: 3.0, users: '8K+' },
        '3b': { failRate: 83, successRate: 86, improvement: 6.0, users: '5K+' },
        '3c': { failRate: 79, successRate: 91, improvement: 4.2, users: '10K+' },
        '3d': { failRate: 88, successRate: 93, improvement: 5.0, users: '14K+' },
        '4a': { failRate: 74, successRate: 89, improvement: 45, users: '12K+' },
        '4b': { failRate: 82, successRate: 92, improvement: 78, users: '9K+' },
        '4c': { failRate: 69, successRate: 82, improvement: 82, users: '7K+' },
        '4d': { failRate: 77, successRate: 88, improvement: 3.4, users: '16K+' },
    };
    return analyticsMap[answerId] || { failRate: 75, successRate: 88, improvement: 4.0, users: '10K+' };
};

// Circular Progress Component
const CircularProgress: React.FC<{
    progress: number;
    size: number;
    strokeWidth: number;
    color: string;
    backgroundColor?: string;
    children?: React.ReactNode;
}> = ({ progress, size, strokeWidth, color, backgroundColor = 'rgba(0,0,0,0.1)', children }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

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
                <Circle
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

export const ReportScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { questionIndex, selectedAnswer } = route.params;

    const totalQuestions = onboardingData.questions.length;
    const isLastQuestion = questionIndex === totalQuestions - 1;
    const analytics = getAnalyticsData(selectedAnswer.answerId);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleContinue = () => {
        if (isLastQuestion) {
            navigation.navigate('FinalWelcome');
        } else {
            navigation.navigate('Question', { questionIndex: questionIndex + 1 });
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Your Analysis</Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Profile Badge */}
                    <View style={styles.profileBadge}>
                        <View style={styles.profileIconWrapper}>
                            <Ionicons name={selectedAnswer.icon as any} size={24} color="#fff" />
                        </View>
                        <Text style={styles.profileText}>{selectedAnswer.userProfile}</Text>
                    </View>

                    {/* Main Stats Row */}
                    <View style={styles.statsRow}>
                        {/* Without App */}
                        <View style={styles.statCard}>
                            <CircularProgress
                                progress={analytics.failRate}
                                size={85}
                                strokeWidth={8}
                                color={colors.error.main}
                                backgroundColor={colors.error.main + '20'}
                            >
                                <Text style={[styles.statValue, { color: colors.error.main }]}>
                                    {analytics.failRate}%
                                </Text>
                            </CircularProgress>
                            <Text style={styles.statLabel}>Fail without plan</Text>
                            <View style={styles.statBadge}>
                                <Ionicons name="close-circle" size={14} color={colors.error.main} />
                                <Text style={[styles.statBadgeText, { color: colors.error.main }]}>High Risk</Text>
                            </View>
                        </View>

                        {/* VS Divider */}
                        <View style={styles.vsDivider}>
                            <Text style={styles.vsText}>VS</Text>
                        </View>

                        {/* With DreamPath */}
                        <View style={styles.statCard}>
                            <CircularProgress
                                progress={analytics.successRate}
                                size={85}
                                strokeWidth={8}
                                color={colors.success.main}
                                backgroundColor={colors.success.main + '20'}
                            >
                                <Text style={[styles.statValue, { color: colors.success.main }]}>
                                    {analytics.successRate}%
                                </Text>
                            </CircularProgress>
                            <Text style={styles.statLabel}>Success with app</Text>
                            <View style={[styles.statBadge, { backgroundColor: colors.success.main + '15' }]}>
                                <Ionicons name="checkmark-circle" size={14} color={colors.success.main} />
                                <Text style={[styles.statBadgeText, { color: colors.success.main }]}>Proven</Text>
                            </View>
                        </View>
                    </View>

                    {/* Improvement Stats */}
                    <LinearGradient
                        colors={[colors.primary.main + '10', colors.primary.main + '05']}
                        style={styles.improvementCard}
                    >
                        <View style={styles.improvementRow}>
                            <View style={styles.improvementStat}>
                                <Text style={styles.improvementValue}>
                                    {analytics.improvement < 10 ? `${analytics.improvement}x` : `${analytics.improvement}%`}
                                </Text>
                                <Text style={styles.improvementLabel}>
                                    {analytics.improvement < 10 ? 'Faster Results' : 'Improvement'}
                                </Text>
                            </View>
                            <View style={styles.improvementDivider} />
                            <View style={styles.improvementStat}>
                                <Text style={styles.improvementValue}>{analytics.users}</Text>
                                <Text style={styles.improvementLabel}>Users Helped</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Key Benefits Icons */}
                    <View style={styles.benefitsRow}>
                        <View style={styles.benefitItem}>
                            <View style={[styles.benefitIcon, { backgroundColor: '#667eea20' }]}>
                                <Ionicons name="rocket" size={20} color="#667eea" />
                            </View>
                            <Text style={styles.benefitText}>AI Planning</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <View style={[styles.benefitIcon, { backgroundColor: '#10b98120' }]}>
                                <Ionicons name="analytics" size={20} color="#10b981" />
                            </View>
                            <Text style={styles.benefitText}>Tracking</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <View style={[styles.benefitIcon, { backgroundColor: '#f59e0b20' }]}>
                                <Ionicons name="flash" size={20} color="#f59e0b" />
                            </View>
                            <Text style={styles.benefitText}>Daily Tasks</Text>
                        </View>
                    </View>

                    {/* Social Proof */}
                    <View style={styles.socialProof}>
                        <Ionicons name="people" size={16} color={colors.text.secondary} />
                        <Text style={styles.socialProofText}>
                            Join {analytics.users} users achieving their goals
                        </Text>
                    </View>
                </View>

                {/* Continue Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.continueGradient}
                        >
                            <Text style={styles.continueText}>
                                {isLastQuestion ? 'See Your Plan' : 'Continue'}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    safeArea: {
        flex: 1,
    },
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text.primary,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        justifyContent: 'center',
    },
    profileBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    profileIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 11,
        color: colors.text.secondary,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: spacing.xs,
        backgroundColor: colors.error.main + '15',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    vsDivider: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: spacing.xs,
    },
    vsText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.text.secondary,
    },
    improvementCard: {
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    improvementRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    improvementStat: {
        flex: 1,
        alignItems: 'center',
    },
    improvementValue: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.primary.main,
    },
    improvementLabel: {
        fontSize: 11,
        color: colors.text.secondary,
        marginTop: 2,
    },
    improvementDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.border.light,
    },
    benefitsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.lg,
    },
    benefitItem: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    benefitIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    benefitText: {
        fontSize: 11,
        fontWeight: '500',
        color: colors.text.secondary,
    },
    socialProof: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    socialProofText: {
        fontSize: 13,
        color: colors.text.secondary,
    },
    buttonContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
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
    continueText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
});

export default ReportScreen;
