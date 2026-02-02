// src/presentation/screens/main/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { useAuthStore } from '@/infrastructure/stores/authStore';
import { MainTabParamList } from '@/presentation/navigation/types';
import { Goal, GoalCategory } from '@/domain/entities/Goal';
import { Task } from '@/domain/entities/Task';
import { getGoalsLocally, getTasksLocally, updateTaskStatusLocally, USE_LOCAL_DATA } from '@/data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HomeNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

// Circular Progress Component
const CircularProgress: React.FC<{
    progress: number;
    size: number;
    strokeWidth: number;
    color?: string;
    backgroundColor?: string;
    children?: React.ReactNode;
}> = ({ progress, size, strokeWidth, color = '#fff', backgroundColor = 'rgba(255,255,255,0.3)', children }) => {
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

// Category config with gradients
const getCategoryConfig = (category: GoalCategory): {
    icon: keyof typeof Ionicons.glyphMap;
    gradient: [string, string];
} => {
    const configs: Record<GoalCategory, { icon: keyof typeof Ionicons.glyphMap; gradient: [string, string] }> = {
        CAREER: { icon: 'briefcase', gradient: ['#667eea', '#764ba2'] },
        FINANCIAL: { icon: 'wallet', gradient: ['#11998e', '#38ef7d'] },
        HEALTH: { icon: 'fitness', gradient: ['#f093fb', '#f5576c'] },
        EDUCATION: { icon: 'book', gradient: ['#4facfe', '#00f2fe'] },
        PERSONAL: { icon: 'leaf', gradient: ['#43e97b', '#38f9d7'] },
        RELATIONSHIP: { icon: 'heart', gradient: ['#fa709a', '#fee140'] },
        OTHER: { icon: 'flag', gradient: ['#a8edea', '#fed6e3'] },
    };
    return configs[category] || configs.OTHER;
};

// Priority color mapping
const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
        case 'HIGH': return '#ef4444';
        case 'MEDIUM': return '#f59e0b';
        case 'LOW': return '#10b981';
        default: return colors.text.secondary;
    }
};

// Get greeting based on time
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
};

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeNavigationProp>();
    const user = useAuthStore((state) => state.user);

    const [goals, setGoals] = useState<Goal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Load data
    const loadData = async () => {
        if (USE_LOCAL_DATA) {
            try {
                const localGoals = await getGoalsLocally();
                const localTasks = await getTasksLocally();
                setGoals(localGoals);
                setTasks(localTasks);
            } catch (error) {
                console.error('[HomeScreen] Error loading data:', error);
            }
        }
    };

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

    // Get today's tasks sorted by priority
    const today = new Date();
    const todaysTasks = tasks
        .filter(task => {
            if (!task.scheduledDate) return false;
            const taskDate = new Date(task.scheduledDate);
            return taskDate.toDateString() === today.toDateString();
        })
        .sort((a, b) => {
            const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
            return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
        });

    // Get only incomplete tasks to display (completed tasks are hidden from list)
    const incompleteTodaysTasks = todaysTasks.filter(t => t.status !== 'COMPLETED');

    // Calculate overall stats
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const totalTasks = tasks.length;
    const todayCompleted = todaysTasks.filter(t => t.status === 'COMPLETED').length;
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Toggle task completion
    const toggleTaskStatus = async (task: Task) => {
        const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

        if (USE_LOCAL_DATA) {
            await updateTaskStatusLocally(task.id, newStatus);
            await loadData();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {/* Hero Section with Gradient */}
                <View style={styles.heroShadowWrapper}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2', '#f093fb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroSection}
                    >
                        {/* Header */}
                        <View style={styles.heroHeader}>
                            <View style={styles.userInfo}>
                                <View style={styles.avatar}>
                                    {user?.photoURL ? (
                                        <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                                    ) : (
                                        <Text style={styles.avatarText}>
                                            {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                        </Text>
                                    )}
                                </View>
                                <View>
                                    <Text style={styles.heroGreeting}>{getGreeting()}</Text>
                                    <Text style={styles.heroName}>{user?.displayName || 'User'}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.notificationButton}>
                                <Ionicons name="notifications-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Main Progress Card */}
                        <View style={styles.progressCard}>
                            <View style={styles.progressCardLeft}>
                                <Text style={styles.progressCardTitle}>Today's Progress</Text>
                                <Text style={styles.progressCardSubtitle}>
                                    {todayCompleted} of {todaysTasks.length} tasks completed
                                </Text>
                                <View style={styles.progressBarContainer}>
                                    <View style={styles.progressBarBg}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                { width: `${todaysTasks.length > 0 ? (todayCompleted / todaysTasks.length) * 100 : 0}%` }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressBarText}>
                                        {todaysTasks.length > 0 ? Math.round((todayCompleted / todaysTasks.length) * 100) : 0}%
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.progressCardDivider} />
                            <View style={styles.progressCardRight}>
                                <Text style={styles.overallLabel}>Overall</Text>
                                <CircularProgress
                                    progress={overallProgress}
                                    size={68}
                                    strokeWidth={5}
                                    color="#fff"
                                    backgroundColor="rgba(255,255,255,0.3)"
                                >
                                    <View style={styles.progressCircleContent}>
                                        <Text style={styles.progressCircleValue}>{overallProgress}</Text>
                                        <Text style={styles.progressCircleLabel}>%</Text>
                                    </View>
                                </CircularProgress>
                            </View>
                        </View>

                        {/* Quick Stats */}
                        <View style={styles.quickStats}>
                            <View style={styles.quickStatItem}>
                                <View style={styles.quickStatIcon}>
                                    <Ionicons name="trophy-outline" size={16} color="#fff" />
                                </View>
                                <View style={styles.quickStatTextColumn}>
                                    <Text style={styles.quickStatValue}>{goals.length}</Text>
                                    <Text style={styles.quickStatLabel}>Goals</Text>
                                </View>
                            </View>
                            <View style={styles.quickStatDivider} />
                            <View style={styles.quickStatItem}>
                                <View style={styles.quickStatIcon}>
                                    <Ionicons name="checkbox-outline" size={16} color="#fff" />
                                </View>
                                <View style={styles.quickStatTextColumn}>
                                    <Text style={styles.quickStatValue}>{completedTasks}</Text>
                                    <Text style={styles.quickStatLabel}>Done</Text>
                                </View>
                            </View>
                            <View style={styles.quickStatDivider} />
                            <View style={styles.quickStatItem}>
                                <View style={styles.quickStatIcon}>
                                    <Ionicons name="flame-outline" size={16} color="#fff" />
                                </View>
                                <View style={styles.quickStatTextColumn}>
                                    <Text style={styles.quickStatValue}>{totalTasks - completedTasks}</Text>
                                    <Text style={styles.quickStatLabel}>Pending</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Today's Tasks Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="today-outline" size={20} color={colors.text.primary} />
                            <Text style={styles.sectionTitle}>Today's Tasks</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.seeAllButton}
                            onPress={() => navigation.navigate('Tasks')}
                        >
                            <Text style={styles.seeAllText}>See all</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.primary.main} />
                        </TouchableOpacity>
                    </View>

                    {incompleteTodaysTasks.length > 0 ? (
                        incompleteTodaysTasks.slice(0, 5).map((task) => {
                            const taskGoal = goals.find(g => g.id === task.goalId);
                            const categoryConfig = taskGoal ? getCategoryConfig(taskGoal.category) : null;
                            const priorityColor = getPriorityColor(task.priority);

                            return (
                                <View key={task.id} style={styles.taskCardShadow}>
                                    <TouchableOpacity
                                        style={styles.taskCard}
                                        activeOpacity={0.7}
                                    >
                                        {/* Left Gradient Accent */}
                                        <LinearGradient
                                            colors={categoryConfig?.gradient || [colors.primary.main, colors.primary.light]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 0, y: 1 }}
                                            style={styles.taskAccentBar}
                                        />

                                        <View style={styles.taskContent}>
                                            {/* Header with Checkbox */}
                                            <View style={styles.taskHeader}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.taskCheckbox,
                                                        task.status === 'COMPLETED' && styles.taskCheckboxCompleted
                                                    ]}
                                                    onPress={() => toggleTaskStatus(task)}
                                                >
                                                    {task.status === 'COMPLETED' && (
                                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                                    )}
                                                </TouchableOpacity>

                                                <View style={styles.taskInfo}>
                                                    <Text
                                                        style={[
                                                            styles.taskTitle,
                                                            task.status === 'COMPLETED' && styles.taskTitleCompleted
                                                        ]}
                                                        numberOfLines={2}
                                                    >
                                                        {task.title}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Meta Row */}
                                            <View style={styles.taskMetaRow}>
                                                {taskGoal && (
                                                    <View style={[
                                                        styles.taskGoalBadge,
                                                        { backgroundColor: (categoryConfig?.gradient[0] || colors.primary.main) + '12' }
                                                    ]}>
                                                        <Ionicons
                                                            name={categoryConfig?.icon || 'flag'}
                                                            size={12}
                                                            color={categoryConfig?.gradient[0] || colors.primary.main}
                                                        />
                                                        <Text style={[
                                                            styles.taskGoalText,
                                                            { color: categoryConfig?.gradient[0] || colors.primary.main }
                                                        ]} numberOfLines={1}>
                                                            {taskGoal.title}
                                                        </Text>
                                                    </View>
                                                )}

                                                <View style={styles.taskMetaRight}>
                                                    <View style={styles.taskMetaItem}>
                                                        <Ionicons name="time-outline" size={13} color={colors.text.tertiary} />
                                                        <Text style={styles.taskMetaText}>{task.estimatedMinutes}m</Text>
                                                    </View>
                                                    <View style={[
                                                        styles.priorityBadge,
                                                        { backgroundColor: priorityColor + '12' }
                                                    ]}>
                                                        <Text style={[styles.priorityText, { color: priorityColor }]}>
                                                            {task.priority}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="sunny-outline" size={32} color={colors.primary.main} />
                            </View>
                            <Text style={styles.emptyTitle}>No tasks for today</Text>
                            <Text style={styles.emptyText}>
                                Enjoy your free day or add new tasks!
                            </Text>
                        </View>
                    )}
                </View>

                {/* Your Goals Section with Gradient Cards */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="flag-outline" size={20} color={colors.text.primary} />
                            <Text style={styles.sectionTitle}>Your Goals</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.seeAllButton}
                            onPress={() => navigation.navigate('Goals')}
                        >
                            <Text style={styles.seeAllText}>See all</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.primary.main} />
                        </TouchableOpacity>
                    </View>

                    {goals.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.goalsScrollContent}
                        >
                            {goals.map((goal) => {
                                const categoryConfig = getCategoryConfig(goal.category);
                                const goalTasks = tasks.filter(t => t.goalId === goal.id);
                                const goalCompleted = goalTasks.filter(t => t.status === 'COMPLETED').length;
                                const goalProgress = goalTasks.length > 0
                                    ? Math.round((goalCompleted / goalTasks.length) * 100)
                                    : 0;

                                return (
                                    <View key={goal.id} style={styles.goalCardShadow}>
                                        <TouchableOpacity activeOpacity={0.9}>
                                            <LinearGradient
                                                colors={categoryConfig.gradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.goalCard}
                                            >
                                                <View style={styles.goalCardHeader}>
                                                    <View style={styles.goalCategoryIcon}>
                                                        <Ionicons name={categoryConfig.icon} size={18} color="#fff" />
                                                    </View>
                                                    <CircularProgress
                                                        progress={goalProgress}
                                                        size={44}
                                                        strokeWidth={4}
                                                        color="#fff"
                                                        backgroundColor="rgba(255,255,255,0.3)"
                                                    >
                                                        <Text style={styles.goalCardProgress}>{goalProgress}%</Text>
                                                    </CircularProgress>
                                                </View>

                                                <Text style={styles.goalCardTitle} numberOfLines={2}>
                                                    {goal.title}
                                                </Text>

                                                <View style={styles.goalCardFooter}>
                                                    <View style={styles.goalCardStat}>
                                                        <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
                                                        <Text style={styles.goalCardStatText}>
                                                            {goalCompleted}/{goalTasks.length}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.goalCardStat}>
                                                        <Ionicons name="calendar" size={14} color="rgba(255,255,255,0.8)" />
                                                        <Text style={styles.goalCardStatText}>
                                                            {goal.targetDate
                                                                ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                                : 'No date'
                                                            }
                                                        </Text>
                                                    </View>
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="flag-outline" size={32} color={colors.primary.main} />
                            </View>
                            <Text style={styles.emptyTitle}>No goals yet</Text>
                            <Text style={styles.emptyText}>
                                Create your first goal to get started!
                            </Text>
                        </View>
                    )}
                </View>


            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    scrollContent: {
        paddingBottom: 30,
    },

    // Hero Section Shadow Wrapper
    heroShadowWrapper: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 12,
    },
    // Hero Section - Beautiful Gradient Header
    heroSection: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md + 4,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarImage: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    heroGreeting: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium as any,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 1,
    },
    heroName: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
    },
    notificationButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Progress Card
    progressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: spacing.md + 4,
        marginBottom: spacing.sm,
    },
    progressCardLeft: {
        flex: 0.55,
        marginRight: spacing.sm,
    },
    progressCardTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
        marginBottom: 2,
    },
    progressCardSubtitle: {
        fontSize: typography.fontSize.xs,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: spacing.sm,
    },
    progressBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 3,
    },
    progressBarText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
        minWidth: 28,
    },
    progressCardDivider: {
        width: 1,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.25)',
        marginHorizontal: spacing.md,
    },
    progressCardRight: {
        flex: 0.35,
        alignItems: 'center',
    },
    overallLabel: {
        fontSize: 10,
        fontWeight: typography.fontWeight.semibold as any,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressCircleContent: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    progressCircleValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    progressCircleLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
    },

    // Quick Stats
    quickStats: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        //backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        width: '95%',
    },
    quickStatItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    quickStatIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickStatTextColumn: {
        alignItems: 'flex-start',
    },
    quickStatValue: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
        lineHeight: 18,
    },
    quickStatLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: typography.fontWeight.medium as any,
        lineHeight: 12,
    },
    quickStatDivider: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    // Section
    section: {
        paddingHorizontal: spacing.lg,
        marginTop: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    seeAllText: {
        fontSize: typography.fontSize.sm,
        color: colors.primary.main,
        fontWeight: typography.fontWeight.semibold as any,
    },

    // Task Cards - Clean Design with Subtle Gradient Accent
    taskCardShadow: {
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 6,
    },
    taskCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    taskAccentBar: {
        width: 4,
    },
    taskContent: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md + 2,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm + 2,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold as any,
        color: colors.text.primary,
        lineHeight: 22,
    },
    taskTitleCompleted: {
        textDecorationLine: 'line-through',
        color: colors.text.tertiary,
    },
    taskCheckbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.neutral[300],
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginTop: 2,
    },
    taskCheckboxCompleted: {
        borderWidth: 0,
        backgroundColor: '#10b981',
    },
    taskMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm + 2,
        paddingLeft: 34,
    },
    taskGoalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
        maxWidth: '55%',
    },
    taskGoalText: {
        fontSize: 11,
        fontWeight: typography.fontWeight.medium as any,
    },
    taskMetaRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    taskMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    taskMetaText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: typography.fontWeight.bold as any,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    // Goals Section - Horizontal Scroll with Gradient Cards
    goalsScrollContent: {
        paddingBottom: 10,
        paddingRight: spacing.lg,
    },
    goalCardShadow: {
        marginRight: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 10,
    },
    goalCard: {
        width: SCREEN_WIDTH * 0.65,
        minHeight: 160,
        borderRadius: 20,
        padding: spacing.lg,
        overflow: 'hidden',
    },
    goalCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    goalCategoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    goalCardProgress: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    goalCardTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
        marginBottom: spacing.md,
        lineHeight: 24,
    },
    goalCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginTop: 'auto',
    },
    goalCardStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    goalCardStatText: {
        fontSize: typography.fontSize.sm,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: typography.fontWeight.medium as any,
    },

    // Empty States
    emptyCard: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: spacing.xl + 10,
        paddingHorizontal: spacing.lg,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: colors.primary.main + '12',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        marginBottom: 4,
    },
    emptyText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
    },


});

export default HomeScreen;
