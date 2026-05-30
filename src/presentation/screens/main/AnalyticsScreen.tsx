// src/presentation/screens/main/AnalyticsScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Modal,
    Animated,
    Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { Goal, GoalCategory } from '@/domain/entities/Goal';
import { Task } from '@/domain/entities/Task';
import { getGoals, getTasks } from '@/data';
import { getGoalsLocally, getTasksLocally } from '@/data/localDataService';
import { useIsPro } from '@/infrastructure/stores/subscriptionStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@/presentation/navigation/types';
import { isOnline } from '@/services/networkService';

// ============ API CONFIG ============
const API_BASE_URL = 'https://dreampath-api.vercel.app';

// ============ CACHE CONFIG ============
const AI_INSIGHTS_CACHE_KEY = '@dreampath_ai_insights';
const AI_INSIGHTS_TIMESTAMP_KEY = '@dreampath_ai_insights_timestamp';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// ============ AI INSIGHTS TYPES ============
interface AIInsight {
    icon: string;
    title: string;
    description: string;
    color: 'success' | 'primary' | 'warning' | 'error';
}

interface AITip {
    tip: string;
}

interface AIFocusRecommendation {
    title: string;
    description: string;
    actionItems: string[];
}

interface AIInsightsResponse {
    weeklySummary: string;
    insights: AIInsight[];
    tips: AITip[];
    focusRecommendation: AIFocusRecommendation;
    motivationalMessage: string;
}

// Map color names to actual colors
const getInsightColor = (colorName: 'success' | 'primary' | 'warning' | 'error'): string => {
    const colorMap = {
        success: colors.success.main,
        primary: colors.primary.main,
        warning: colors.warning.main,
        error: colors.error.main,
    };
    return colorMap[colorName] || colors.primary.main;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ CATEGORY CONFIG ============
const getCategoryConfig = (category: GoalCategory): {
    icon: keyof typeof Ionicons.glyphMap;
    gradient: [string, string];
    color: string;
} => {
    const configs: Record<GoalCategory, { icon: keyof typeof Ionicons.glyphMap; gradient: [string, string]; color: string }> = {
        CAREER: { icon: 'briefcase', gradient: ['#667eea', '#764ba2'], color: '#667eea' },
        FINANCIAL: { icon: 'wallet', gradient: ['#56ab91', '#14505c'], color: '#56ab91' },
        HEALTH: { icon: 'fitness', gradient: ['#f093fb', '#f5576c'], color: '#f093fb' },
        EDUCATION: { icon: 'book', gradient: ['#00f2fe', '#4facfe'], color: '#4facfe' },
        PERSONAL: { icon: 'leaf', gradient: ['#38f9d7', '#43e97b'], color: '#38f9d7' },
        RELATIONSHIP: { icon: 'heart', gradient: ['#fee140', '#fa709a'], color: '#fa709a' },
        OTHER: { icon: 'flag', gradient: ['#e0c3fc', '#8866b3'], color: '#8866b3' },
    };
    return configs[category] || configs.OTHER;
};

// Fallback data when AI is unavailable
const FALLBACK_INSIGHTS: AIInsight[] = [
    {
        icon: 'trending-up',
        title: 'Keep it up!',
        description: 'You are making progress on your goals. Continue with your momentum!',
        color: 'success',
    },
    {
        icon: 'time-outline',
        title: 'Time management',
        description: 'Schedule your most important tasks during your peak productivity hours.',
        color: 'primary',
    },
    {
        icon: 'bulb-outline',
        title: 'Stay focused',
        description: 'Break down large tasks into smaller steps to make progress easier.',
        color: 'warning',
    },
];

const FALLBACK_TIPS: AITip[] = [
    { tip: 'Start your day with the most challenging task' },
    { tip: 'Take 5-minute breaks every 25 minutes' },
    { tip: 'Review your goals every Sunday evening' },
    { tip: 'Celebrate small wins to stay motivated' },
];

// Circular Progress Component
const CircularProgress: React.FC<{
    progress: number;
    size: number;
    strokeWidth: number;
    color?: string;
    backgroundColor?: string;
    children?: React.ReactNode;
}> = ({ progress, size, strokeWidth, color = colors.primary.main, backgroundColor = colors.neutral[200], children }) => {
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

export const AnalyticsScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
    const insets = useSafeAreaInsets();
    const isPro = useIsPro();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // AI Insights state
    const [aiInsights, setAiInsights] = useState<AIInsightsResponse | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [showGeneratingModal, setShowGeneratingModal] = useState(false);
    const [lastCacheDate, setLastCacheDate] = useState<Date | null>(null);

    // Animation for loading modal
    const spinValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;

    // Start spinning animation for modal
    const startSpinAnimation = useCallback(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [spinValue]);

    // Start pulse animation for modal
    const startPulseAnimation = useCallback(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseValue, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseValue]);

    // Fetch real data
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const [localGoals, localTasks] = await Promise.all([
                    getGoals(),
                    getTasks(),
                ]);
                setGoals(localGoals.filter(g => g.status === 'ACTIVE' || g.status === 'COMPLETED'));
                setTasks(localTasks);
            } catch (error) {
                console.error('Error loading analytics data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // ============ COMPUTED DATA ============
    const WEEKLY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Calculate stats from real data
    const totalGoals = goals.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate streak (simplified - consecutive days with completed tasks)
    const calculateStreak = (): number => {
        const completedDates = tasks
            .filter(t => t.status === 'COMPLETED' && t.completedAt)
            .map(t => new Date(t.completedAt!).toDateString())
            .filter((date, index, arr) => arr.indexOf(date) === index)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        if (completedDates.length === 0) return 0;

        let streak = 1;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < completedDates.length - 1; i++) {
            const current = new Date(completedDates[i]);
            const next = new Date(completedDates[i + 1]);
            const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };
    const streak = calculateStreak();

    // Calculate weekly data
    const getWeekStart = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const thisWeekStart = getWeekStart(new Date());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Format week range for display
    const getWeekRangeString = (): string => {
        const weekEnd = new Date(thisWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const formatDate = (date: Date) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}`;
        };

        return `${formatDate(thisWeekStart)} - ${formatDate(weekEnd)}`;
    };

    const thisWeekCompleted = tasks.filter(t => {
        if (t.status !== 'COMPLETED' || !t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= thisWeekStart;
    }).length;

    const lastWeekCompleted = tasks.filter(t => {
        if (t.status !== 'COMPLETED' || !t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= lastWeekStart && completedDate < thisWeekStart;
    }).length;

    const weeklyChange = lastWeekCompleted > 0
        ? Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100)
        : thisWeekCompleted > 0 ? 100 : 0;

    // Calculate weekly time distribution per goal
    const goalsWithTime = goals.map(goal => {
        const goalTasks = tasks.filter(t => t.goalId === goal.id);
        const completedThisWeek = goalTasks.filter(t => {
            if (t.status !== 'COMPLETED' || !t.completedAt) return false;
            return new Date(t.completedAt) >= thisWeekStart;
        });
        const weeklyMinutes = completedThisWeek.reduce((sum, t) => sum + (t.actualMinutes || t.estimatedMinutes || 0), 0);
        const config = getCategoryConfig(goal.category);
        return {
            id: goal.id,
            name: goal.title,
            category: goal.category,
            color: config.color,
            gradient: config.gradient,
            icon: config.icon,
            weeklyMinutes,
            totalTasks: goalTasks.length,
            completedTasks: goalTasks.filter(t => t.status === 'COMPLETED').length,
        };
    });

    const totalWeeklyMinutes = goalsWithTime.reduce((sum, g) => sum + g.weeklyMinutes, 0);

    // Calculate weekly progress per goal (tasks completed each day of the week)
    const weeklyGoalsData = goals.map(goal => {
        const goalTasks = tasks.filter(t => t.goalId === goal.id && t.status === 'COMPLETED' && t.completedAt);
        const config = getCategoryConfig(goal.category);

        const data = WEEKLY_DAYS.map((_, dayIndex) => {
            const dayStart = new Date(thisWeekStart);
            dayStart.setDate(dayStart.getDate() + dayIndex);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            return goalTasks.filter(t => {
                const completed = new Date(t.completedAt!);
                return completed >= dayStart && completed < dayEnd;
            }).length;
        });

        return {
            goalId: goal.id,
            goalName: goal.title.length > 12 ? goal.title.substring(0, 12) + '...' : goal.title,
            color: config.color,
            data,
        };
    });

    const maxWeeklyValue = Math.max(1, ...weeklyGoalsData.flatMap(g => g.data));

    // Format minutes to hours and minutes
    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    // ============ SMART FOCUS ALGORITHM ============
    // Always show a goal to focus on - prioritize goals that need the most attention
    interface GoalPriorityData {
        goal: typeof goalsWithTime[0];
        originalGoal: Goal;
        priorityScore: number;
        progressPercent: number;
        expectedProgress: number;
        daysRemaining: number;
        tasksRemaining: number;
        urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
        reason: string;
    }

    const calculateGoalPriority = (): GoalPriorityData | null => {
        if (goals.length === 0 || goalsWithTime.length === 0) return null;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const priorityData: GoalPriorityData[] = goals.map((originalGoal, index) => {
            const goalData = goalsWithTime[index];
            if (!goalData) return null;

            const startDate = new Date(originalGoal.startDate);
            const targetDate = new Date(originalGoal.targetDate);
            startDate.setHours(0, 0, 0, 0);
            targetDate.setHours(0, 0, 0, 0);

            // Calculate time metrics
            const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
            const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // Calculate progress metrics
            const progressPercent = goalData.totalTasks > 0
                ? (goalData.completedTasks / goalData.totalTasks) * 100
                : 0;

            // Expected progress based on time elapsed
            const expectedProgress = daysElapsed <= 0 ? 0 : Math.min(100, (daysElapsed / totalDays) * 100);

            const tasksRemaining = goalData.totalTasks - goalData.completedTasks;

            // Skip completed goals
            if (tasksRemaining === 0 || progressPercent >= 100) {
                return null;
            }

            // ============ PRIORITY SCORE CALCULATION ============
            let priorityScore = 0;
            let urgencyLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
            let reason = '';

            // 1. OVERDUE - Highest priority (100 points)
            if (daysRemaining < 0) {
                priorityScore = 100;
                urgencyLevel = 'critical';
                reason = `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) > 1 ? 's' : ''}, ${tasksRemaining} tasks left`;

                return {
                    goal: goalData,
                    originalGoal,
                    priorityScore,
                    progressPercent,
                    expectedProgress,
                    daysRemaining,
                    tasksRemaining,
                    urgencyLevel,
                    reason,
                };
            }

            // 2. DEADLINE APPROACHING with many tasks left
            // Calculate tasks per day needed
            const tasksPerDay = daysRemaining > 0 ? tasksRemaining / daysRemaining : tasksRemaining;

            if (daysRemaining <= 7 && tasksRemaining > 0) {
                // Less than a week left
                priorityScore = 80 + (7 - daysRemaining) * 2; // 80-94 points
                if (tasksPerDay > 2) {
                    urgencyLevel = 'critical';
                    reason = `Only ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left, need ${tasksPerDay.toFixed(1)} tasks/day`;
                } else {
                    urgencyLevel = 'high';
                    reason = `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining, ${tasksRemaining} tasks to complete`;
                }
            }
            // 3. BEHIND SCHEDULE - Behind expected progress
            else if (expectedProgress > progressPercent) {
                const gap = expectedProgress - progressPercent;
                priorityScore = 40 + Math.min(gap, 40); // 40-80 points based on gap

                if (gap >= 25) {
                    urgencyLevel = 'critical';
                    reason = `${Math.round(gap)}% behind schedule`;
                } else if (gap >= 10) {
                    urgencyLevel = 'high';
                    reason = `Falling behind, ${Math.round(gap)}% below expected`;
                } else {
                    urgencyLevel = 'medium';
                    reason = `Slightly behind schedule`;
                }
            }
            // 4. NOT STARTED - Goal exists but 0% progress
            else if (progressPercent === 0 && goalData.totalTasks > 0) {
                priorityScore = 35; // Lower than behind schedule, but still important
                urgencyLevel = 'medium';
                reason = `Not started yet, ${goalData.totalTasks} tasks waiting`;
            }
            // 5. LOWEST COMPLETION - On track but least complete
            else {
                // Use inverse of progress as score (lower progress = higher score)
                priorityScore = ((100 - progressPercent) / 100) * 30; // 0-30 points
                urgencyLevel = 'low';
                reason = `${tasksRemaining} tasks remaining`;
            }

            return {
                goal: goalData,
                originalGoal,
                priorityScore,
                progressPercent,
                expectedProgress,
                daysRemaining,
                tasksRemaining,
                urgencyLevel,
                reason,
            };
        }).filter((item): item is GoalPriorityData => item !== null);

        if (priorityData.length === 0) return null;

        // Sort by priority score (highest first) and return the top priority goal
        priorityData.sort((a, b) => b.priorityScore - a.priorityScore);

        return priorityData[0]; // Always return the highest priority incomplete goal
    };

    const focusGoal = calculateGoalPriority();

    // Get urgency badge color
    const getUrgencyColor = (level: 'critical' | 'high' | 'medium' | 'low'): [string, string] => {
        switch (level) {
            case 'critical': return ['#ef4444', '#dc2626'];
            case 'high': return ['#f59e0b', '#d97706'];
            case 'medium': return ['#667eea', '#764ba2'];
            case 'low': return ['#10b981', '#059669'];
        }
    };

    const getUrgencyLabel = (level: 'critical' | 'high' | 'medium' | 'low'): string => {
        switch (level) {
            case 'critical': return 'CRITICAL';
            case 'high': return 'HIGH PRIORITY';
            case 'medium': return 'PRIORITY';
            case 'low': return 'ON TRACK';
        }
    };

    // ============ CACHE HELPER FUNCTIONS ============
    const getCachedInsights = useCallback(async (): Promise<{ insights: AIInsightsResponse | null; timestamp: Date | null }> => {
        try {
            const [cachedData, cachedTimestamp] = await Promise.all([
                AsyncStorage.getItem(AI_INSIGHTS_CACHE_KEY),
                AsyncStorage.getItem(AI_INSIGHTS_TIMESTAMP_KEY),
            ]);

            if (cachedData && cachedTimestamp) {
                const insights = JSON.parse(cachedData) as AIInsightsResponse;
                const timestamp = new Date(cachedTimestamp);
                return { insights, timestamp };
            }
        } catch (error) {
            console.error('Error reading cached insights:', error);
        }
        return { insights: null, timestamp: null };
    }, []);

    const saveCachedInsights = useCallback(async (insights: AIInsightsResponse): Promise<void> => {
        try {
            const now = new Date().toISOString();
            await Promise.all([
                AsyncStorage.setItem(AI_INSIGHTS_CACHE_KEY, JSON.stringify(insights)),
                AsyncStorage.setItem(AI_INSIGHTS_TIMESTAMP_KEY, now),
            ]);
            setLastCacheDate(new Date(now));
        } catch (error) {
            console.error('Error saving cached insights:', error);
        }
    }, []);

    const isCacheExpired = useCallback((timestamp: Date | null): boolean => {
        if (!timestamp) return true;
        const now = new Date().getTime();
        const cacheTime = timestamp.getTime();
        return (now - cacheTime) >= CACHE_DURATION_MS;
    }, []);

    // ============ AI INSIGHTS FETCH ============
    const fetchAIInsights = useCallback(async (forceRefresh: boolean = false) => {
        if (goals.length === 0) {
            setAiInsights(null);
            return;
        }

        try {
            setAiError(null);

            // Check cache first (unless force refresh)
            if (!forceRefresh) {
                const { insights: cachedInsights, timestamp } = await getCachedInsights();

                if (cachedInsights && timestamp && !isCacheExpired(timestamp)) {
                    // Use cached data - no need to call API
                    setAiInsights(cachedInsights);
                    setLastCacheDate(timestamp);
                    console.log('Using cached AI insights from:', timestamp.toLocaleDateString());
                    return;
                }
            }

            // Check network connectivity before API call
            const hasInternet = await isOnline();
            if (!hasInternet) {
                // Try to use cached data when offline
                const { insights: cachedInsights, timestamp } = await getCachedInsights();
                if (cachedInsights) {
                    setAiInsights(cachedInsights);
                    setLastCacheDate(timestamp);
                    setAiError('Showing cached insights. Connect to internet for fresh AI analysis.');
                } else {
                    setAiError('No internet connection. Connect to the internet to get AI insights.');
                    setAiInsights(null);
                }
                return;
            }

            // Cache expired or force refresh - call API
            setIsLoadingAI(true);
            setShowGeneratingModal(true);
            startSpinAnimation();
            startPulseAnimation();

            // Prepare goals data for API
            const goalsData = goals.map(g => ({
                id: g.id,
                title: g.title,
                category: g.category,
                priority: g.priority,
                status: g.status,
                startDate: g.startDate,
                targetDate: g.targetDate,
                totalTasks: g.metrics?.totalTasks || 0,
                completedTasks: g.metrics?.completedTasks || 0,
                completionPercentage: g.metrics?.completionPercentage || 0,
            }));

            // Prepare tasks data
            const tasksData = tasks.map(t => ({
                id: t.id,
                goalId: t.goalId,
                status: t.status,
                scheduledDate: t.scheduledDate,
                completedAt: t.completedAt,
                estimatedMinutes: t.estimatedMinutes,
                actualMinutes: t.actualMinutes,
            }));

            // Prepare stats
            const statsData = {
                totalGoals,
                totalTasks,
                completedTasks,
                overallProgress,
                streak,
                weeklyChange,
                totalWeeklyMinutes,
                thisWeekCompleted,
            };

            // Prepare focus goal data
            const focusGoalData = focusGoal ? {
                goalName: focusGoal.goal.name,
                progressPercent: focusGoal.progressPercent,
                expectedProgress: focusGoal.expectedProgress,
                daysRemaining: focusGoal.daysRemaining,
                tasksRemaining: focusGoal.tasksRemaining,
                urgencyLevel: focusGoal.urgencyLevel,
                reason: focusGoal.reason,
            } : undefined;

            const response = await fetch(`${API_BASE_URL}/api/analytics-insights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    goals: goalsData,
                    tasks: tasksData,
                    stats: statsData,
                    focusGoal: focusGoalData,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch AI insights');
            }

            const result = await response.json();

            if (result.success && result.data) {
                setAiInsights(result.data);
                // Save to cache
                await saveCachedInsights(result.data);
            } else {
                throw new Error(result.error || 'Failed to get insights');
            }
        } catch (error) {
            console.error('Error fetching AI insights:', error);
            setAiError('Unable to load AI insights');
            // Try to use cached data as fallback
            const { insights: cachedInsights, timestamp } = await getCachedInsights();
            if (cachedInsights) {
                setAiInsights(cachedInsights);
                setLastCacheDate(timestamp);
            } else {
                setAiInsights(null);
            }
        } finally {
            setIsLoadingAI(false);
            setShowGeneratingModal(false);
        }
    }, [goals, tasks, totalGoals, totalTasks, completedTasks, overallProgress, streak, weeklyChange, totalWeeklyMinutes, thisWeekCompleted, focusGoal, getCachedInsights, saveCachedInsights, isCacheExpired, startSpinAnimation, startPulseAnimation]);

    // Force refresh AI insights (bypasses cache)
    const forceRefreshAIInsights = useCallback(async () => {
        await fetchAIInsights(true);
    }, [fetchAIInsights]);

    // Fetch AI insights when data changes
    useEffect(() => {
        if (!isLoading && goals.length > 0) {
            fetchAIInsights();
        }
    }, [isLoading, goals.length]);

    // Pull to refresh handler (respects cache - only refreshes local data)
    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const [localGoals, localTasks] = await Promise.all([
                getGoalsLocally(),
                getTasksLocally(),
            ]);
            setGoals(localGoals.filter(g => g.status === 'ACTIVE' || g.status === 'COMPLETED'));
            setTasks(localTasks);
            // AI insights will check cache - won't regenerate unless 7 days passed
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Calculate days until next AI refresh
    const getDaysUntilRefresh = useCallback((): number | null => {
        if (!lastCacheDate) return null;
        const nextRefresh = new Date(lastCacheDate.getTime() + CACHE_DURATION_MS);
        const now = new Date();
        const daysRemaining = Math.ceil((nextRefresh.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysRemaining);
    }, [lastCacheDate]);

    // Get current insights and tips (AI or fallback)
    const currentInsights = aiInsights?.insights || FALLBACK_INSIGHTS;
    const currentTips = aiInsights?.tips || FALLBACK_TIPS;

    // ============ PREMIUM GATE ============
    // Only Pro subscribers can access the Analytics screen
    if (!isPro) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar style="dark" />
                <View style={styles.premiumGateContainer}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.premiumGateIcon}
                    >
                        <Ionicons name="lock-closed" size={36} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.premiumGateTitle}>Premium Feature</Text>
                    <Text style={styles.premiumGateDescription}>
                        Advanced Analytics & AI Insights are available exclusively for VividGoals Pro subscribers.
                    </Text>
                    <TouchableOpacity
                        style={styles.premiumGateButton}
                        onPress={() => navigation.navigate('Paywall')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.premiumGateButtonGradient}
                        >
                            <Ionicons name="diamond" size={18} color="#fff" />
                            <Text style={styles.premiumGateButtonText}>Unlock with Pro</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar style="dark" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary.main} />
                    <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* AI Report Generation Modal */}
            <Modal
                visible={showGeneratingModal}
                transparent={true}
                animationType="fade"
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.modalGradient}
                        >
                            {/* Animated AI Icon */}
                            <Animated.View
                                style={[
                                    styles.modalIconContainer,
                                    {
                                        transform: [
                                            {
                                                rotate: spinValue.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0deg', '360deg'],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <View style={styles.modalIconInner}>
                                    <Ionicons name="sparkles" size={32} color="#667eea" />
                                </View>
                            </Animated.View>

                            {/* Title with pulse animation */}
                            <Animated.Text
                                style={[
                                    styles.modalTitle,
                                    { transform: [{ scale: pulseValue }] },
                                ]}
                            >
                                Creating Your Report
                            </Animated.Text>

                            <Text style={styles.modalSubtitle}>
                                Our AI is analyzing your goals and tasks
                            </Text>

                            {/* Loading dots animation */}
                            <View style={styles.modalLoadingDots}>
                                <View style={styles.modalDotRow}>
                                    <View style={[styles.modalDot, styles.modalDot1]} />
                                    <View style={[styles.modalDot, styles.modalDot2]} />
                                    <View style={[styles.modalDot, styles.modalDot3]} />
                                </View>
                            </View>

                            {/* Progress steps */}
                            <View style={styles.modalSteps}>
                                <View style={styles.modalStep}>
                                    <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.modalStepText}>Gathering your data</Text>
                                </View>
                                <View style={styles.modalStep}>
                                    <Ionicons name="analytics" size={16} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.modalStepText}>Analyzing progress</Text>
                                </View>
                                <View style={styles.modalStep}>
                                    <Ionicons name="bulb" size={16} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.modalStepText}>Generating insights</Text>
                                </View>
                            </View>

                            <Text style={styles.modalFooter}>
                                This report updates weekly to save resources ✨
                            </Text>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary.main}
                        colors={[colors.primary.main]}
                        progressViewOffset={insets.top + 80}
                    />
                }
            >
                {/* Background decorative bubbles + outlined icons */}
                <View pointerEvents="none" style={styles.bgDecorWrap}>
                    <View style={[styles.bgBubble, styles.bgBubble1]} />
                    <View style={[styles.bgBubble, styles.bgBubble2]} />
                    <View style={[styles.bgBubble, styles.bgBubble3]} />
                    <View style={[styles.bgBubble, styles.bgBubble4]} />
                    <View style={[styles.bgBubble, styles.bgBubble5]} />
                    <View style={[styles.bgBubble, styles.bgBubble6]} />
                    <View style={[styles.bgBubble, styles.bgBubble7]} />

                    <View style={[styles.bgIcon, styles.bgIcon1]}>
                        <Ionicons name="trophy-outline" size={56} color={colors.primary.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon2]}>
                        <Ionicons name="flag-outline" size={44} color={colors.accent.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon3]}>
                        <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.primary.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon4]}>
                        <Ionicons name="star-outline" size={40} color={colors.accent.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon5]}>
                        <Ionicons name="ribbon-outline" size={52} color={colors.primary.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon6]}>
                        <Ionicons name="rocket-outline" size={48} color={colors.accent.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon7]}>
                        <Ionicons name="medal-outline" size={44} color={colors.primary.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon8]}>
                        <Ionicons name="bulb-outline" size={38} color={colors.accent.light} />
                    </View>
                </View>

                {/* Gradient Hero Header */}
                <View style={[styles.heroSection, { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xl + spacing.lg }]}>
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
                                    <Ionicons name="analytics" size={14} color="#fff" />
                                    <Text style={styles.heroBadgeText}>WEEKLY REPORT</Text>
                                </View>
                                <Text style={styles.heroTitle}>Analytics</Text>
                                <Text style={styles.heroSubtitle}>
                                    Week of {getWeekRangeString()}
                                </Text>
                            </View>
                            <CircularProgress
                                progress={overallProgress}
                                size={86}
                                strokeWidth={7}
                                color="#fff"
                                backgroundColor="rgba(255,255,255,0.3)"
                            >
                                <Ionicons name="trophy" size={28} color="#fff" />
                            </CircularProgress>
                        </View>

                        <View style={styles.heroDivider} />

                        <View style={styles.heroProgressRow}>
                            <View>
                                <Text style={styles.heroProgressLabel}>Overall Progress</Text>
                                <Text style={styles.heroProgressValue}>{overallProgress}%</Text>
                            </View>
                            <View style={styles.heroChangePill}>
                                <Ionicons
                                    name={weeklyChange >= 0 ? 'trending-up' : 'trending-down'}
                                    size={14}
                                    color="#fff"
                                />
                                <Text style={styles.heroChangeText}>
                                    {weeklyChange >= 0 ? '+' : ''}{weeklyChange}% vs last week
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.contentInner}>
                {/* Quick Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBg, { backgroundColor: '#667eea20' }]}>
                            <Ionicons name="flag" size={20} color="#667eea" />
                        </View>
                        <Text style={styles.statValue}>{totalGoals}</Text>
                        <Text style={styles.statLabel}>Goals</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBg, { backgroundColor: '#10b98120' }]}>
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        </View>
                        <Text style={styles.statValue}>{completedTasks}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBg, { backgroundColor: '#f59e0b20' }]}>
                            <Ionicons name="flame" size={20} color="#f59e0b" />
                        </View>
                        <Text style={styles.statValue}>{streak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                </View>

                {/* Time Distribution Chart - Custom */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <View style={[styles.sectionTitleIcon, { backgroundColor: '#667eea20' }]}>
                            <Ionicons name="pie-chart" size={16} color="#667eea" />
                        </View>
                        <Text style={styles.sectionTitleText}>Weekly Time Distribution</Text>
                    </View>
                    <View style={styles.chartCard}>
                        {goalsWithTime.length > 0 ? (
                            <>
                                {/* Custom Time Bars */}
                                <View style={styles.timeDistributionContainer}>
                                    {goalsWithTime.map((goal, index) => {
                                        const percentage = totalWeeklyMinutes > 0
                                            ? Math.round((goal.weeklyMinutes / totalWeeklyMinutes) * 100)
                                            : 0;
                                        return (
                                            <View key={index} style={styles.timeBarRow}>
                                                <View style={styles.timeBarLabel}>
                                                    <View style={[styles.timeBarDot, { backgroundColor: goal.color }]} />
                                                    <Text style={styles.timeBarName} numberOfLines={1}>
                                                        {goal.name.length > 10 ? goal.name.substring(0, 10) + '...' : goal.name}
                                                    </Text>
                                                </View>
                                                <View style={styles.timeBarContainer}>
                                                    <LinearGradient
                                                        colors={goal.gradient}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={[styles.timeBarFill, { width: `${Math.max(percentage, 2)}%` }]}
                                                    />
                                                </View>
                                                <Text style={styles.timeBarValue}>{formatTime(goal.weeklyMinutes)}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                                <View style={styles.totalTimeRow}>
                                    <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                                    <Text style={styles.totalTimeText}>
                                        Total: {formatTime(totalWeeklyMinutes)} this week
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="time-outline" size={40} color={colors.text.tertiary} />
                                <Text style={styles.emptyStateText}>No time tracked yet</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Weekly Goals Progress - Custom Line-like Chart */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <View style={[styles.sectionTitleIcon, { backgroundColor: '#10b98120' }]}>
                            <Ionicons name="bar-chart" size={16} color="#10b981" />
                        </View>
                        <Text style={styles.sectionTitleText}>Weekly Goals Progress</Text>
                    </View>
                    <View style={styles.chartCard}>
                        {weeklyGoalsData.length > 0 ? (
                            <>
                                {/* Day labels */}
                                <View style={styles.weekDaysRow}>
                                    {WEEKLY_DAYS.map((day, index) => (
                                        <Text key={index} style={styles.weekDayLabel}>{day}</Text>
                                    ))}
                                </View>
                                {/* Progress dots for each goal */}
                                {weeklyGoalsData.map((goal, goalIndex) => (
                                    <View key={goalIndex} style={styles.goalWeekRow}>
                                        <View style={styles.goalWeekLabelContainer}>
                                            <View style={[styles.goalWeekDot, { backgroundColor: goal.color }]} />
                                            <Text style={styles.goalWeekName} numberOfLines={1}>{goal.goalName}</Text>
                                        </View>
                                        <View style={styles.goalWeekDotsContainer}>
                                            {goal.data.map((value, dayIndex) => (
                                                <View key={dayIndex} style={styles.goalWeekDotWrapper}>
                                                    <View
                                                        style={[
                                                            styles.goalWeekCircle,
                                                            {
                                                                backgroundColor: goal.color,
                                                                opacity: value === 0 ? 0.2 : 0.3 + (value / maxWeeklyValue) * 0.7,
                                                                transform: [{ scale: value === 0 ? 0.5 : 0.6 + (value / maxWeeklyValue) * 0.4 }],
                                                            }
                                                        ]}
                                                    />
                                                    {value > 0 && (
                                                        <Text style={[styles.goalWeekValue, { color: goal.color }]}>{value}</Text>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ))}
                                {/* Legend summary */}
                                <View style={styles.weeklyTotalRow}>
                                    <Ionicons name="checkmark-done" size={16} color={colors.text.secondary} />
                                    <Text style={styles.weeklyTotalText}>
                                        {thisWeekCompleted} tasks completed this week
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="analytics-outline" size={40} color={colors.text.tertiary} />
                                <Text style={styles.emptyStateText}>No goals yet. Create your first goal!</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Goal Progress Breakdown */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <View style={[styles.sectionTitleIcon, { backgroundColor: '#f59e0b20' }]}>
                            <Ionicons name="flag" size={16} color="#f59e0b" />
                        </View>
                        <Text style={styles.sectionTitleText}>Goal Progress</Text>
                    </View>
                    <View style={styles.goalProgressCard}>
                        {goalsWithTime.length > 0 ? (
                            goalsWithTime.map((goal, index) => {
                                const progress = goal.totalTasks > 0
                                    ? Math.round((goal.completedTasks / goal.totalTasks) * 100)
                                    : 0;
                                return (
                                    <View key={index} style={styles.goalProgressItem}>
                                        <View style={styles.goalProgressHeader}>
                                            <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                                                <Ionicons name={goal.icon as any} size={16} color={goal.color} />
                                            </View>
                                            <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
                                            <Text style={styles.goalProgressText}>{progress}%</Text>
                                        </View>
                                        <View style={styles.progressBarBg}>
                                            <LinearGradient
                                                colors={goal.gradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={[
                                                    styles.progressBarGradient,
                                                    { width: `${Math.max(progress, 1)}%` }
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.goalTaskCount}>
                                            {goal.completedTasks}/{goal.totalTasks} tasks completed
                                        </Text>
                                    </View>
                                );
                            })
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="flag-outline" size={40} color={colors.text.tertiary} />
                                <Text style={styles.emptyStateText}>No goals yet</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Weekly Summary (AI Generated) */}
                {aiInsights?.weeklySummary && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.sectionTitleIcon, { backgroundColor: '#8b5cf620' }]}>
                                <Ionicons name="stats-chart" size={16} color="#8b5cf6" />
                            </View>
                            <Text style={styles.sectionTitleText}>Your Week in Review</Text>
                        </View>
                        <View style={styles.weeklySummaryCard}>
                            <Text style={styles.weeklySummaryText}>{aiInsights.weeklySummary}</Text>

                            {/* Cache info and refresh button */}
                            <View style={styles.cacheInfoRow}>
                                <View style={styles.cacheInfoLeft}>
                                    <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
                                    <View style={styles.cacheInfoTextContainer}>
                                        <Text style={styles.cacheInfoText}>
                                            {lastCacheDate
                                                ? `Updated ${lastCacheDate.toLocaleDateString()}`
                                                : 'AI-generated weekly report'}
                                        </Text>
                                        {lastCacheDate && getDaysUntilRefresh() !== null && (
                                            <Text style={styles.cacheInfoRefreshText}>
                                                Refreshes in {getDaysUntilRefresh()} days
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.forceRefreshButton}
                                    onPress={forceRefreshAIInsights}
                                    disabled={isLoadingAI}
                                >
                                    <Ionicons
                                        name="refresh"
                                        size={14}
                                        color={isLoadingAI ? colors.text.tertiary : colors.primary.main}
                                    />
                                    <Text style={[
                                        styles.forceRefreshText,
                                        isLoadingAI && { color: colors.text.tertiary }
                                    ]}>
                                        Regenerate
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* AI Suggestions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.sectionTitleIcon, { backgroundColor: '#ec489920' }]}>
                                <Ionicons name="sparkles" size={16} color="#ec4899" />
                            </View>
                            <Text style={styles.sectionTitleText}>Insights & Suggestions</Text>
                        </View>
                        {isLoadingAI && (
                            <ActivityIndicator size="small" color={colors.primary.main} />
                        )}
                    </View>
                    {isLoadingAI && currentInsights === FALLBACK_INSIGHTS ? (
                        <View style={styles.aiLoadingCard}>
                            <ActivityIndicator size="small" color={colors.primary.main} />
                            <Text style={styles.aiLoadingText}>Generating personalized insights...</Text>
                        </View>
                    ) : (
                        currentInsights.map((insight, index) => {
                            const color = getInsightColor(insight.color);
                            return (
                                <View key={index} style={styles.suggestionCard}>
                                    <View style={[styles.suggestionIcon, { backgroundColor: color + '15' }]}>
                                        <Ionicons name={insight.icon as any} size={22} color={color} />
                                    </View>
                                    <View style={styles.suggestionContent}>
                                        <Text style={styles.suggestionTitle}>{insight.title}</Text>
                                        <Text style={styles.suggestionDesc}>{insight.description}</Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Tips Section */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <View style={[styles.sectionTitleIcon, { backgroundColor: '#eab30820' }]}>
                            <Ionicons name="bulb" size={16} color="#eab308" />
                        </View>
                        <Text style={styles.sectionTitleText}>Productivity Tips</Text>
                    </View>
                    <View style={styles.tipsCard}>
                        {currentTips.map((tipItem, index) => (
                            <View key={index} style={styles.tipItem}>
                                <View style={styles.tipBullet}>
                                    <Text style={styles.tipBulletText}>{index + 1}</Text>
                                </View>
                                <Text style={styles.tipText}>{tipItem.tip}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* AI Focus Recommendation (if available) */}
                {aiInsights?.focusRecommendation && (
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.sectionTitleIcon, { backgroundColor: '#667eea20' }]}>
                                <Ionicons name="flash" size={16} color="#667eea" />
                            </View>
                            <Text style={styles.sectionTitleText}>AI Recommendation</Text>
                        </View>
                        <View style={styles.aiFocusCard}>
                            <Text style={styles.aiFocusTitle}>{aiInsights.focusRecommendation.title}</Text>
                            <Text style={styles.aiFocusDescription}>{aiInsights.focusRecommendation.description}</Text>
                            {aiInsights.focusRecommendation.actionItems?.length > 0 && (
                                <View style={styles.actionItemsContainer}>
                                    <Text style={styles.actionItemsTitle}>Action Items:</Text>
                                    {aiInsights.focusRecommendation.actionItems.map((item, index) => (
                                        <View key={index} style={styles.actionItem}>
                                            <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary.main} />
                                            <Text style={styles.actionItemText}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Motivational Message (AI) */}
                {aiInsights?.motivationalMessage && (
                    <View style={styles.section}>
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.motivationalCard}
                        >
                            <Ionicons name="sparkles" size={24} color="#fff" />
                            <Text style={styles.motivationalText}>{aiInsights.motivationalMessage}</Text>
                        </LinearGradient>
                    </View>
                )}

                <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    loadingText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },

    // Premium Gate
    premiumGateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    premiumGateIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    premiumGateTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    premiumGateDescription: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
        maxWidth: 280,
    },
    premiumGateButton: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    premiumGateButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 14,
    },
    premiumGateButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.background.secondary,
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
    scrollContent: {
        paddingBottom: spacing.xl,
    },
    contentInner: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },

    // Gradient hero header
    heroSection: {
        width: '100%',
        overflow: 'hidden',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingHorizontal: spacing.lg,
    },
    heroContent: {
        zIndex: 2,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.md,
    },
    heroTopLeft: {
        flex: 1,
    },
    heroDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    heroProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    heroProgressLabel: {
        fontSize: typography.fontSize.xs,
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        fontWeight: '600' as any,
    },
    heroProgressValue: {
        fontSize: 36,
        fontWeight: '800' as any,
        color: '#fff',
        marginTop: 2,
        letterSpacing: -1,
    },
    heroChangePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    heroChangeText: {
        fontSize: typography.fontSize.xs,
        color: '#fff',
        fontWeight: '600' as any,
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
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    decorCircle1: {
        width: 140,
        height: 140,
        top: -40,
        right: -30,
    },
    decorCircle2: {
        width: 80,
        height: 80,
        bottom: -20,
        left: -20,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    decorCircle3: {
        width: 50,
        height: 50,
        top: 60,
        right: 80,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    decorCircle4: {
        width: 24,
        height: 24,
        bottom: 30,
        right: 50,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },

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
    bgBubble1: { width: 220, height: 220, top: 360, right: -110 },
    bgBubble2: { width: 160, height: 160, top: 620, left: -80 },
    bgBubble3: { width: 120, height: 120, top: 880, right: -50 },
    bgBubble4: { width: 70, height: 70, top: 280, left: 24, opacity: 0.5 },
    bgBubble5: { width: 40, height: 40, top: 540, right: 30, opacity: 0.7 },
    bgBubble6: { width: 90, height: 90, top: 780, left: 40, opacity: 0.4 },
    bgBubble7: { width: 55, height: 55, top: 1020, right: 80, opacity: 0.55 },

    bgIcon: {
        position: 'absolute',
        opacity: 0.18,
    },
    bgIcon1: { top: 300, right: 22, transform: [{ rotate: '-12deg' }] },
    bgIcon2: { top: 420, left: 18, transform: [{ rotate: '15deg' }] },
    bgIcon3: { top: 560, right: 18, transform: [{ rotate: '-8deg' }] },
    bgIcon4: { top: 690, left: 30, transform: [{ rotate: '20deg' }] },
    bgIcon5: { top: 820, right: 28, transform: [{ rotate: '-15deg' }] },
    bgIcon6: { top: 940, left: 24, transform: [{ rotate: '10deg' }] },
    bgIcon7: { top: 1060, right: 36, transform: [{ rotate: '-20deg' }] },
    bgIcon8: { top: 1170, left: 50, transform: [{ rotate: '8deg' }] },

    // Overview Card
    overviewCardShadow: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
        marginBottom: spacing.lg,
    },
    overviewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 20,
        padding: spacing.lg,
    },
    overviewLeft: {
        flex: 1,
    },
    overviewLabel: {
        fontSize: typography.fontSize.sm,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    overviewValue: {
        fontSize: 42,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
        marginBottom: 4,
    },
    overviewChange: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    overviewChangeText: {
        fontSize: typography.fontSize.xs,
        color: 'rgba(255,255,255,0.9)',
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.background.primary,
        borderRadius: 16,
        padding: spacing.md,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
    },
    statLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        marginTop: 2,
    },

    // Section
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    sectionTitleIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    sectionTitleText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
    },

    // Chart Card
    chartCard: {
        backgroundColor: colors.background.primary,
        borderRadius: 20,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },

    // Time Distribution Custom Chart
    timeDistributionContainer: {
        gap: spacing.md,
    },
    timeBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    timeBarLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 90,
        gap: 6,
    },
    timeBarDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    timeBarName: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
    },
    timeBarContainer: {
        flex: 1,
        height: 12,
        backgroundColor: colors.neutral[200],
        borderRadius: 6,
        overflow: 'hidden',
    },
    timeBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    timeBarValue: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold as any,
        color: colors.text.primary,
        width: 50,
        textAlign: 'right',
    },

    // Weekly Goals Progress Custom Chart
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: spacing.sm,
        paddingLeft: 100,
    },
    weekDayLabel: {
        flex: 1,
        fontSize: 10,
        color: colors.text.tertiary,
        textAlign: 'center',
    },
    goalWeekRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    goalWeekLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 100,
        gap: 6,
    },
    goalWeekDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    goalWeekName: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
    },
    goalWeekDotsContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    goalWeekDotWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 36,
    },
    goalWeekCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    goalWeekValue: {
        position: 'absolute',
        fontSize: 10,
        fontWeight: typography.fontWeight.bold as any,
    },
    weeklyTotalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.neutral[200],
    },
    weeklyTotalText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
    },

    // Time distribution extras
    totalTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.neutral[200],
    },
    totalTimeText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
    },

    // Legend (keep for potential future use)
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: spacing.md,
        gap: spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
    },
    legendValue: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
    },

    // Goal Progress
    goalProgressCard: {
        backgroundColor: colors.background.primary,
        borderRadius: 20,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        gap: spacing.md,
    },
    goalProgressItem: {
        gap: spacing.xs,
    },
    goalProgressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    goalIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalName: {
        flex: 1,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold as any,
        color: colors.text.primary,
    },
    goalProgressText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: colors.neutral[200],
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },

    // Suggestions
    suggestionCard: {
        flexDirection: 'row',
        backgroundColor: colors.background.primary,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        gap: spacing.md,
    },
    suggestionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        marginBottom: 4,
    },
    suggestionDesc: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        lineHeight: 18,
    },

    // Tips
    tipsCard: {
        backgroundColor: colors.background.primary,
        borderRadius: 20,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        gap: spacing.sm,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    tipBullet: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primary.main + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tipBulletText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.primary.main,
    },
    tipText: {
        flex: 1,
        fontSize: typography.fontSize.sm,
        color: colors.text.primary,
    },

    // Focus Card
    focusCard: {
        backgroundColor: colors.background.primary,
        borderRadius: 20,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    focusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: spacing.sm,
    },
    focusBadgeText: {
        fontSize: 10,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
        letterSpacing: 1,
    },
    focusTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    focusDesc: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    focusReason: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold as any,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    focusProgressContainer: {
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    focusProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    focusProgressLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        width: 55,
    },
    focusProgressBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: colors.neutral[200],
        borderRadius: 4,
        overflow: 'hidden',
    },
    focusProgressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    focusExpectedBarFill: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: colors.neutral[400],
    },
    focusProgressValue: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold as any,
        color: colors.text.primary,
        width: 35,
        textAlign: 'right',
    },
    focusActions: {
        flexDirection: 'row',
        gap: spacing.lg,
    },
    focusAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    focusActionText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
    },

    // Gradient progress bar
    progressBarGradient: {
        height: '100%',
        borderRadius: 4,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
        gap: spacing.sm,
    },
    emptyStateText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.tertiary,
        textAlign: 'center',
    },

    // Goal task count
    goalTaskCount: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
        marginTop: 2,
    },

    // Section header row with loading indicator
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },

    // AI Loading Card
    aiLoadingCard: {
        backgroundColor: colors.background.primary,
        borderRadius: 16,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    aiLoadingText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        flex: 1,
    },

    // Weekly Summary Card
    weeklySummaryCard: {
        backgroundColor: colors.background.primary,
        borderRadius: 16,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary.main,
    },
    weeklySummaryText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.primary,
        lineHeight: 22,
    },
    cacheInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    cacheInfoLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.xs,
        flex: 1,
    },
    cacheInfoTextContainer: {
        flexDirection: 'column',
        gap: 2,
    },
    cacheInfoText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
    },
    cacheInfoRefreshText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
        fontStyle: 'italic',
    },
    forceRefreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.primary.main + '10',
        borderRadius: 12,
    },
    forceRefreshText: {
        fontSize: typography.fontSize.xs,
        color: colors.primary.main,
        fontWeight: typography.fontWeight.medium as any,
    },

    // AI Focus Card
    aiFocusCard: {
        backgroundColor: colors.background.primary,
        borderRadius: 16,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    aiFocusTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    aiFocusDescription: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    actionItemsContainer: {
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    actionItemsTitle: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold as any,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    actionItemText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.primary,
        flex: 1,
        lineHeight: 20,
    },

    // Motivational Card
    motivationalCard: {
        borderRadius: 16,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    motivationalText: {
        fontSize: typography.fontSize.sm,
        color: '#fff',
        flex: 1,
        lineHeight: 22,
        fontStyle: 'italic',
    },

    // AI Report Generation Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    modalGradient: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalIconInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: typography.fontSize.sm,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    modalLoadingDots: {
        marginBottom: spacing.lg,
    },
    modalDotRow: {
        flexDirection: 'row',
        gap: 8,
    },
    modalDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    modalDot1: {
        opacity: 1,
        backgroundColor: '#fff',
    },
    modalDot2: {
        opacity: 0.6,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    modalDot3: {
        opacity: 0.3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    modalSteps: {
        width: '100%',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    modalStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    modalStepText: {
        fontSize: typography.fontSize.sm,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    modalFooter: {
        fontSize: typography.fontSize.xs,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
    },
});

export default AnalyticsScreen;
