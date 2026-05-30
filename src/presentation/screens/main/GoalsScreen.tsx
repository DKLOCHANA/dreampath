// src/presentation/screens/main/GoalsScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    RefreshControl,
    TouchableOpacity,
    Dimensions,
    Modal,
    Platform,
    Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { Card } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { Goal, GoalCategory, GoalPriority } from '@/domain/entities/Goal';
import { getGoals, getTasks, deleteGoal, updateTaskStatus, USE_LOCAL_DATA } from '@/data';
import { Task } from '@/domain/entities/Task';
import { useAuthStore } from '@/infrastructure/stores/authStore';
import { useIsPro } from '@/infrastructure/stores/subscriptionStore';
import { GoalWizard, GoalWizardData } from '@/presentation/components/goal/GoalWizard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@/presentation/navigation/types';
import { checkConnectivityWithAlert, isNetworkError } from '@/services/networkService';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.28; // ~1/4 of screen
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 740;
const EMPTY_ILLUSTRATION_SIZE = IS_SMALL_SCREEN ? 150 : 200;
const EMPTY_RING_SIZE = IS_SMALL_SCREEN ? 90 : 124;

// Circular Progress Component
const CircularProgress: React.FC<{
    progress: number;
    size: number;
    strokeWidth: number;
    color?: string;
    backgroundColor?: string;
    children?: React.ReactNode;
}> = ({ progress, size, strokeWidth, color = colors.primary.main, backgroundColor = 'rgba(255,255,255,0.3)', children }) => {
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

// Category icon and gradient mapping
const getCategoryConfig = (category: GoalCategory): {
    icon: keyof typeof Ionicons.glyphMap;
    gradient: [string, string];
    lightColor: string;
} => {
    const configs: Record<GoalCategory, { icon: keyof typeof Ionicons.glyphMap; gradient: [string, string]; lightColor: string }> = {
        CAREER: { icon: 'briefcase', gradient: ['#667eea', '#764ba2'], lightColor: '#e0e7ff' },
        FINANCIAL: { icon: 'wallet', gradient: ['#56ab91', '#14505c'], lightColor: '#d1fae5' },
        HEALTH: { icon: 'fitness', gradient: ['#f093fb', '#f5576c'], lightColor: '#fce7f3' },
        EDUCATION: { icon: 'book', gradient: ['#00f2fe', '#4facfe'], lightColor: '#e0f2fe' },
        PERSONAL: { icon: 'leaf', gradient: ['#38f9d7', '#43e97b'], lightColor: '#dcfce7' },
        RELATIONSHIP: { icon: 'heart', gradient: ['#fee140', '#fa709a'], lightColor: '#fef3c7' },
        OTHER: { icon: 'flag', gradient: ['#e0c3fc', '#8866b3'], lightColor: '#f3e8ff' },
    };
    return configs[category] || configs.OTHER;
};

// Get status color and label based on actual progress
const getStatusConfigWithProgress = (goal: Goal, progress: number): { color: string; label: string; urgency: 'critical' | 'warning' | 'normal' | 'good' } => {
    const daysRemaining = getDaysRemaining(goal.targetDate);

    // Completed
    if (progress === 100 || goal.status === 'COMPLETED') {
        return { color: '#10b981', label: 'Completed', urgency: 'good' };
    }
    // Critical: Low progress with little time left
    if (daysRemaining <= 7 && progress < 50) {
        return { color: '#ef4444', label: 'Critical', urgency: 'critical' };
    }
    // Warning: Behind schedule
    if (daysRemaining <= 14 && progress < 70) {
        return { color: '#f59e0b', label: 'Behind', urgency: 'warning' };
    }
    // Good: On track
    if (progress >= 80) {
        return { color: '#10b981', label: 'On Track', urgency: 'good' };
    }
    // Normal
    return { color: '#6366f1', label: 'In Progress', urgency: 'normal' };
};

// Calculate days remaining
const getDaysRemaining = (targetDate: Date | string): number => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
};

// Format remaining time
const formatRemainingTime = (targetDate: Date | string): string => {
    const days = getDaysRemaining(targetDate);
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    if (days < 7) return `${days} days left`;
    if (days < 30) return `${Math.ceil(days / 7)} weeks left`;
    if (days < 365) return `${Math.ceil(days / 30)} months left`;
    return `${Math.ceil(days / 365)} years left`;
};

// Priority color helper
const getPriorityColor = (priority: GoalPriority): string => {
    switch (priority) {
        case 'HIGH': return '#ef4444';
        case 'MEDIUM': return '#f59e0b';
        case 'LOW': return '#10b981';
        default: return colors.text.secondary;
    }
};

// Task priority color helper
const getTaskPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
        case 'HIGH': return '#ef4444';
        case 'MEDIUM': return '#f59e0b';
        case 'LOW': return '#10b981';
        default: return colors.text.secondary;
    }
};

export const GoalsScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
    const isPro = useIsPro();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Add Goal Modal State - Now using shared GoalWizard
    const [showAddGoal, setShowAddGoal] = useState(false);

    // Goal Tasks Drawer State
    const [selectedGoalForTasks, setSelectedGoalForTasks] = useState<Goal | null>(null);

    // Handle wizard completion
    const handleWizardComplete = async (data: GoalWizardData, goal?: Goal) => {
        console.log('[GoalsScreen] Goal created via wizard:', goal?.title);
        setShowAddGoal(false);
        await loadData();
    };

    const handleCreateGoal = () => {
        if (!isPro && goals.length >= 1) {
            navigation.navigate('Paywall');
            return;
        }
        setShowAddGoal(true);
    };

    // Handle deleting a goal
    const handleDeleteGoal = (goalId: string, goalTitle: string) => {
        Alert.alert(
            'Delete Goal',
            `Are you sure you want to delete "${goalTitle}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Check network connectivity before delete
                            const isOnline = await checkConnectivityWithAlert({
                                customMessage: 'Unable to delete goal. Please check your internet connection and try again.',
                            });
                            if (!isOnline) return;

                            await deleteGoal(goalId);
                            await loadData();
                            console.log('[GoalsScreen] Goal deleted:', goalId);
                        } catch (error: any) {
                            console.error('[GoalsScreen] Error deleting goal:', error);
                            if (isNetworkError(error)) {
                                Alert.alert('No Internet Connection', 'Please check your internet connection and try again.');
                            } else {
                                Alert.alert('Error', 'Failed to delete goal. Please try again.');
                            }
                        }
                    },
                },
            ]
        );
    };

    // Load goals and tasks from local storage
    const loadData = async () => {
        try {
            const localGoals = await getGoals();
            const localTasks = await getTasks();
            setGoals(localGoals);
            setTasks(localTasks);
            console.log('[GoalsScreen] Loaded goals:', localGoals.length);
        } catch (error) {
            console.error('[GoalsScreen] Error loading data:', error);
        }
    };

    // Refresh goals when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    // Get task counts for a specific goal
    const getGoalTaskCounts = (goalId: string) => {
        const goalTasks = tasks.filter(t => t.goalId === goalId);
        const completed = goalTasks.filter(t => t.status === 'COMPLETED').length;
        return { total: goalTasks.length, completed };
    };

    // Get all tasks for a specific goal
    const getTasksForGoal = (goalId: string) => {
        return tasks
            .filter(t => t.goalId === goalId)
            .sort((a, b) => {
                // Sort by status (pending first), then by priority, then by date
                if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
                if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
                const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
            });
    };

    // Toggle task completion
    const toggleTaskStatus = async (task: Task) => {
        const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        await updateTaskStatus(task.id, newStatus);
        await loadData();
    };

    // Open goal tasks drawer
    const openGoalTasks = (goal: Goal) => {
        setSelectedGoalForTasks(goal);
    };

    const activeGoals = goals.filter(g => g.status === 'ACTIVE');
    const completedGoals = goals.filter(g => g.status === 'COMPLETED');

    // Goal Card Component
    const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
        const swipeableRef = useRef<Swipeable>(null);
        const config = getCategoryConfig(goal.category);
        const taskCounts = getGoalTaskCounts(goal.id);
        // Calculate progress based on actual task completion
        const progress = taskCounts.total > 0
            ? Math.round((taskCounts.completed / taskCounts.total) * 100)
            : 0;
        const daysRemaining = getDaysRemaining(goal.targetDate);
        // Update status config with actual progress
        const statusConfig = getStatusConfigWithProgress(goal, progress);

        // Render right swipe action (delete button)
        const renderRightActions = (
            progress: Animated.AnimatedInterpolation<number>,
            dragX: Animated.AnimatedInterpolation<number>
        ) => {
            const scale = dragX.interpolate({
                inputRange: [-100, 0],
                outputRange: [1, 0.5],
                extrapolate: 'clamp',
            });

            return (
                <TouchableOpacity
                    style={styles.deleteButtonContainer}
                    onPress={() => {
                        swipeableRef.current?.close();
                        handleDeleteGoal(goal.id, goal.title);
                    }}
                >
                    <Animated.View style={[styles.deleteButton, { transform: [{ scale }] }]}>
                        <Ionicons name="trash-outline" size={24} color="#fff" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </Animated.View>
                </TouchableOpacity>
            );
        };

        return (
            <Swipeable
                ref={swipeableRef}
                renderRightActions={renderRightActions}
                rightThreshold={40}
                friction={2}
                overshootRight={false}
            >
                <View style={styles.goalCardShadow}>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => openGoalTasks(goal)}>
                        <LinearGradient
                            colors={config.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.goalCard}
                        >
                            {/* Dark overlay for better text readability */}
                            <View style={styles.cardOverlay} />

                            {/* Status Badge */}
                            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>{statusConfig.label}</Text>
                            </View>

                            {/* Main Content Row */}
                            <View style={styles.cardMainRow}>
                                {/* Left Side - Goal Info */}
                                <View style={styles.cardLeftSection}>
                                    {/* Category Icon */}
                                    <View style={styles.categoryIconContainer}>
                                        <Ionicons name={config.icon} size={20} color="#fff" />
                                    </View>

                                    {/* Goal Title */}
                                    <Text style={styles.goalTitle} numberOfLines={2}>
                                        {goal.title}
                                    </Text>

                                    {/* Category Label */}
                                    <Text style={styles.categoryLabel}>
                                        {goal.category}
                                    </Text>
                                </View>

                                {/* Right Side - Progress Circle */}
                                <View style={styles.cardRightSection}>
                                    <CircularProgress
                                        progress={progress}
                                        size={80}
                                        strokeWidth={6}
                                        color="#fff"
                                        backgroundColor="rgba(255,255,255,0.3)"
                                    >
                                        <Text style={styles.progressValue}>{progress}%</Text>
                                    </CircularProgress>
                                </View>
                            </View>

                            {/* Stats Row */}
                            <View style={styles.statsRow}>
                                {/* Time Remaining */}
                                <View style={styles.statItem}>
                                    <View style={styles.statIconContainer}>
                                        <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.9)" />
                                    </View>
                                    <View>
                                        <Text style={styles.statValue}>
                                            {daysRemaining}
                                        </Text>
                                        <Text style={styles.statLabel}>days left</Text>
                                    </View>
                                </View>

                                {/* Divider */}
                                <View style={styles.statDivider} />

                                {/* Tasks Completed */}
                                <View style={styles.statItem}>
                                    <View style={styles.statIconContainer}>
                                        <Ionicons name="checkmark-circle-outline" size={16} color="rgba(255,255,255,0.9)" />
                                    </View>
                                    <View>
                                        <Text style={styles.statValue}>
                                            {taskCounts.completed}/{taskCounts.total}
                                        </Text>
                                        <Text style={styles.statLabel}>tasks done</Text>
                                    </View>
                                </View>

                                {/* Divider */}
                                <View style={styles.statDivider} />

                                {/* Priority */}
                                <View style={styles.statItem}>
                                    <View style={styles.statIconContainer}>
                                        <Ionicons name="flag-outline" size={16} color="rgba(255,255,255,0.9)" />
                                    </View>
                                    <View>
                                        <Text style={styles.statValue}>
                                            {goal.priority}
                                        </Text>
                                        <Text style={styles.statLabel}>priority</Text>
                                    </View>
                                </View>
                            </View>

                            {/* AI Badge if available */}
                            {goal.aiGeneratedPlan && (
                                <View style={styles.aiBadge}>
                                    <Ionicons name="sparkles" size={12} color="#fff" />
                                    <Text style={styles.aiBadgeText}>AI Plan Active</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Swipeable>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Background decorative bubbles + outlined goal icons — fixed to screen */}
            <View pointerEvents="none" style={styles.bgDecorWrap}>
                <View style={[styles.bgBubble, styles.bgBubble1]} />
                <View style={[styles.bgBubble, styles.bgBubble2]} />
                <View style={[styles.bgBubble, styles.bgBubble3]} />
                <View style={[styles.bgBubble, styles.bgBubble4]} />
                <View style={[styles.bgBubble, styles.bgBubble5]} />
                <View style={[styles.bgBubble, styles.bgBubble6]} />
                <View style={[styles.bgBubble, styles.bgBubble7]} />

                <View style={[styles.bgIcon, styles.bgIcon1]}>
                    <Ionicons name="flag-outline" size={56} color={colors.primary.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon2]}>
                    <Ionicons name="trophy-outline" size={48} color={colors.accent.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon3]}>
                    <Ionicons name="rocket-outline" size={52} color={colors.primary.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon4]}>
                    <Ionicons name="star-outline" size={42} color={colors.accent.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon5]}>
                    <Ionicons name="ribbon-outline" size={48} color={colors.primary.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon6]}>
                    <Ionicons name="medal-outline" size={46} color={colors.accent.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon7]}>
                    <Ionicons name="compass-outline" size={50} color={colors.primary.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon8]}>
                    <Ionicons name="sparkles-outline" size={40} color={colors.accent.light} />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing['2xl'] }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary.main}
                        colors={[colors.primary.main]}
                        progressViewOffset={insets.top + 80}
                    />
                }
            >
                {/* Gradient Hero Header */}
                <View style={[styles.heroSection, { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xl + spacing.md }]}>
                    <LinearGradient
                        colors={[colors.primary.dark, colors.primary.main, colors.accent.main]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    {/* Decorative translucent circles */}
                    <View style={[styles.decorCircle, styles.decorCircle1]} />
                    <View style={[styles.decorCircle, styles.decorCircle2]} />
                    <View style={[styles.decorCircle, styles.decorCircle3]} />
                    <View style={[styles.decorCircle, styles.decorCircle4]} />

                    <View style={styles.heroContent}>
                        <View style={styles.heroTopRow}>
                            <View style={styles.heroTopLeft}>
                                <View style={styles.heroBadge}>
                                    <Ionicons name="flag" size={14} color="#fff" />
                                    <Text style={styles.heroBadgeText}>MY GOALS</Text>
                                </View>
                                <Text style={styles.heroTitle}>My Goals</Text>
                                <Text style={styles.heroSubtitle}>
                                    {activeGoals.length} active • {completedGoals.length} completed
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.heroNewGoalButton}
                                onPress={handleCreateGoal}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="add" size={18} color={colors.primary.main} />
                                <Text style={styles.heroNewGoalButtonText}>New</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.contentInner}>
                {/* Goals List */}
                {goals.length > 0 ? (
                    <View style={styles.goalsList}>

                        {goals.map((goal) => (
                            <GoalCard key={goal.id} goal={goal} />
                        ))}
                    </View>
                ) : (
                    /* Empty State — Illustration + CTA + Suggestions */
                    <View style={styles.emptyWrap}>
                        {/* Illustration block (target with decorative bubbles) */}
                        <View style={styles.illustrationWrap}>
                            <View style={[styles.illustrationBubble, styles.illustrationBubble1]} />
                            <View style={[styles.illustrationBubble, styles.illustrationBubble2]} />
                            <View style={[styles.illustrationBubble, styles.illustrationBubble3]} />
                            <View style={styles.illustrationStarTL}>
                                <Ionicons name="star" size={18} color={colors.accent.main} />
                            </View>
                            <View style={styles.illustrationStarTR}>
                                <Ionicons name="sparkles" size={20} color={colors.primary.main} />
                            </View>
                            <View style={styles.illustrationIconRing}>
                                <View style={styles.dartboardRing1}>
                                    <View style={styles.dartboardRing2}>
                                        <View style={styles.dartboardRing3}>
                                            <View style={styles.dartboardCenter} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.emptyHeroTitle}>
                            You don't have any goals yet <Text style={{ color: colors.accent.main }}>✨</Text>
                        </Text>
                        <Text style={styles.emptyHeroSubtitle}>
                            Set your first goal and start{'\n'}tracking your progress.
                        </Text>

                        <TouchableOpacity
                            style={styles.emptyCtaShadow}
                            onPress={handleCreateGoal}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[colors.primary.dark, colors.primary.main, colors.accent.main]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.emptyCta}
                            >
                                <Ionicons name="add" size={22} color="#fff" />
                                <Text style={styles.emptyCtaText}>Create Your First Goal</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Suggestions panel */}
                        <View style={styles.suggestionsPanel}>
                            <Text style={styles.suggestionsTitle}>Not sure where to start?</Text>
                            <Text style={styles.suggestionsSubtitle}>Here are some ideas to get you going</Text>
                            <View style={styles.suggestionRow}>
                                <TouchableOpacity
                                    style={styles.suggestionCard}
                                    onPress={handleCreateGoal}
                                    activeOpacity={0.85}
                                >
                                    <View style={[styles.suggestionIconBg, { backgroundColor: colors.primary.main + '18' }]}>
                                        <Ionicons name="briefcase" size={22} color={colors.primary.main} />
                                    </View>
                                    <Text style={styles.suggestionLabel}>Career</Text>
                                    <Text style={styles.suggestionDesc}>Advance your skills & growth</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.suggestionCard}
                                    onPress={handleCreateGoal}
                                    activeOpacity={0.85}
                                >
                                    <View style={[styles.suggestionIconBg, { backgroundColor: '#fce7f3' }]}>
                                        <Ionicons name="heart" size={22} color="#ec4899" />
                                    </View>
                                    <Text style={styles.suggestionLabel}>Health</Text>
                                    <Text style={styles.suggestionDesc}>Build healthy habits</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.suggestionCard}
                                    onPress={handleCreateGoal}
                                    activeOpacity={0.85}
                                >
                                    <View style={[styles.suggestionIconBg, { backgroundColor: colors.accent.main + '18' }]}>
                                        <Ionicons name="airplane" size={22} color={colors.accent.main} />
                                    </View>
                                    <Text style={styles.suggestionLabel}>Travel</Text>
                                    <Text style={styles.suggestionDesc}>Explore new places</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                </View>
            </ScrollView>

            {/* Add Goal Bottom Sheet Modal - Using Shared GoalWizard */}
            <Modal
                visible={showAddGoal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddGoal(false)}
            >
                <View style={styles.bottomSheetOverlay}>
                    <TouchableOpacity
                        style={styles.bottomSheetBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowAddGoal(false)}
                    />
                    <View style={styles.bottomSheet}>
                        {/* Handle */}
                        <View style={styles.bottomSheetHandle} />

                        {/* GoalWizard Component - Same as Onboarding */}
                        <GoalWizard
                            mode="drawer"
                            onComplete={handleWizardComplete}
                            onClose={() => setShowAddGoal(false)}
                            totalSteps={5}
                        />
                    </View>
                </View>
            </Modal>

            {/* Goal Tasks Drawer Modal */}
            <Modal
                visible={selectedGoalForTasks !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedGoalForTasks(null)}
            >
                <View style={styles.tasksDrawerOverlay}>
                    <TouchableOpacity
                        style={styles.tasksDrawerBackdrop}
                        activeOpacity={1}
                        onPress={() => setSelectedGoalForTasks(null)}
                    />
                    <View style={styles.tasksDrawer}>
                        {/* Handle */}
                        <View style={styles.tasksDrawerHandle} />

                        {/* Header */}
                        {selectedGoalForTasks && (
                            <>
                                <View style={styles.tasksDrawerHeader}>
                                    <View style={styles.tasksDrawerHeaderLeft}>
                                        <View style={[styles.tasksDrawerIcon, { backgroundColor: getCategoryConfig(selectedGoalForTasks.category).lightColor }]}>
                                            <Ionicons
                                                name={getCategoryConfig(selectedGoalForTasks.category).icon}
                                                size={20}
                                                color={getCategoryConfig(selectedGoalForTasks.category).gradient[0]}
                                            />
                                        </View>
                                        <View style={styles.tasksDrawerTitleContainer}>
                                            <Text style={styles.tasksDrawerTitle} numberOfLines={1}>
                                                {selectedGoalForTasks.title}
                                            </Text>
                                            <Text style={styles.tasksDrawerSubtitle}>
                                                {getGoalTaskCounts(selectedGoalForTasks.id).completed}/{getGoalTaskCounts(selectedGoalForTasks.id).total} tasks completed
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.tasksDrawerCloseBtn}
                                        onPress={() => setSelectedGoalForTasks(null)}
                                    >
                                        <Ionicons name="close" size={24} color={colors.text.secondary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Tasks List */}
                                <ScrollView
                                    style={styles.tasksDrawerContent}
                                    contentContainerStyle={styles.tasksDrawerScrollContent}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {getTasksForGoal(selectedGoalForTasks.id).length > 0 ? (
                                        getTasksForGoal(selectedGoalForTasks.id).map((task) => (
                                            <View key={task.id} style={styles.drawerTaskCardShadow}>
                                                <Card style={styles.drawerTaskCard}>
                                                    <TouchableOpacity
                                                        style={styles.drawerTaskRow}
                                                        onPress={() => toggleTaskStatus(task)}
                                                    >
                                                        <View style={styles.drawerTaskContent}>
                                                            <Text style={[
                                                                styles.drawerTaskTitle,
                                                                task.status === 'COMPLETED' && styles.drawerTaskTitleCompleted
                                                            ]}>
                                                                {task.title}
                                                            </Text>
                                                            {task.description && (
                                                                <Text style={styles.drawerTaskDescription} numberOfLines={2}>
                                                                    {task.description}
                                                                </Text>
                                                            )}
                                                            <View style={styles.drawerTaskMeta}>
                                                                <View style={[styles.drawerPriorityBadge, { backgroundColor: getTaskPriorityColor(task.priority) + '20' }]}>
                                                                    <Text style={[styles.drawerPriorityText, { color: getTaskPriorityColor(task.priority) }]}>
                                                                        {task.priority}
                                                                    </Text>
                                                                </View>
                                                                <View style={styles.drawerTimeBadge}>
                                                                    <Ionicons name="time-outline" size={12} color={colors.text.secondary} />
                                                                    <Text style={styles.drawerTimeText}>{task.estimatedMinutes}m</Text>
                                                                </View>
                                                                {task.scheduledDate && (
                                                                    <View style={styles.drawerDateBadge}>
                                                                        <Ionicons name="calendar-outline" size={12} color={colors.text.secondary} />
                                                                        <Text style={styles.drawerDateText}>
                                                                            {new Date(task.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                        </Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() => toggleTaskStatus(task)}
                                                            style={[
                                                                styles.drawerCheckbox,
                                                                task.status === 'COMPLETED' && styles.drawerCheckboxCompleted
                                                            ]}
                                                        >
                                                            {task.status === 'COMPLETED' && (
                                                                <Ionicons name="checkmark" size={14} color={colors.text.inverse} />
                                                            )}
                                                        </TouchableOpacity>
                                                    </TouchableOpacity>
                                                </Card>
                                            </View>
                                        ))
                                    ) : (
                                        <View style={styles.drawerEmptyState}>
                                            <Ionicons name="list-outline" size={48} color={colors.text.tertiary} />
                                            <Text style={styles.drawerEmptyTitle}>No tasks yet</Text>
                                            <Text style={styles.drawerEmptyText}>
                                                Tasks will appear here once they're generated or added.
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    scrollContent: {
        paddingBottom: spacing['2xl'],
    },
    contentInner: {
        paddingHorizontal: spacing.screenPadding,
        paddingTop: spacing.lg,
    },

    // Gradient hero header
    heroSection: {
        width: '100%',
        overflow: 'hidden',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingHorizontal: spacing.screenPadding,
    },
    heroContent: {
        zIndex: 2,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    heroTopLeft: {
        flex: 1,
    },
    heroBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: spacing.sm,
    },
    heroBadgeText: {
        fontSize: 10,
        fontWeight: '700' as any,
        color: '#fff',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '800' as any,
        color: '#fff',
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: typography.fontSize.sm,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
    },
    heroNewGoalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 14,
        backgroundColor: '#fff',
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 4,
    },
    heroNewGoalButtonText: {
        fontSize: typography.fontSize.sm,
        color: colors.primary.main,
        fontWeight: '700' as any,
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    decorCircle1: { width: 140, height: 140, top: -40, right: -30 },
    decorCircle2: { width: 80, height: 80, bottom: -20, left: -20, backgroundColor: 'rgba(255,255,255,0.08)' },
    decorCircle3: { width: 50, height: 50, top: 60, right: 80, backgroundColor: 'rgba(255,255,255,0.18)' },
    decorCircle4: { width: 24, height: 24, bottom: 30, right: 50, backgroundColor: 'rgba(255,255,255,0.25)' },

    // Background decorative bubbles (white area)
    bgDecorWrap: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    bgBubble: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: colors.primary.background,
        opacity: 0.6,
    },
    bgBubble1: { width: 220, height: 220, top: 240, right: -110 },
    bgBubble2: { width: 160, height: 160, top: 460, left: -80 },
    bgBubble3: { width: 120, height: 120, top: 640, right: -50 },
    bgBubble4: { width: 70, height: 70, top: 270, left: 24, opacity: 0.5 },
    bgBubble5: { width: 40, height: 40, top: 410, right: 30, opacity: 0.7 },
    bgBubble6: { width: 90, height: 90, top: 580, left: 40, opacity: 0.4 },
    bgBubble7: { width: 55, height: 55, top: 700, right: 80, opacity: 0.55 },

    bgIcon: {
        position: 'absolute',
        opacity: 0.18,
    },
    bgIcon1: { top: 260, right: 22, transform: [{ rotate: '-12deg' }] },
    bgIcon2: { top: 340, left: 18, transform: [{ rotate: '15deg' }] },
    bgIcon3: { top: 420, right: 18, transform: [{ rotate: '-8deg' }] },
    bgIcon4: { top: 500, left: 30, transform: [{ rotate: '20deg' }] },
    bgIcon5: { top: 560, right: 28, transform: [{ rotate: '-15deg' }] },
    bgIcon6: { top: 620, left: 24, transform: [{ rotate: '10deg' }] },
    bgIcon7: { top: 680, right: 36, transform: [{ rotate: '-20deg' }] },
    bgIcon8: { top: 740, left: 50, transform: [{ rotate: '8deg' }] },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.variants.h3,
        color: colors.text.primary,
    },
    subtitle: {
        ...typography.variants.caption,
        color: colors.text.secondary,
        marginTop: 2,
    },
    newGoalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primary.main,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: spacing.borderRadius.lg,
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    newGoalButtonText: {
        ...typography.variants.label,
        color: '#fff',
        fontWeight: '600',
    },

    // Section Title
    sectionTitle: {
        ...typography.variants.label,
        color: colors.text.secondary,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Goals List
    goalsList: {
        gap: spacing.md,
    },

    // Delete Button (Swipe Action)
    deleteButtonContainer: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: spacing.md,
    },
    deleteButton: {
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: spacing.borderRadius.xl,
        marginLeft: spacing.sm,
    },
    deleteButtonText: {
        ...typography.variants.caption,
        color: '#fff',
        fontWeight: '600',
        marginTop: 4,
    },

    // Goal Card Shadow Wrapper
    goalCardShadow: {
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 12,
    },
    // Goal Card
    goalCard: {
        marginHorizontal: spacing.xs,
        minHeight: CARD_HEIGHT,
        borderRadius: spacing.borderRadius.xl,
        padding: spacing.md,
        paddingBottom: spacing.lg,
        overflow: 'hidden',
    },

    // Dark overlay for text readability
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },

    // Status Badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
        marginBottom: spacing.sm,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
    },
    statusText: {
        ...typography.variants.caption,
        color: '#fff',
        fontWeight: '600',
    },

    // Card Main Row
    cardMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
        minHeight: 90,
    },
    cardLeftSection: {
        flex: 1,
        marginRight: spacing.lg,
        justifyContent: 'center',
    },
    cardRightSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },

    // Category Icon
    categoryIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },

    // Goal Title
    goalTitle: {
        ...typography.variants.h4,
        color: '#fff',
        fontWeight: '700',
        marginBottom: 4,
    },
    categoryLabel: {
        ...typography.variants.caption,
        color: 'rgba(255,255,255,0.8)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Progress
    progressValue: {
        ...typography.variants.h4,
        color: '#fff',
        fontWeight: '700',
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: spacing.borderRadius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        justifyContent: 'center',
    },
    statIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 9,
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    // AI Badge
    aiBadge: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 10,
    },
    aiBadgeText: {
        ...typography.variants.caption,
        color: '#fff',
        fontWeight: '500',
        fontSize: 10,
    },

    // Empty State — Hero illustration version (responsive)
    emptyWrap: {
        alignItems: 'center',
        paddingTop: IS_SMALL_SCREEN ? spacing.md : spacing.lg,
        paddingBottom: spacing.lg,
    },
    illustrationWrap: {
        width: EMPTY_ILLUSTRATION_SIZE,
        height: EMPTY_ILLUSTRATION_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: IS_SMALL_SCREEN ? spacing.sm : spacing.md,
    },
    illustrationBubble: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: colors.primary.background,
    },
    illustrationBubble1: {
        width: EMPTY_ILLUSTRATION_SIZE * 0.82,
        height: EMPTY_ILLUSTRATION_SIZE * 0.82,
        opacity: 0.55,
    },
    illustrationBubble2: {
        width: EMPTY_ILLUSTRATION_SIZE * 0.36,
        height: EMPTY_ILLUSTRATION_SIZE * 0.36,
        top: EMPTY_ILLUSTRATION_SIZE * 0.09,
        left: EMPTY_ILLUSTRATION_SIZE * 0.045,
        opacity: 0.45,
    },
    illustrationBubble3: {
        width: EMPTY_ILLUSTRATION_SIZE * 0.27,
        height: EMPTY_ILLUSTRATION_SIZE * 0.27,
        bottom: EMPTY_ILLUSTRATION_SIZE * 0.09,
        right: EMPTY_ILLUSTRATION_SIZE * 0.04,
        opacity: 0.55,
    },
    illustrationStarTL: {
        position: 'absolute',
        top: 0,
        left: EMPTY_ILLUSTRATION_SIZE * 0.13,
        opacity: 0.85,
    },
    illustrationStarTR: {
        position: 'absolute',
        top: EMPTY_ILLUSTRATION_SIZE * 0.05,
        right: EMPTY_ILLUSTRATION_SIZE * 0.08,
        opacity: 0.9,
    },
    illustrationIconRing: {
        width: EMPTY_RING_SIZE,
        height: EMPTY_RING_SIZE,
        borderRadius: EMPTY_RING_SIZE / 2,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 6,
    },
    // Dartboard (stacked concentric circles)
    dartboardRing1: {
        width: EMPTY_RING_SIZE * 0.78,
        height: EMPTY_RING_SIZE * 0.78,
        borderRadius: (EMPTY_RING_SIZE * 0.78) / 2,
        backgroundColor: colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dartboardRing2: {
        width: '78%',
        height: '78%',
        borderRadius: 999,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dartboardRing3: {
        width: '70%',
        height: '70%',
        borderRadius: 999,
        backgroundColor: colors.primary.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dartboardCenter: {
        width: '40%',
        height: '40%',
        borderRadius: 999,
        backgroundColor: '#fff',
    },
    emptyHeroTitle: {
        fontSize: IS_SMALL_SCREEN ? 18 : 22,
        fontWeight: '800' as any,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xs,
        letterSpacing: -0.3,
    },
    emptyHeroSubtitle: {
        fontSize: IS_SMALL_SCREEN ? 13 : typography.fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: IS_SMALL_SCREEN ? spacing.md : spacing.lg,
        lineHeight: IS_SMALL_SCREEN ? 18 : 22,
    },
    emptyCtaShadow: {
        width: '85%',
        borderRadius: 16,
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: IS_SMALL_SCREEN ? spacing.md : spacing.lg,
    },
    emptyCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: IS_SMALL_SCREEN ? 11 : 14,
        borderRadius: 16,
    },
    emptyCtaText: {
        color: '#fff',
        fontSize: IS_SMALL_SCREEN ? 14 : typography.fontSize.base,
        fontWeight: '700' as any,
        letterSpacing: 0.2,
    },
    suggestionsPanel: {
        width: '100%',
        backgroundColor: colors.primary.background,
        borderRadius: 18,
        padding: IS_SMALL_SCREEN ? spacing.md : spacing.lg,
        alignItems: 'center',
    },
    suggestionsTitle: {
        fontSize: IS_SMALL_SCREEN ? 14 : typography.fontSize.base,
        fontWeight: '700' as any,
        color: colors.text.primary,
        marginBottom: 2,
    },
    suggestionsSubtitle: {
        fontSize: IS_SMALL_SCREEN ? 12 : typography.fontSize.sm,
        color: colors.text.secondary,
        marginBottom: IS_SMALL_SCREEN ? spacing.sm : spacing.md,
    },
    suggestionRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        width: '100%',
    },
    suggestionCard: {
        flex: 1,
        backgroundColor: colors.background.primary,
        borderRadius: 14,
        padding: IS_SMALL_SCREEN ? spacing.sm : spacing.md,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    suggestionIconBg: {
        width: IS_SMALL_SCREEN ? 38 : 48,
        height: IS_SMALL_SCREEN ? 38 : 48,
        borderRadius: IS_SMALL_SCREEN ? 19 : 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: IS_SMALL_SCREEN ? 6 : spacing.sm,
    },
    suggestionLabel: {
        fontSize: IS_SMALL_SCREEN ? 12 : typography.fontSize.sm,
        fontWeight: '700' as any,
        color: colors.text.primary,
        marginBottom: 2,
    },
    suggestionDesc: {
        fontSize: IS_SMALL_SCREEN ? 10 : 11,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: IS_SMALL_SCREEN ? 13 : 14,
    },

    // Empty State (legacy — kept for safety)
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
        paddingHorizontal: spacing.lg,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.neutral[100],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        ...typography.variants.h4,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    emptyText: {
        ...typography.variants.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primary.main,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: spacing.borderRadius.lg,
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyButtonText: {
        ...typography.variants.label,
        color: '#fff',
        fontWeight: '600',
    },

    // Bottom Sheet - Full Screen
    bottomSheetOverlay: {
        flex: 1,
    },
    bottomSheetBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    bottomSheet: {
        flex: 1,
        backgroundColor: colors.background.primary,
        marginTop: Platform.OS === 'ios' ? 50 : 30,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    bottomSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.neutral[300],
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    bottomSheetTitle: {
        ...typography.variants.h4,
        color: colors.text.primary,
    },

    // Tasks Drawer - Full Screen Bottom Sheet
    tasksDrawerOverlay: {
        flex: 1,
    },
    tasksDrawerBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    tasksDrawer: {
        flex: 1,
        backgroundColor: colors.background.primary,
        marginTop: Platform.OS === 'ios' ? 60 : 40,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    tasksDrawerHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.neutral[300],
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    tasksDrawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    tasksDrawerHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: spacing.sm,
    },
    tasksDrawerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tasksDrawerTitleContainer: {
        flex: 1,
    },
    tasksDrawerTitle: {
        ...typography.variants.label,
        color: colors.text.primary,
        fontWeight: '600',
    },
    tasksDrawerSubtitle: {
        ...typography.variants.caption,
        color: colors.text.secondary,
        marginTop: 2,
    },
    tasksDrawerCloseBtn: {
        padding: spacing.xs,
    },
    tasksDrawerContent: {
        flex: 1,
    },
    tasksDrawerScrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing['2xl'],
    },

    // Drawer Task Cards (same style as TasksScreen)
    drawerTaskCardShadow: {
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 6,
    },
    drawerTaskCard: {
        padding: spacing.md,
        backgroundColor: colors.background.primary,
        borderRadius: spacing.borderRadius.lg,
    },
    drawerTaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    drawerTaskContent: {
        flex: 1,
    },
    drawerTaskTitle: {
        ...typography.variants.label,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    drawerTaskTitleCompleted: {
        textDecorationLine: 'line-through',
        color: colors.text.secondary,
    },
    drawerTaskDescription: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    drawerTaskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    drawerPriorityBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: spacing.borderRadius.sm,
    },
    drawerPriorityText: {
        ...typography.variants.caption,
        fontWeight: '600',
    },
    drawerTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    drawerTimeText: {
        ...typography.variants.caption,
        color: colors.text.secondary,
    },
    drawerDateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    drawerDateText: {
        ...typography.variants.caption,
        color: colors.text.secondary,
    },
    drawerCheckbox: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
    },
    drawerCheckboxCompleted: {
        backgroundColor: colors.success.main,
        borderColor: colors.success.main,
    },
    drawerEmptyState: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
        paddingHorizontal: spacing.lg,
    },
    drawerEmptyTitle: {
        ...typography.variants.labelLarge,
        color: colors.text.primary,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    drawerEmptyText: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        textAlign: 'center',
    },
});

export default GoalsScreen;
