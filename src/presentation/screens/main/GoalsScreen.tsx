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
    TextInput,
    KeyboardAvoidingView,
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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { Goal, GoalCategory, GoalPriority, GoalStatus } from '@/domain/entities/Goal';
import { getGoalsLocally, getTasksLocally, saveGoalLocally, deleteGoalLocally, USE_LOCAL_DATA } from '@/data';
import { Task } from '@/domain/entities/Task';
import { useAuthStore } from '@/infrastructure/stores/authStore';

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

// Goal categories with labels
const GOAL_CATEGORIES: { value: GoalCategory; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
    { value: 'CAREER', label: 'Career', icon: 'briefcase', description: 'Job, business, professional growth' },
    { value: 'FINANCIAL', label: 'Financial', icon: 'wallet', description: 'Savings, investments, income' },
    { value: 'HEALTH', label: 'Health & Fitness', icon: 'fitness', description: 'Fitness, wellness, habits' },
    { value: 'EDUCATION', label: 'Education', icon: 'book', description: 'Learning, skills, certifications' },
    { value: 'PERSONAL', label: 'Personal Growth', icon: 'leaf', description: 'Self-improvement, hobbies' },
    { value: 'RELATIONSHIP', label: 'Relationships', icon: 'heart', description: 'Family, friends, social' },
    { value: 'OTHER', label: 'Other', icon: 'flag', description: 'Anything else' },
];

const TIME_OPTIONS = [
    { value: '1', label: '< 1 hour' },
    { value: '2', label: '1-2 hours' },
    { value: '3', label: '2-3 hours' },
    { value: '4', label: '3-4 hours' },
    { value: '5', label: '4+ hours' },
];

const EXPERIENCE_LEVELS = [
    { value: 'beginner', icon: 'leaf-outline' as keyof typeof Ionicons.glyphMap, label: 'Beginner', description: 'Just starting out' },
    { value: 'intermediate', icon: 'trending-up-outline' as keyof typeof Ionicons.glyphMap, label: 'Some Experience', description: 'Tried before but not consistent' },
    { value: 'advanced', icon: 'rocket-outline' as keyof typeof Ionicons.glyphMap, label: 'Experienced', description: 'Done this before, want to level up' },
];

const COMMON_CHALLENGES = [
    'Staying motivated',
    'Finding time',
    'Lack of knowledge',
    'Procrastination',
    'No accountability',
    'Overwhelmed',
    'Fear of failure',
    'Financial constraints',
];

export const GoalsScreen: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Add Goal Multi-Step Wizard State
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const TOTAL_STEPS = 4;

    // Step 1: Goal Details
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalDescription, setNewGoalDescription] = useState('');
    const [newGoalCategory, setNewGoalCategory] = useState<GoalCategory | ''>('');

    // Step 2: Timeline
    const [newGoalPriority, setNewGoalPriority] = useState<GoalPriority>('MEDIUM');
    const [newGoalStartDate, setNewGoalStartDate] = useState(new Date());
    const [newGoalTargetDate, setNewGoalTargetDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 3);
        return date;
    });
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showTargetDatePicker, setShowTargetDatePicker] = useState(false);

    // Step 3: Time & Resources
    const [dailyHours, setDailyHours] = useState('');
    const [monthlyBudget, setMonthlyBudget] = useState('');

    // Step 4: Experience & Challenges
    const [experienceLevel, setExperienceLevel] = useState('');
    const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stepErrors, setStepErrors] = useState<{ [key: string]: string }>({});

    // Reset form
    const resetForm = () => {
        setCurrentStep(1);
        setNewGoalTitle('');
        setNewGoalDescription('');
        setNewGoalCategory('');
        setNewGoalPriority('MEDIUM');
        setNewGoalStartDate(new Date());
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + 3);
        setNewGoalTargetDate(targetDate);
        setDailyHours('');
        setMonthlyBudget('');
        setExperienceLevel('');
        setSelectedChallenges([]);
        setStepErrors({});
    };

    // Toggle challenge selection
    const toggleChallenge = (challenge: string) => {
        setSelectedChallenges((prev) =>
            prev.includes(challenge)
                ? prev.filter((c) => c !== challenge)
                : [...prev, challenge]
        );
    };

    // Validate current step
    const validateStep = (): boolean => {
        const errors: { [key: string]: string } = {};

        if (currentStep === 1) {
            if (!newGoalCategory) {
                errors.category = 'Please select a category';
            }
            if (!newGoalTitle.trim()) {
                errors.title = 'Please enter your goal';
            }
        } else if (currentStep === 3) {
            if (!dailyHours) {
                errors.dailyHours = 'Please select available time';
            }
        } else if (currentStep === 4) {
            if (!experienceLevel) {
                errors.experience = 'Please select your experience level';
            }
        }

        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle next step
    const handleNextStep = () => {
        if (validateStep()) {
            if (currentStep < TOTAL_STEPS) {
                setCurrentStep(currentStep + 1);
            } else {
                handleAddGoal();
            }
        }
    };

    // Handle previous step
    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setStepErrors({});
        }
    };

    // Handle adding a new goal
    const handleAddGoal = async () => {
        if (!validateStep()) return;

        setIsSubmitting(true);

        try {
            const newGoal: Goal = {
                id: `goal_${Date.now()}`,
                userId: user?.id || 'local_user',
                title: newGoalTitle.trim(),
                description: newGoalDescription.trim(),
                category: newGoalCategory as GoalCategory,
                priority: newGoalPriority,
                status: 'ACTIVE' as GoalStatus,
                startDate: newGoalStartDate,
                targetDate: newGoalTargetDate,
                milestones: [],
                tags: [
                    experienceLevel,
                    ...selectedChallenges.slice(0, 3),
                ].filter(Boolean),
                metrics: {
                    totalTasks: 0,
                    completedTasks: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    completionPercentage: 0,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await saveGoalLocally(newGoal);
            await loadData();
            setShowAddGoal(false);
            resetForm();
            console.log('[GoalsScreen] New goal added:', newGoal.title);
        } catch (error) {
            console.error('[GoalsScreen] Error adding goal:', error);
            Alert.alert('Error', 'Failed to add goal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateGoal = () => {
        resetForm();
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
                    <TouchableOpacity activeOpacity={0.9}>
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
                        <Text style={styles.sectionTitle}>Your Goals</Text>
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

            {/* Add Goal Bottom Sheet Modal - Multi-Step Wizard */}
            <Modal
                visible={showAddGoal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddGoal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.bottomSheetOverlay}
                >
                    <TouchableOpacity
                        style={styles.bottomSheetBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowAddGoal(false)}
                    />
                    <View style={styles.bottomSheet}>
                        {/* Handle */}
                        <View style={styles.bottomSheetHandle} />

                        {/* Header with Progress */}
                        <View style={styles.bottomSheetHeader}>
                            <View style={styles.wizardHeaderLeft}>
                                {currentStep > 1 && (
                                    <TouchableOpacity onPress={handlePrevStep} style={styles.backButton}>
                                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                                    </TouchableOpacity>
                                )}
                                <Text style={styles.bottomSheetTitle}>
                                    {currentStep === 1 && "What's your goal?"}
                                    {currentStep === 2 && "Set your timeline"}
                                    {currentStep === 3 && "Time & resources"}
                                    {currentStep === 4 && "Your experience"}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowAddGoal(false)}>
                                <Ionicons name="close" size={24} color={colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.wizardProgressContainer}>
                            <View style={styles.wizardProgressBar}>
                                <View style={[styles.wizardProgressFill, { width: `${(currentStep / TOTAL_STEPS) * 100}%` }]} />
                            </View>
                            <Text style={styles.wizardProgressText}>Step {currentStep} of {TOTAL_STEPS}</Text>
                        </View>

                        <ScrollView
                            style={styles.bottomSheetContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Step 1: Goal Details */}
                            {currentStep === 1 && (
                                <>
                                    <Text style={styles.stepSubtitle}>Choose a category and describe what you want to achieve</Text>

                                    {/* Category Grid */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Category *</Text>
                                        <View style={styles.categoryGrid}>
                                            {GOAL_CATEGORIES.map((cat) => (
                                                <TouchableOpacity
                                                    key={cat.value}
                                                    style={[
                                                        styles.categoryCard,
                                                        newGoalCategory === cat.value && styles.categoryCardSelected,
                                                    ]}
                                                    onPress={() => {
                                                        setNewGoalCategory(cat.value);
                                                        setStepErrors({ ...stepErrors, category: '' });
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={cat.icon}
                                                        size={24}
                                                        color={newGoalCategory === cat.value ? colors.primary.main : colors.text.secondary}
                                                    />
                                                    <Text style={[
                                                        styles.categoryCardLabel,
                                                        newGoalCategory === cat.value && styles.categoryCardLabelSelected,
                                                    ]}>
                                                        {cat.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        {stepErrors.category && (
                                            <Text style={styles.errorText}>{stepErrors.category}</Text>
                                        )}
                                    </View>

                                    {/* Goal Title */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Your Goal *</Text>
                                        <TextInput
                                            style={styles.formInput}
                                            value={newGoalTitle}
                                            onChangeText={(text) => {
                                                setNewGoalTitle(text);
                                                setStepErrors({ ...stepErrors, title: '' });
                                            }}
                                            placeholder="e.g., Save $10,000 for emergency fund"
                                            placeholderTextColor={colors.text.tertiary}
                                        />
                                        {stepErrors.title && (
                                            <Text style={styles.errorText}>{stepErrors.title}</Text>
                                        )}
                                    </View>

                                    {/* Description */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Description (optional)</Text>
                                        <TextInput
                                            style={[styles.formInput, styles.formTextArea]}
                                            value={newGoalDescription}
                                            onChangeText={setNewGoalDescription}
                                            placeholder="Add more details about what success looks like..."
                                            placeholderTextColor={colors.text.tertiary}
                                            multiline
                                            numberOfLines={3}
                                        />
                                    </View>
                                </>
                            )}

                            {/* Step 2: Timeline */}
                            {currentStep === 2 && (
                                <>
                                    <Text style={styles.stepSubtitle}>Set realistic deadlines for your goal</Text>

                                    {/* Start Date */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Start Date</Text>
                                        <TouchableOpacity
                                            style={styles.formSelect}
                                            onPress={() => setShowStartDatePicker(true)}
                                        >
                                            <View style={styles.formSelectContent}>
                                                <Ionicons name="calendar-outline" size={18} color={colors.primary.main} />
                                                <Text style={styles.formSelectText}>
                                                    {newGoalStartDate.toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Start Date Picker */}
                                    {Platform.OS === 'ios' ? (
                                        <Modal visible={showStartDatePicker} transparent animationType="slide">
                                            <View style={styles.pickerModal}>
                                                <View style={styles.pickerModalContent}>
                                                    <View style={styles.pickerModalHeader}>
                                                        <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                                                            <Text style={styles.pickerModalCancel}>Cancel</Text>
                                                        </TouchableOpacity>
                                                        <Text style={styles.pickerModalTitle}>Start Date</Text>
                                                        <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                                                            <Text style={styles.pickerModalDone}>Done</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    <DateTimePicker
                                                        value={newGoalStartDate}
                                                        mode="date"
                                                        display="spinner"
                                                        onChange={(event: DateTimePickerEvent, date?: Date) => {
                                                            if (date) setNewGoalStartDate(date);
                                                        }}
                                                        style={{ height: 200, backgroundColor: colors.background.primary }}
                                                        themeVariant="light"
                                                    />
                                                </View>
                                            </View>
                                        </Modal>
                                    ) : (
                                        showStartDatePicker && (
                                            <DateTimePicker
                                                value={newGoalStartDate}
                                                mode="date"
                                                display="default"
                                                onChange={(event: DateTimePickerEvent, date?: Date) => {
                                                    setShowStartDatePicker(false);
                                                    if (date) setNewGoalStartDate(date);
                                                }}
                                            />
                                        )
                                    )}

                                    {/* Target Date */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Target Date *</Text>
                                        <TouchableOpacity
                                            style={styles.formSelect}
                                            onPress={() => setShowTargetDatePicker(true)}
                                        >
                                            <View style={styles.formSelectContent}>
                                                <Ionicons name="flag-outline" size={18} color={colors.primary.main} />
                                                <Text style={styles.formSelectText}>
                                                    {newGoalTargetDate.toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Target Date Picker */}
                                    {Platform.OS === 'ios' ? (
                                        <Modal visible={showTargetDatePicker} transparent animationType="slide">
                                            <View style={styles.pickerModal}>
                                                <View style={styles.pickerModalContent}>
                                                    <View style={styles.pickerModalHeader}>
                                                        <TouchableOpacity onPress={() => setShowTargetDatePicker(false)}>
                                                            <Text style={styles.pickerModalCancel}>Cancel</Text>
                                                        </TouchableOpacity>
                                                        <Text style={styles.pickerModalTitle}>Target Date</Text>
                                                        <TouchableOpacity onPress={() => setShowTargetDatePicker(false)}>
                                                            <Text style={styles.pickerModalDone}>Done</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    <DateTimePicker
                                                        value={newGoalTargetDate}
                                                        mode="date"
                                                        display="spinner"
                                                        minimumDate={newGoalStartDate}
                                                        onChange={(event: DateTimePickerEvent, date?: Date) => {
                                                            if (date) setNewGoalTargetDate(date);
                                                        }}
                                                        style={{ height: 200, backgroundColor: colors.background.primary }}
                                                        themeVariant="light"
                                                    />
                                                </View>
                                            </View>
                                        </Modal>
                                    ) : (
                                        showTargetDatePicker && (
                                            <DateTimePicker
                                                value={newGoalTargetDate}
                                                mode="date"
                                                display="default"
                                                minimumDate={newGoalStartDate}
                                                onChange={(event: DateTimePickerEvent, date?: Date) => {
                                                    setShowTargetDatePicker(false);
                                                    if (date) setNewGoalTargetDate(date);
                                                }}
                                            />
                                        )
                                    )}

                                    {/* Priority */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Priority</Text>
                                        <View style={styles.segmentedControl}>
                                            {(['LOW', 'MEDIUM', 'HIGH'] as GoalPriority[]).map((priority) => (
                                                <TouchableOpacity
                                                    key={priority}
                                                    style={[
                                                        styles.segmentedOption,
                                                        newGoalPriority === priority && styles.segmentedOptionActive,
                                                        newGoalPriority === priority && {
                                                            backgroundColor: getPriorityColor(priority) + '20',
                                                            borderColor: getPriorityColor(priority),
                                                        }
                                                    ]}
                                                    onPress={() => setNewGoalPriority(priority)}
                                                >
                                                    <Text style={[
                                                        styles.segmentedOptionText,
                                                        newGoalPriority === priority && { color: getPriorityColor(priority) }
                                                    ]}>
                                                        {priority}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            )}

                            {/* Step 3: Time & Resources */}
                            {currentStep === 3 && (
                                <>
                                    <Text style={styles.stepSubtitle}>Help us create realistic plans that fit your life</Text>

                                    {/* Daily Time */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Daily time for this goal *</Text>
                                        <Text style={styles.formHint}>How much time can you dedicate each day?</Text>
                                        <View style={styles.timeOptionsGrid}>
                                            {TIME_OPTIONS.map((option) => (
                                                <TouchableOpacity
                                                    key={option.value}
                                                    style={[
                                                        styles.timeOptionCard,
                                                        dailyHours === option.value && styles.timeOptionCardSelected,
                                                    ]}
                                                    onPress={() => {
                                                        setDailyHours(option.value);
                                                        setStepErrors({ ...stepErrors, dailyHours: '' });
                                                    }}
                                                >
                                                    <Text style={[
                                                        styles.timeOptionLabel,
                                                        dailyHours === option.value && styles.timeOptionLabelSelected,
                                                    ]}>
                                                        {option.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        {stepErrors.dailyHours && (
                                            <Text style={styles.errorText}>{stepErrors.dailyHours}</Text>
                                        )}
                                    </View>

                                    {/* Monthly Budget */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Monthly budget (optional)</Text>
                                        <TextInput
                                            style={styles.formInput}
                                            value={monthlyBudget}
                                            onChangeText={(text) => setMonthlyBudget(text.replace(/[^0-9]/g, ''))}
                                            placeholder="$ Amount you can invest monthly"
                                            placeholderTextColor={colors.text.tertiary}
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                </>
                            )}

                            {/* Step 4: Experience & Challenges */}
                            {currentStep === 4 && (
                                <>
                                    <Text style={styles.stepSubtitle}>Help us understand where you're starting from</Text>

                                    {/* Experience Level */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Your experience with this goal *</Text>
                                        <View style={styles.experienceGrid}>
                                            {EXPERIENCE_LEVELS.map((level) => (
                                                <TouchableOpacity
                                                    key={level.value}
                                                    style={[
                                                        styles.experienceCard,
                                                        experienceLevel === level.value && styles.experienceCardSelected,
                                                    ]}
                                                    onPress={() => {
                                                        setExperienceLevel(level.value);
                                                        setStepErrors({ ...stepErrors, experience: '' });
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={level.icon}
                                                        size={28}
                                                        color={experienceLevel === level.value ? colors.primary.main : colors.text.secondary}
                                                    />
                                                    <Text style={[
                                                        styles.experienceLabel,
                                                        experienceLevel === level.value && styles.experienceLabelSelected,
                                                    ]}>
                                                        {level.label}
                                                    </Text>
                                                    <Text style={styles.experienceDesc}>{level.description}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        {stepErrors.experience && (
                                            <Text style={styles.errorText}>{stepErrors.experience}</Text>
                                        )}
                                    </View>

                                    {/* Challenges */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Common challenges (optional)</Text>
                                        <Text style={styles.formHint}>Select any that apply to you</Text>
                                        <View style={styles.challengesGrid}>
                                            {COMMON_CHALLENGES.map((challenge) => (
                                                <TouchableOpacity
                                                    key={challenge}
                                                    style={[
                                                        styles.challengeChip,
                                                        selectedChallenges.includes(challenge) && styles.challengeChipSelected,
                                                    ]}
                                                    onPress={() => toggleChallenge(challenge)}
                                                >
                                                    <Text style={[
                                                        styles.challengeChipText,
                                                        selectedChallenges.includes(challenge) && styles.challengeChipTextSelected,
                                                    ]}>
                                                        {challenge}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            )}

                            {/* Navigation Buttons */}
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    isSubmitting && styles.submitButtonDisabled
                                ]}
                                onPress={handleNextStep}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isSubmitting ? 'Creating...' : currentStep === TOTAL_STEPS ? 'Create Goal' : 'Continue'}
                                </Text>
                                {!isSubmitting && currentStep < TOTAL_STEPS && (
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                )}
                                {currentStep === TOTAL_STEPS && !isSubmitting && (
                                    <Ionicons name="flag" size={20} color="#fff" />
                                )}
                            </TouchableOpacity>

                            {/* Bottom padding */}
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
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

    // Bottom Sheet
    bottomSheetOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    bottomSheetBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    bottomSheet: {
        backgroundColor: colors.background.primary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.9,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    },
    bottomSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.neutral[300],
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
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
    bottomSheetContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },

    // Form Styles
    formGroup: {
        marginBottom: spacing.lg,
    },
    formLabel: {
        ...typography.variants.label,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    formInput: {
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        ...typography.variants.body,
        color: colors.text.primary,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    formTextArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    formSelect: {
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border.light,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    formSelectContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    formSelectText: {
        ...typography.variants.body,
        color: colors.text.primary,
        flex: 1,
    },

    // Category Picker Dropdown
    categoryPickerDropdown: {
        backgroundColor: colors.background.primary,
        borderRadius: spacing.borderRadius.md,
        marginTop: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border.light,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryPickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    categoryPickerOptionActive: {
        backgroundColor: colors.primary.main + '10',
    },
    categoryPickerOptionText: {
        ...typography.variants.body,
        color: colors.text.primary,
        flex: 1,
    },
    categoryPickerOptionTextActive: {
        color: colors.primary.main,
        fontWeight: '600',
    },

    // Segmented Control
    segmentedControl: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    segmentedOption: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: spacing.borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.light,
        backgroundColor: colors.background.secondary,
    },
    segmentedOptionActive: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    segmentedOptionText: {
        ...typography.variants.label,
        color: colors.text.secondary,
    },

    // Submit Button
    submitButton: {
        backgroundColor: colors.primary.main,
        borderRadius: spacing.borderRadius.lg,
        paddingVertical: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    submitButtonDisabled: {
        backgroundColor: colors.neutral[300],
    },
    submitButtonText: {
        ...typography.variants.label,
        color: colors.text.inverse,
        fontWeight: '600',
    },

    // Picker Modal Styles
    pickerModal: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerModalContent: {
        backgroundColor: colors.background.primary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
    },
    pickerModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    pickerModalTitle: {
        ...typography.variants.h5,
        color: colors.text.primary,
    },
    pickerModalCancel: {
        ...typography.variants.body,
        color: colors.text.secondary,
    },
    pickerModalDone: {
        ...typography.variants.body,
        color: colors.primary.main,
        fontWeight: '600',
    },

    // Wizard Styles
    wizardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: spacing.sm,
        padding: 4,
    },
    wizardProgressContainer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xs,
        paddingBottom: spacing.md,
    },
    wizardProgressBar: {
        height: 4,
        backgroundColor: colors.neutral[200],
        borderRadius: 2,
        marginBottom: spacing.xs,
    },
    wizardProgressFill: {
        height: '100%',
        backgroundColor: colors.primary.main,
        borderRadius: 2,
    },
    wizardProgressText: {
        ...typography.variants.caption,
        color: colors.text.tertiary,
        textAlign: 'right',
    },
    stepSubtitle: {
        ...typography.variants.body,
        color: colors.text.secondary,
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    formHint: {
        ...typography.variants.caption,
        color: colors.text.tertiary,
        marginBottom: spacing.sm,
    },
    errorText: {
        ...typography.variants.caption,
        color: colors.error.main,
        marginTop: spacing.xs,
    },

    // Category Grid (Step 1)
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    categoryCard: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.light,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.sm,
    },
    categoryCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    categoryCardLabel: {
        ...typography.variants.caption,
        color: colors.text.secondary,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    categoryCardLabelSelected: {
        color: colors.primary.main,
        fontWeight: '600',
    },

    // Time Options (Step 3)
    timeOptionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    timeOptionCard: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    timeOptionCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    timeOptionLabel: {
        ...typography.variants.label,
        color: colors.text.secondary,
    },
    timeOptionLabelSelected: {
        color: colors.primary.main,
        fontWeight: '600',
    },

    // Experience Grid (Step 4)
    experienceGrid: {
        gap: spacing.sm,
    },
    experienceCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.light,
        padding: spacing.md,
        alignItems: 'center',
    },
    experienceCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    experienceLabel: {
        ...typography.variants.label,
        color: colors.text.primary,
        marginTop: spacing.xs,
    },
    experienceLabelSelected: {
        color: colors.primary.main,
        fontWeight: '600',
    },
    experienceDesc: {
        ...typography.variants.caption,
        color: colors.text.tertiary,
        marginTop: 2,
    },

    // Challenges Grid (Step 4)
    challengesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    challengeChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    challengeChipSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    challengeChipText: {
        ...typography.variants.caption,
        color: colors.text.secondary,
    },
    challengeChipTextSelected: {
        color: colors.primary.main,
        fontWeight: '600',
    },
});

export default GoalsScreen;
