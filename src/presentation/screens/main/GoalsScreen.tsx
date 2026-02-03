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
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { Card } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { Goal, GoalCategory, GoalPriority } from '@/domain/entities/Goal';
import { getGoalsLocally, getTasksLocally, deleteGoalLocally, updateTaskStatusLocally, USE_LOCAL_DATA } from '@/data';
import { Task } from '@/domain/entities/Task';
import { useAuthStore } from '@/infrastructure/stores/authStore';
import { GoalWizard, GoalWizardData } from '@/presentation/components/goal/GoalWizard';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.28; // ~1/4 of screen

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
    const user = useAuthStore((state) => state.user);
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
                            await deleteGoalLocally(goalId);
                            await loadData();
                            console.log('[GoalsScreen] Goal deleted:', goalId);
                        } catch (error) {
                            console.error('[GoalsScreen] Error deleting goal:', error);
                            Alert.alert('Error', 'Failed to delete goal. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    // Load goals and tasks from local storage
    const loadData = async () => {
        if (USE_LOCAL_DATA) {
            try {
                const localGoals = await getGoalsLocally();
                const localTasks = await getTasksLocally();
                setGoals(localGoals);
                setTasks(localTasks);
                console.log('[GoalsScreen] Loaded goals:', localGoals.length);
            } catch (error) {
                console.error('[GoalsScreen] Error loading data:', error);
            }
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
        if (USE_LOCAL_DATA) {
            await updateTaskStatusLocally(task.id, newStatus);
            await loadData();
        }
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
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>My Goals</Text>
                        <Text style={styles.subtitle}>
                            {activeGoals.length} active • {completedGoals.length} completed
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.newGoalButton} onPress={handleCreateGoal}>
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={styles.newGoalButtonText}>New Goal</Text>
                    </TouchableOpacity>
                </View>

                {/* Goals List */}
                {goals.length > 0 ? (
                    <View style={styles.goalsList}>

                        {goals.map((goal) => (
                            <GoalCard key={goal.id} goal={goal} />
                        ))}
                    </View>
                ) : (
                    /* Empty State */
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="flag-outline" size={48} color={colors.text.tertiary} />
                        </View>
                        <Text style={styles.emptyTitle}>No goals yet</Text>
                        <Text style={styles.emptyText}>
                            Start by creating your first goal. Our AI will help you break it down into achievable steps.
                        </Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={handleCreateGoal}>
                            <Ionicons name="add-circle-outline" size={20} color="#fff" />
                            <Text style={styles.emptyButtonText}>Create Your First Goal</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    scrollContent: {
        padding: spacing.screenPadding,
        paddingBottom: spacing['2xl'],
    },

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

    // Empty State
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
