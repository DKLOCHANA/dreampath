// src/presentation/screens/onboarding/Report4Screen.tsx
// Style: Two Vertical Bar Charts - With vs Without App
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

import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Report'>;
type RouteProps = RouteProp<OnboardingStackParamList, 'Report'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Unique data for each Question 4 answer
const getAnalytics = (answerId: string) => {
    const data: {
        [key: string]: {
            without: { productivity: number; focus: number; completion: number };
            withApp: { productivity: number; focus: number; completion: number };
            headline: string;
            successRate: number;
            motivationalText: string;
        }
    } = {
        '4a': {
            without: { productivity: 32, focus: 28, completion: 25 },
            withApp: { productivity: 89, focus: 85, completion: 92 },
            headline: 'Overwhelmed → Organized',
            successRate: 94,
            motivationalText: 'From chaos to clarity. Watch your productivity soar when every day has a purpose.',
        },
        '4b': {
            without: { productivity: 38, focus: 35, completion: 30 },
            withApp: { productivity: 86, focus: 88, completion: 89 },
            headline: 'Procrastinator → Achiever',
            successRate: 91,
            motivationalText: 'Break the cycle of putting things off. Small daily wins build unstoppable momentum.',
        },
        '4c': {
            without: { productivity: 42, focus: 40, completion: 35 },
            withApp: { productivity: 91, focus: 92, completion: 94 },
            headline: 'Scattered → Focused',
            successRate: 96,
            motivationalText: 'Stop juggling priorities. Let AI organize your path so you can focus on what matters.',
        },
        '4d': {
            without: { productivity: 35, focus: 32, completion: 28 },
            withApp: { productivity: 88, focus: 84, completion: 90 },
            headline: 'Stuck → Progressing',
            successRate: 93,
            motivationalText: 'Break free from the rut. Every day becomes a step forward with guided action plans.',
        },
    };
    return data[answerId] || data['4a'];
};

// Vertical Bar Component
const VerticalBar: React.FC<{
    value: number;
    maxHeight: number;
    color: string;
    animValue: Animated.Value;
}> = ({ value, maxHeight, color, animValue }) => {
    const height = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, (value / 100) * maxHeight],
    });

    return (
        <View style={[barStyles.barContainer, { height: maxHeight }]}>
            <Animated.View style={[barStyles.bar, { height, backgroundColor: color }]}>
                <Text style={barStyles.barValue}>{value}%</Text>
            </Animated.View>
        </View>
    );
};

const barStyles = StyleSheet.create({
    barContainer: {
        width: 36,
        backgroundColor: colors.background.tertiary,
        borderRadius: 8,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    bar: {
        width: '100%',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 6,
    },
    barValue: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
});

// Chart Group Component
const ChartGroup: React.FC<{
    title: string;
    subtitle: string;
    data: { productivity: number; focus: number; completion: number };
    color: string;
    animValue: Animated.Value;
}> = ({ title, subtitle, data, color, animValue }) => {
    const BAR_HEIGHT = 100;
    const labels = ['Productivity', 'Focus', 'Tasks'];
    const values = [
        data.productivity,
        data.focus,
        data.completion,
    ];

    return (
        <View style={groupStyles.container}>
            <View style={groupStyles.header}>
                <Text style={groupStyles.title}>{title}</Text>
                <Text style={[groupStyles.subtitle, { color }]}>{subtitle}</Text>
            </View>
            <View style={groupStyles.barsRow}>
                {values.map((value, index) => (
                    <View key={index} style={groupStyles.barWrapper}>
                        <VerticalBar
                            value={value}
                            maxHeight={BAR_HEIGHT}
                            color={color}
                            animValue={animValue}
                        />
                        <Text style={groupStyles.barLabel}>{labels[index]}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const groupStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    header: {
        marginBottom: spacing.sm,
        alignItems: 'center',
    },
    title: { fontSize: 12, fontWeight: '600', color: colors.text.secondary },
    subtitle: { fontSize: 14, fontWeight: '700' },
    barsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    barWrapper: {
        alignItems: 'center',
        gap: 4,
    },
    barLabel: {
        fontSize: 9,
        color: colors.text.tertiary,
        textAlign: 'center',
    },
});

export const Report4Screen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { selectedAnswer } = route.params;
    const analytics = getAnalytics(selectedAnswer.answerId);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const barAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(barAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        ]).start();
    }, []);

    const handleContinue = () => {
        navigation.navigate('FinalWelcome');
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
                    <Text style={styles.headerTitle}>Your Transformation</Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Content */}
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    {/* Profile & Headline */}
                    <View style={styles.topSection}>
                        <View style={styles.profileBadge}>
                            <View style={styles.profileIcon}>
                                <Ionicons name={selectedAnswer.icon as any} size={18} color="#fff" />
                            </View>
                            <Text style={styles.profileText}>{selectedAnswer.userProfile}</Text>
                        </View>
                        <Text style={styles.headline}>{analytics.headline}</Text>
                    </View>

                    {/* Two Vertical Bar Charts Side by Side */}
                    <View style={styles.chartsContainer}>
                        <ChartGroup
                            title="WITHOUT PLAN"
                            subtitle="Struggling"
                            data={analytics.without}
                            color={colors.error.main}
                            animValue={barAnim}
                        />
                        <ChartGroup
                            title="WITH DREAMPATH"
                            subtitle="Thriving"
                            data={analytics.withApp}
                            color={colors.success.main}
                            animValue={barAnim}
                        />
                    </View>

                    {/* Success Rate Banner */}
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.successBanner}
                    >
                        <View style={styles.successContent}>
                            <Text style={styles.successValue}>{analytics.successRate}%</Text>
                            <Text style={styles.successLabel}>of users achieve their goals</Text>
                        </View>
                        <View style={styles.successStars}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Ionicons key={i} name="star" size={14} color="#ffd700" />
                            ))}
                        </View>
                    </LinearGradient>

                    {/* Motivational Message */}
                    <View style={styles.motivationCard}>
                        <Ionicons name="rocket" size={20} color={colors.primary.main} />
                        <Text style={styles.motivationText}>{analytics.motivationalText}</Text>
                    </View>

                    {/* Trust Badge */}
                    <View style={styles.trustBadge}>
                        <Ionicons name="shield-checkmark" size={16} color={colors.success.main} />
                        <Text style={styles.trustText}>Join 50K+ achievers who transformed their lives</Text>
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
                            <Text style={styles.continueText}>See Your Plan</Text>
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
    content: { flex: 1, paddingHorizontal: spacing.md, justifyContent: 'center' },
    topSection: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    profileBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    profileIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileText: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
    headline: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text.primary,
        textAlign: 'center',
    },
    chartsContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 14,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    successContent: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: spacing.xs,
    },
    successValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
    },
    successLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
    },
    successStars: {
        flexDirection: 'row',
        gap: 2,
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
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    trustText: { fontSize: 12, color: colors.text.secondary },
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

export default Report4Screen;
