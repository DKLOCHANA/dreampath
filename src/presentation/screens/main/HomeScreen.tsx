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
    Modal,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_IMAGE_KEY = '@dreampath_profile_image';

import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { useAuthStore } from '@/infrastructure/stores/authStore';
import { MainTabParamList } from '@/presentation/navigation/types';
import { Goal, GoalCategory } from '@/domain/entities/Goal';
import { Task } from '@/domain/entities/Task';
import { 
    getGoals, 
    getTasks, 
    updateTaskStatus, 
    saveTasks,
} from '@/data/dataSyncService';
import { useTaskBatchManager } from '@/presentation/hooks/useTaskBatchManager';
import { isOnline, showNoInternetAlert } from '@/services/networkService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 740;
const EMPTY_ILLUSTRATION_SIZE = IS_SMALL_SCREEN ? 150 : 200;
const EMPTY_RING_SIZE = IS_SMALL_SCREEN ? 90 : 124;

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
    if (hour < 12) return 'Good Morning!';
    if (hour < 17) return 'Good Afternoon!';
    return 'Good Evening!';
};

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeNavigationProp>();
    const user = useAuthStore((state) => state.user);
    const insets = useSafeAreaInsets();

    const [goals, setGoals] = useState<Goal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);

    // Use task batch manager to auto-generate tasks for long goals
    const { checkAllGoals } = useTaskBatchManager({
        autoCheckOnForeground: true,
        onNewTasksGenerated: async (newTasks, goalId) => {
            console.log('[HomeScreen] New tasks generated:', newTasks.length, 'for goal:', goalId);
            // Reload data to show new tasks
            await loadData();
        },
        onBatchComplete: (goalId) => {
            console.log('[HomeScreen] All tasks generated for goal:', goalId);
        },
    });

    // Load profile image from cache
    const loadProfileImage = async () => {
        try {
            const savedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
            if (savedImage) {
                setProfileImage(savedImage);
            }
        } catch (error) {
            console.error('[HomeScreen] Error loading profile image:', error);
        }
    };

    // Load data (uses sync service - local + Firestore)
    const loadData = async (forceSync: boolean = false) => {
        // Always load profile image
        await loadProfileImage();

        try {
            const [loadedGoals, loadedTasks] = await Promise.all([
                getGoals(forceSync),
                getTasks(forceSync),
            ]);
            setGoals(loadedGoals);
            setTasks(loadedTasks);
        } catch (error) {
            console.error('[HomeScreen] Error loading data:', error);
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
        
        // Check network connectivity for sync
        const hasInternet = await isOnline();
        if (!hasInternet) {
            // Load local data only when offline
            await loadData(false);
            setRefreshing(false);
            showNoInternetAlert(
                'Offline Mode',
                'Showing cached data. Connect to the internet to sync your latest data.'
            );
            return;
        }
        
        // Force sync from Firestore on refresh
        await loadData(true);
        // Check if we need to generate more tasks for any goal
        await checkAllGoals();
        await loadData(); // Reload in case new tasks were generated
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

    // Toggle task completion (syncs to Firestore)
    const toggleTaskStatus = async (task: Task) => {
        const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        await updateTaskStatus(task.id, newStatus);
        await loadData();
    };

    // Show task details modal
    const showTaskDetails = (task: Task) => {
        setSelectedTask(task);
    };

    // Get task goal for modal
    const getTaskGoal = (task: Task | null) => {
        if (!task) return null;
        return goals.find(g => g.id === task.goalId);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Background decorative bubbles + outlined home icons — fixed to screen */}
            <View pointerEvents="none" style={styles.bgDecorWrap}>
                <View style={[styles.bgBubble, styles.bgBubble1]} />
                <View style={[styles.bgBubble, styles.bgBubble2]} />
                <View style={[styles.bgBubble, styles.bgBubble3]} />
                <View style={[styles.bgBubble, styles.bgBubble4]} />
                <View style={[styles.bgBubble, styles.bgBubble5]} />
                <View style={[styles.bgBubble, styles.bgBubble6]} />
                <View style={[styles.bgBubble, styles.bgBubble7]} />

                <View style={[styles.bgIcon, styles.bgIcon1]}>
                    <Ionicons name="sunny-outline" size={52} color={colors.primary.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon2]}>
                    <Ionicons name="today-outline" size={48} color={colors.accent.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon3]}>
                    <Ionicons name="trophy-outline" size={54} color={colors.primary.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon4]}>
                    <Ionicons name="star-outline" size={42} color={colors.accent.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon5]}>
                    <Ionicons name="sparkles-outline" size={46} color={colors.primary.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon6]}>
                    <Ionicons name="rocket-outline" size={48} color={colors.accent.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon7]}>
                    <Ionicons name="bulb-outline" size={40} color={colors.primary.light} />
                </View>
                <View style={[styles.bgIcon, styles.bgIcon8]}>
                    <Ionicons name="flag-outline" size={44} color={colors.accent.light} />
                </View>
            </View>

            {/* Docked Hero Header (fixed at top — does not scroll) */}
            <View style={styles.heroShadowWrapper}>
                <LinearGradient
                    colors={[colors.primary.dark, colors.primary.main, colors.accent.main]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.heroSection, { paddingTop: insets.top + spacing.sm }]}
                >
                        {/* Decorative translucent circles */}
                        <View style={[styles.decorCircle, styles.decorCircle1]} />
                        <View style={[styles.decorCircle, styles.decorCircle2]} />
                        <View style={[styles.decorCircle, styles.decorCircle3]} />
                        <View style={[styles.decorCircle, styles.decorCircle4]} />

                        {/* Header — greeting/name + avatar */}
                        <View style={styles.heroHeader}>
                            <View style={styles.heroHeaderLeft}>
                                <Text style={styles.heroGreeting}>{getGreeting()}</Text>
                                <Text style={styles.heroName} numberOfLines={1}>
                                    {user?.displayName || 'User'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.avatar}
                                onPress={() => navigation.navigate('Profile')}
                                activeOpacity={0.7}
                            >
                                {profileImage ? (
                                    <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                                ) : user?.photoURL ? (
                                    <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                    </Text>
                                )}
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

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.main} />
                }
            >
                {goals.length === 0 && tasks.length === 0 ? (
                /* Welcome — no goals, no tasks */
                <View style={styles.welcomeEmptyWrap}>
                    <View style={styles.illustrationWrap}>
                        <View style={[styles.illustrationBubble, styles.illustrationBubble1]} />
                        <View style={[styles.illustrationBubble, styles.illustrationBubble2]} />
                        <View style={[styles.illustrationBubble, styles.illustrationBubble3]} />
                        <View style={styles.illustrationStarTL}>
                            <Ionicons name="sparkles" size={18} color={colors.accent.main} />
                        </View>
                        <View style={styles.illustrationStarTR}>
                            <Ionicons name="paper-plane" size={20} color={colors.primary.main} />
                        </View>
                        <View style={styles.illustrationIconRing}>
                            <Ionicons name="clipboard-outline" size={IS_SMALL_SCREEN ? 46 : 64} color={colors.primary.main} />
                        </View>
                    </View>

                    <Text style={styles.welcomeTitle}>
                        Welcome! Let's get started <Text>🚀</Text>
                    </Text>
                    <Text style={styles.welcomeSubtitle}>
                        You don't have any tasks or goals yet.{'\n'}Add your first task or set a goal to start making progress!
                    </Text>

                    <View style={styles.welcomeActionsRow}>
                        <TouchableOpacity
                            style={styles.welcomeOutlineBtn}
                            onPress={() => navigation.navigate('Goals')}
                            activeOpacity={0.85}
                        >
                            <View style={styles.welcomeOutlineIconBg}>
                                <Ionicons name="locate" size={IS_SMALL_SCREEN ? 16 : 20} color="#ec4899" />
                            </View>
                            <Text style={styles.welcomeOutlineText}>Create Goal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.welcomeSolidBtnShadow}
                            onPress={() => navigation.navigate('Tasks')}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[colors.primary.dark, colors.primary.main, colors.accent.main]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.welcomeSolidBtn}
                            >
                                <View style={styles.welcomeSolidIconBg}>
                                    <Ionicons name="add" size={IS_SMALL_SCREEN ? 16 : 18} color={colors.primary.main} />
                                </View>
                                <Text style={styles.welcomeSolidText}>Add Task</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tipCard}>
                        <View style={styles.tipIcon}>
                            <Ionicons name="bulb" size={IS_SMALL_SCREEN ? 18 : 22} color={colors.primary.main} />
                        </View>
                        <Text style={styles.tipText}>
                            Small steps every day{'\n'}lead to big results.
                        </Text>
                    </View>
                </View>
                ) : (
                <>
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
                                        onPress={() => showTaskDetails(task)}
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
                            horizontal={goals.length > 1}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={goals.length === 1 ? styles.goalsScrollContentSingle : styles.goalsScrollContent}
                            scrollEnabled={goals.length > 1}
                        >
                            {goals.map((goal) => {
                                const categoryConfig = getCategoryConfig(goal.category);
                                const goalTasks = tasks.filter(t => t.goalId === goal.id);
                                const goalCompleted = goalTasks.filter(t => t.status === 'COMPLETED').length;
                                const goalProgress = goalTasks.length > 0
                                    ? Math.round((goalCompleted / goalTasks.length) * 100)
                                    : 0;

                                return (
                                    <View key={goal.id} style={goals.length === 1 ? styles.goalCardShadowFull : styles.goalCardShadow}>
                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            onPress={() => navigation.navigate('Goals')}
                                        >
                                            <LinearGradient
                                                colors={categoryConfig.gradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={goals.length === 1 ? styles.goalCardFull : styles.goalCard}
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
                </>
                )}


            </ScrollView>

            {/* Task Detail Modal */}
            <Modal
                visible={selectedTask !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedTask(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedTask(null)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalContent}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {selectedTask && (
                            <>
                                {/* Close Button */}
                                <TouchableOpacity
                                    onPress={() => setSelectedTask(null)}
                                    style={styles.modalCloseBtn}
                                >
                                    <Ionicons name="close" size={24} color={colors.text.secondary} />
                                </TouchableOpacity>

                                {/* Title */}
                                <Text style={styles.modalTitle}>{selectedTask.title}</Text>

                                {/* Meta Info */}
                                <Text style={styles.modalMeta}>
                                    {selectedTask.estimatedMinutes} min • {selectedTask.priority} priority • {selectedTask.status}
                                </Text>

                                {/* Goal */}
                                {getTaskGoal(selectedTask) && (
                                    <Text style={styles.modalGoal}>Goal: {getTaskGoal(selectedTask)?.title}</Text>
                                )}

                                {/* Description */}
                                <ScrollView style={styles.modalDescScroll} nestedScrollEnabled>
                                    {selectedTask.description && (
                                        <Text style={styles.modalDesc}>{selectedTask.description}</Text>
                                    )}

                                    {/* Tips */}
                                    {selectedTask.aiReasoning && (
                                        <>
                                            <Text style={styles.modalTipsLabel}>💡 Tips</Text>
                                            <Text style={styles.modalDesc}>{selectedTask.aiReasoning}</Text>
                                        </>
                                    )}
                                </ScrollView>

                                {/* Action Button */}
                                <TouchableOpacity
                                    style={styles.modalActionBtn}
                                    onPress={() => {
                                        toggleTaskStatus(selectedTask);
                                        setSelectedTask(null);
                                    }}
                                >
                                    <Text style={styles.modalActionText}>
                                        {selectedTask.status === 'COMPLETED' ? 'Mark Incomplete' : 'Mark Complete'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: spacing.lg,
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
        paddingBottom: spacing.md,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    heroHeaderLeft: {
        flex: 1,
        marginRight: spacing.sm,
    },
    heroGreeting: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium as any,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 1,
    },
    heroName: {
        fontSize: typography.fontSize.lg,
        fontWeight: '800' as any,
        color: '#fff',
        letterSpacing: -0.3,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
    bgBubble1: { width: 220, height: 220, top: 350, right: -110 },
    bgBubble2: { width: 160, height: 160, top: 540, left: -80 },
    bgBubble3: { width: 120, height: 120, top: 700, right: -50 },
    bgBubble4: { width: 70, height: 70, top: 390, left: 24, opacity: 0.5 },
    bgBubble5: { width: 40, height: 40, top: 500, right: 30, opacity: 0.7 },
    bgBubble6: { width: 90, height: 90, top: 640, left: 40, opacity: 0.4 },
    bgBubble7: { width: 55, height: 55, top: 750, right: 80, opacity: 0.55 },

    bgIcon: {
        position: 'absolute',
        opacity: 0.18,
    },
    bgIcon1: { top: 370, right: 22, transform: [{ rotate: '-12deg' }] },
    bgIcon2: { top: 440, left: 18, transform: [{ rotate: '15deg' }] },
    bgIcon3: { top: 510, right: 18, transform: [{ rotate: '-8deg' }] },
    bgIcon4: { top: 580, left: 30, transform: [{ rotate: '20deg' }] },
    bgIcon5: { top: 630, right: 28, transform: [{ rotate: '-15deg' }] },
    bgIcon6: { top: 680, left: 24, transform: [{ rotate: '10deg' }] },
    bgIcon7: { top: 730, right: 36, transform: [{ rotate: '-20deg' }] },
    bgIcon8: { top: 770, left: 50, transform: [{ rotate: '8deg' }] },
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
        marginTop: spacing.lg,
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
    goalsScrollContentSingle: {
        paddingBottom: 10,
        flex: 1,
    },
    goalCardShadow: {
        marginRight: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 10,
    },
    goalCardShadowFull: {
        flex: 1,
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
    goalCardFull: {
        width: '100%',
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

    // Welcome Empty State (no goals + no tasks) — responsive
    welcomeEmptyWrap: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
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
    welcomeTitle: {
        fontSize: IS_SMALL_SCREEN ? 18 : 22,
        fontWeight: '800' as any,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xs,
        letterSpacing: -0.3,
    },
    welcomeSubtitle: {
        fontSize: IS_SMALL_SCREEN ? 13 : typography.fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: IS_SMALL_SCREEN ? spacing.md : spacing.lg,
        lineHeight: IS_SMALL_SCREEN ? 18 : 22,
    },
    welcomeActionsRow: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
        marginBottom: IS_SMALL_SCREEN ? spacing.md : spacing.lg,
    },
    welcomeOutlineBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: spacing.md,
        paddingVertical: IS_SMALL_SCREEN ? 11 : 14,
        borderWidth: 1,
        borderColor: colors.primary.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    welcomeOutlineIconBg: {
        width: IS_SMALL_SCREEN ? 26 : 30,
        height: IS_SMALL_SCREEN ? 26 : 30,
        borderRadius: IS_SMALL_SCREEN ? 13 : 15,
        backgroundColor: '#fce7f3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    welcomeOutlineText: {
        fontSize: IS_SMALL_SCREEN ? 14 : typography.fontSize.base,
        fontWeight: '700' as any,
        color: colors.text.primary,
    },
    welcomeSolidBtnShadow: {
        flex: 1,
        borderRadius: 16,
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    welcomeSolidBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: IS_SMALL_SCREEN ? 10 : 12,
        borderRadius: 16,
    },
    welcomeSolidIconBg: {
        width: IS_SMALL_SCREEN ? 26 : 30,
        height: IS_SMALL_SCREEN ? 26 : 30,
        borderRadius: IS_SMALL_SCREEN ? 13 : 15,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    welcomeSolidText: {
        fontSize: IS_SMALL_SCREEN ? 14 : typography.fontSize.base,
        fontWeight: '700' as any,
        color: '#fff',
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: '#e0f7f1',
        borderRadius: 16,
        padding: IS_SMALL_SCREEN ? spacing.sm : spacing.md,
        width: '100%',
    },
    tipIcon: {
        width: IS_SMALL_SCREEN ? 38 : 44,
        height: IS_SMALL_SCREEN ? 38 : 44,
        borderRadius: IS_SMALL_SCREEN ? 19 : 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tipText: {
        flex: 1,
        fontSize: IS_SMALL_SCREEN ? 13 : typography.fontSize.base,
        fontWeight: '600' as any,
        color: colors.text.primary,
        lineHeight: IS_SMALL_SCREEN ? 17 : 20,
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

    // Task Detail Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: spacing.lg,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    modalCloseBtn: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        padding: spacing.xs,
        zIndex: 1,
    },
    modalTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        textAlign: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        paddingHorizontal: spacing.xl,
    },
    modalMeta: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    modalGoal: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    modalDescScroll: {
        maxHeight: 300,
        marginBottom: spacing.lg,
    },
    modalDesc: {
        fontSize: typography.fontSize.sm,
        color: colors.text.primary,
        lineHeight: 22,
        textAlign: 'left',
    },
    modalTipsLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold as any,
        color: colors.text.primary,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    modalActionBtn: {
        backgroundColor: colors.primary.main,
        paddingVertical: spacing.sm + 2,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalActionText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold as any,
        color: '#fff',
    },

});

export default HomeScreen;
