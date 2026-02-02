// src/presentation/screens/main/TasksScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Alert,
    Animated,
    FlatList,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

import { Card } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { Task, TaskPriority, TaskDifficulty, TaskStatus } from '@/domain/entities/Task';
import { Goal, GoalCategory } from '@/domain/entities/Goal';
import { getTasksLocally, getGoalsLocally, updateTaskStatusLocally, addTaskLocally, deleteTaskLocally, USE_LOCAL_DATA } from '@/data';
import { useAuthStore } from '@/infrastructure/stores/authStore';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_ITEM_WIDTH = (SCREEN_WIDTH - spacing.screenPadding * 2 - spacing.xs * 2) / 7;

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

// Category icon mapping
const getCategoryIcon = (category: GoalCategory): keyof typeof Ionicons.glyphMap => {
    const icons: Record<GoalCategory, keyof typeof Ionicons.glyphMap> = {
        CAREER: 'briefcase',
        FINANCIAL: 'wallet',
        HEALTH: 'fitness',
        EDUCATION: 'book',
        PERSONAL: 'leaf',
        RELATIONSHIP: 'heart',
        OTHER: 'flag',
    };
    return icons[category] || 'flag';
};

// Format minutes to h/m format
const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const TasksScreen: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    const dateScrollRef = useRef<FlatList>(null);

    // Generate dates: 7 days before today to 14 days after (3 weeks total, starting from today - 2 for initial view)
    const generateDates = useCallback(() => {
        const dates = [];
        const today = new Date();
        for (let i = -7; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push({
                fullDate: date,
                date: date.getDate(),
                day: DAY_NAMES[date.getDay()],
                isToday: i === 0,
                index: i + 7, // offset for array index
            });
        }
        return dates;
    }, []);

    const allDates = generateDates();
    // Start with today - 2 days selected (index 5 in our array since we start from -7)
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [showGoalFilter, setShowGoalFilter] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Add Task Form State
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskGoalId, setNewTaskGoalId] = useState<string>('');
    const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
    const [newTaskDifficulty, setNewTaskDifficulty] = useState<TaskDifficulty>('MEDIUM');
    const [newTaskDate, setNewTaskDate] = useState(new Date());
    const [newTaskHours, setNewTaskHours] = useState(0);
    const [newTaskMinutes, setNewTaskMinutes] = useState(30);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGoalPicker, setShowGoalPicker] = useState(false);
    const [showDurationPicker, setShowDurationPicker] = useState(false);

    // Load tasks and goals from local storage
    const loadData = async () => {
        if (USE_LOCAL_DATA) {
            try {
                const localTasks = await getTasksLocally();
                const localGoals = await getGoalsLocally();
                setTasks(localTasks);
                setGoals(localGoals);
                console.log('[TasksScreen] Loaded tasks:', localTasks.length, 'goals:', localGoals.length);
            } catch (error) {
                console.error('[TasksScreen] Error loading data:', error);
            }
        }
        // TODO: Add Firebase loading here when switching to production
    };

    // Refresh data when screen comes into focus
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

    // Toggle task completion
    const toggleTaskStatus = async (task: Task) => {
        const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

        if (USE_LOCAL_DATA) {
            await updateTaskStatusLocally(task.id, newStatus);
            await loadData();
        }
        // TODO: Add Firebase update here when switching to production
    };

    // Delete task
    const handleDeleteTask = (taskId: string, taskTitle: string) => {
        Alert.alert(
            'Delete Task',
            `Are you sure you want to delete "${taskTitle}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTaskLocally(taskId);
                            await loadData();
                            console.log('[TasksScreen] Task deleted:', taskId);
                        } catch (error) {
                            console.error('[TasksScreen] Error deleting task:', error);
                            Alert.alert('Error', 'Failed to delete task. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    // Scroll to initial position (today - 2 days) on mount
    useEffect(() => {
        // Index 5 is today-2 in our array (since we start from -7, today is at index 7, so today-2 is at index 5)
        setTimeout(() => {
            dateScrollRef.current?.scrollToIndex({ index: 5, animated: false });
        }, 100);
    }, []);

    // Filter tasks for selected day and goal
    const tasksForDay = tasks.filter(task => {
        if (!task.scheduledDate) return false;
        const taskDate = new Date(task.scheduledDate);
        const matchesDate = taskDate.toDateString() === selectedDate?.toDateString();
        const matchesGoal = !selectedGoalId || task.goalId === selectedGoalId;
        return matchesDate && matchesGoal;
    });

    const pendingTasks = tasksForDay.filter(t => t.status !== 'COMPLETED');
    const completedTasks = tasksForDay.filter(t => t.status === 'COMPLETED');
    const totalMinutes = tasksForDay.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

    // Calculate progress percentages
    const totalTasks = tasksForDay.length;
    const pendingProgress = totalTasks > 0 ? (pendingTasks.length / totalTasks) * 100 : 0;
    const completedProgress = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    // For time, show percentage of completed time vs total
    const completedMinutes = completedTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
    const timeProgress = totalMinutes > 0 ? (completedMinutes / totalMinutes) * 100 : 0;

    // Get selected goal for filter display
    const selectedGoal = goals.find(g => g.id === selectedGoalId);

    // Get selected goal for new task form
    const selectedNewTaskGoal = goals.find(g => g.id === newTaskGoalId);

    // Reset form
    const resetForm = () => {
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskGoalId(goals.length > 0 ? goals[0].id : '');
        setNewTaskPriority('MEDIUM');
        setNewTaskDifficulty('MEDIUM');
        setNewTaskDate(new Date());
        setNewTaskHours(0);
        setNewTaskMinutes(30);
    };

    // Handle add task
    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || !newTaskGoalId) {
            console.log('[TasksScreen] Cannot add task - missing title or goal:', { title: newTaskTitle, goalId: newTaskGoalId });
            return;
        }

        const newTask: Task = {
            id: `task-manual-${Date.now()}`,
            goalId: newTaskGoalId,
            userId: user?.id || 'local-user',
            title: newTaskTitle.trim(),
            description: newTaskDescription.trim(),
            priority: newTaskPriority,
            difficulty: newTaskDifficulty,
            status: 'PENDING' as TaskStatus,
            scheduledDate: newTaskDate,
            estimatedMinutes: (newTaskHours * 60) + newTaskMinutes,
            isAiGenerated: false,
            isRecurring: false,
            order: tasks.length + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        console.log('[TasksScreen] Adding new task:', newTask);

        if (USE_LOCAL_DATA) {
            await addTaskLocally(newTask);
            await loadData();
            console.log('[TasksScreen] Task added and data reloaded');
        }

        setShowAddTask(false);
        resetForm();
    };

    // Get priority color
    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'HIGH': return colors.error.main;
            case 'MEDIUM': return colors.warning.main;
            case 'LOW': return colors.success.main;
            default: return colors.text.secondary;
        }
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
                {/* Header with Goal Filter */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.title}>Tasks</Text>
                        <Text style={styles.subtitle}>
                            {selectedDate?.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowGoalFilter(true)}
                    >
                        <Ionicons
                            name={selectedGoalId ? getCategoryIcon(selectedGoal?.category || 'OTHER') : 'filter-outline'}
                            size={20}
                            color={selectedGoalId ? colors.primary.main : colors.text.secondary}
                        />
                        <Text style={[styles.filterText, selectedGoalId && { color: colors.primary.main }]}>
                            {selectedGoalId ? (selectedGoal?.title?.substring(0, 12) + (selectedGoal?.title && selectedGoal.title.length > 12 ? '...' : '')) : 'All Goals'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
                    </TouchableOpacity>
                </View>

                {/* Goal Filter Modal */}
                <Modal
                    visible={showGoalFilter}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowGoalFilter(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowGoalFilter(false)}
                    >
                        <View style={styles.filterModal}>
                            <Text style={styles.filterModalTitle}>Filter by Goal</Text>
                            <TouchableOpacity
                                style={[styles.filterOption, !selectedGoalId && styles.filterOptionActive]}
                                onPress={() => {
                                    setSelectedGoalId(null);
                                    setShowGoalFilter(false);
                                }}
                            >
                                <Ionicons name="apps-outline" size={20} color={!selectedGoalId ? colors.primary.main : colors.text.secondary} />
                                <Text style={[styles.filterOptionText, !selectedGoalId && styles.filterOptionTextActive]}>All Goals</Text>
                                {!selectedGoalId && <Ionicons name="checkmark" size={20} color={colors.primary.main} />}
                            </TouchableOpacity>
                            {goals.map((goal) => (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={[styles.filterOption, selectedGoalId === goal.id && styles.filterOptionActive]}
                                    onPress={() => {
                                        setSelectedGoalId(goal.id);
                                        setShowGoalFilter(false);
                                    }}
                                >
                                    <Ionicons
                                        name={getCategoryIcon(goal.category)}
                                        size={20}
                                        color={selectedGoalId === goal.id ? colors.primary.main : colors.text.secondary}
                                    />
                                    <Text
                                        style={[styles.filterOptionText, selectedGoalId === goal.id && styles.filterOptionTextActive]}
                                        numberOfLines={1}
                                    >
                                        {goal.title}
                                    </Text>
                                    {selectedGoalId === goal.id && <Ionicons name="checkmark" size={20} color={colors.primary.main} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Scrollable Date Selector */}
                <View style={styles.weekSelector}>
                    <FlatList
                        ref={dateScrollRef}
                        data={allDates}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.fullDate.toISOString()}
                        getItemLayout={(data, index) => ({
                            length: DAY_ITEM_WIDTH,
                            offset: DAY_ITEM_WIDTH * index,
                            index,
                        })}
                        renderItem={({ item }) => {
                            const isSelected = selectedDate?.toDateString() === item.fullDate.toDateString();
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.dayButton,
                                        isSelected && styles.dayButtonActive,
                                        item.isToday && !isSelected && styles.dayButtonToday,
                                    ]}
                                    onPress={() => setSelectedDate(item.fullDate)}
                                >
                                    <Text style={[
                                        styles.dayLabel,
                                        isSelected && styles.dayLabelActive,
                                    ]}>
                                        {item.day}
                                    </Text>
                                    <Text style={[
                                        styles.dayDate,
                                        isSelected && styles.dayDateActive,
                                    ]}>
                                        {item.date}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                        contentContainerStyle={styles.dateScrollContent}
                    />
                </View>

                {/* Task Summary with Circular Progress */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <CircularProgress
                            progress={pendingProgress}
                            size={70}
                            strokeWidth={6}
                            color={colors.warning.main}
                        >
                            <Text style={styles.progressValue}>{pendingTasks.length}</Text>
                        </CircularProgress>
                        <Text style={styles.summaryLabel}>Pending</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <CircularProgress
                            progress={completedProgress}
                            size={70}
                            strokeWidth={6}
                            color={colors.success.main}
                        >
                            <Text style={[styles.progressValue, { color: colors.success.main }]}>{completedTasks.length}</Text>
                        </CircularProgress>
                        <Text style={styles.summaryLabel}>Completed</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <CircularProgress
                            progress={timeProgress}
                            size={70}
                            strokeWidth={6}
                            color={colors.primary.main}
                        >
                            <Text style={[styles.progressValue, styles.timeValue]}>{formatTime(totalMinutes)}</Text>
                        </CircularProgress>
                        <Text style={styles.summaryLabel}>Time</Text>
                    </View>
                </View>

                {/* Tasks List */}
                {tasksForDay.length > 0 ? (
                    <View style={styles.tasksList}>
                        {tasksForDay.map((task) => {
                            // Render right swipe action (delete button)
                            const renderRightActions = (
                                progress: Animated.AnimatedInterpolation<number>,
                                dragX: Animated.AnimatedInterpolation<number>
                            ) => {
                                const scale = dragX.interpolate({
                                    inputRange: [-80, 0],
                                    outputRange: [1, 0.5],
                                    extrapolate: 'clamp',
                                });

                                return (
                                    <TouchableOpacity
                                        style={styles.deleteButtonContainer}
                                        onPress={() => handleDeleteTask(task.id, task.title)}
                                    >
                                        <Animated.View style={[styles.deleteButton, { transform: [{ scale }] }]}>
                                            <Ionicons name="trash-outline" size={20} color="#fff" />
                                            <Text style={styles.deleteButtonText}>Delete</Text>
                                        </Animated.View>
                                    </TouchableOpacity>
                                );
                            };

                            return (
                                <Swipeable
                                    key={task.id}
                                    renderRightActions={renderRightActions}
                                    rightThreshold={40}
                                    friction={2}
                                    overshootRight={false}
                                >
                                    <View style={styles.taskCardShadow}>
                                        <Card style={styles.taskCard}>
                                            <TouchableOpacity
                                                style={styles.taskRow}
                                                onPress={() => toggleTaskStatus(task)}
                                            >
                                                <View style={styles.taskContent}>
                                                    <Text style={[
                                                        styles.taskTitle,
                                                        task.status === 'COMPLETED' && styles.taskTitleCompleted
                                                    ]}>
                                                        {task.title}
                                                    </Text>
                                                    {task.description && (
                                                        <Text style={styles.taskDescription} numberOfLines={2}>
                                                            {task.description}
                                                        </Text>
                                                    )}
                                                    <View style={styles.taskMeta}>
                                                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                                                            <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                                                                {task.priority}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.timeBadge}>
                                                            <Ionicons name="time-outline" size={12} color={colors.text.secondary} />
                                                            <Text style={styles.timeText}>{task.estimatedMinutes}m</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <View style={[
                                                    styles.checkbox,
                                                    task.status === 'COMPLETED' && styles.checkboxCompleted
                                                ]}>
                                                    {task.status === 'COMPLETED' && (
                                                        <Ionicons name="checkmark" size={14} color={colors.text.inverse} />
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        </Card>
                                    </View>
                                </Swipeable>
                            );
                        })}
                    </View>
                ) : (
                    /* Empty State */
                    <Card style={styles.emptyCard}>
                        <Ionicons name="sparkles-outline" size={48} color={colors.primary.main} />
                        <Text style={styles.emptyTitle}>No tasks for this day</Text>
                        <Text style={styles.emptyText}>
                            {tasks.length === 0
                                ? 'Complete onboarding to get AI-generated tasks based on your goals!'
                                : 'Select a different day or tap + to add a task.'}
                        </Text>
                    </Card>
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    if (goals.length > 0 && !newTaskGoalId) {
                        setNewTaskGoalId(goals[0].id);
                    }
                    setShowAddTask(true);
                }}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Add Task Bottom Sheet Modal */}
            <Modal
                visible={showAddTask}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddTask(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.bottomSheetOverlay}
                >
                    <TouchableOpacity
                        style={styles.bottomSheetBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowAddTask(false)}
                    />
                    <View style={styles.bottomSheet}>
                        {/* Handle */}
                        <View style={styles.bottomSheetHandle} />

                        {/* Header */}
                        <View style={styles.bottomSheetHeader}>
                            <Text style={styles.bottomSheetTitle}>Add New Task</Text>
                            <TouchableOpacity onPress={() => setShowAddTask(false)}>
                                <Ionicons name="close" size={24} color={colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.bottomSheetContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Title Input */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Title *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={newTaskTitle}
                                    onChangeText={setNewTaskTitle}
                                    placeholder="Enter task title"
                                    placeholderTextColor={colors.text.tertiary}
                                />
                            </View>

                            {/* Description Input */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Description</Text>
                                <TextInput
                                    style={[styles.formInput, styles.formTextArea]}
                                    value={newTaskDescription}
                                    onChangeText={setNewTaskDescription}
                                    placeholder="Enter task description (optional)"
                                    placeholderTextColor={colors.text.tertiary}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            {/* Goal Selector */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Goal *</Text>
                                <TouchableOpacity
                                    style={styles.formSelect}
                                    onPress={() => setShowGoalPicker(!showGoalPicker)}
                                >
                                    {selectedNewTaskGoal ? (
                                        <View style={styles.formSelectContent}>
                                            <Ionicons
                                                name={getCategoryIcon(selectedNewTaskGoal.category)}
                                                size={18}
                                                color={colors.primary.main}
                                            />
                                            <Text style={styles.formSelectText} numberOfLines={1}>
                                                {selectedNewTaskGoal.title}
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.formSelectPlaceholder}>Select a goal</Text>
                                    )}
                                    <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                                </TouchableOpacity>

                                {showGoalPicker && (
                                    <View style={styles.goalPickerDropdown}>
                                        {goals.map((goal) => (
                                            <TouchableOpacity
                                                key={goal.id}
                                                style={[
                                                    styles.goalPickerOption,
                                                    newTaskGoalId === goal.id && styles.goalPickerOptionActive
                                                ]}
                                                onPress={() => {
                                                    setNewTaskGoalId(goal.id);
                                                    setShowGoalPicker(false);
                                                }}
                                            >
                                                <Ionicons
                                                    name={getCategoryIcon(goal.category)}
                                                    size={18}
                                                    color={newTaskGoalId === goal.id ? colors.primary.main : colors.text.secondary}
                                                />
                                                <Text
                                                    style={[
                                                        styles.goalPickerOptionText,
                                                        newTaskGoalId === goal.id && styles.goalPickerOptionTextActive
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {goal.title}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Date Selector */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Scheduled Date</Text>
                                <TouchableOpacity
                                    style={styles.formSelect}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <View style={styles.formSelectContent}>
                                        <Ionicons name="calendar-outline" size={18} color={colors.primary.main} />
                                        <Text style={styles.formSelectText}>
                                            {newTaskDate.toLocaleDateString('en-US', {
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

                            {/* Date Picker Modal for iOS, inline for Android */}
                            {Platform.OS === 'ios' ? (
                                <Modal
                                    visible={showDatePicker}
                                    transparent
                                    animationType="slide"
                                >
                                    <View style={styles.pickerModal}>
                                        <View style={styles.pickerModalContent}>
                                            <View style={styles.pickerModalHeader}>
                                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                                    <Text style={styles.pickerModalCancel}>Cancel</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.pickerModalTitle}>Select Date</Text>
                                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                                    <Text style={styles.pickerModalDone}>Done</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <DateTimePicker
                                                value={newTaskDate}
                                                mode="date"
                                                display="spinner"
                                                onChange={(event: DateTimePickerEvent, date?: Date) => {
                                                    if (date) setNewTaskDate(date);
                                                }}
                                                style={{ height: 200, backgroundColor: colors.background.primary }}
                                                themeVariant="light"
                                            />
                                        </View>
                                    </View>
                                </Modal>
                            ) : (
                                showDatePicker && (
                                    <DateTimePicker
                                        value={newTaskDate}
                                        mode="date"
                                        display="default"
                                        onChange={(event: DateTimePickerEvent, date?: Date) => {
                                            setShowDatePicker(false);
                                            if (date) setNewTaskDate(date);
                                        }}
                                    />
                                )
                            )}

                            {/* Estimated Time / Duration */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Estimated Duration</Text>
                                <TouchableOpacity
                                    style={styles.formSelect}
                                    onPress={() => setShowDurationPicker(true)}
                                >
                                    <View style={styles.formSelectContent}>
                                        <Ionicons name="time-outline" size={18} color={colors.primary.main} />
                                        <Text style={styles.formSelectText}>
                                            {newTaskHours > 0 ? `${newTaskHours}h ` : ''}{newTaskMinutes > 0 || newTaskHours === 0 ? `${newTaskMinutes}m` : ''}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Duration Picker Modal */}
                            <Modal
                                visible={showDurationPicker}
                                transparent
                                animationType="slide"
                            >
                                <View style={styles.pickerModal}>
                                    <View style={styles.pickerModalContent}>
                                        <View style={styles.pickerModalHeader}>
                                            <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                                                <Text style={styles.pickerModalCancel}>Cancel</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.pickerModalTitle}>Duration</Text>
                                            <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                                                <Text style={styles.pickerModalDone}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.durationPickerContainer}>
                                            {/* Hours Picker */}
                                            <View style={styles.durationPickerColumn}>
                                                <Picker
                                                    selectedValue={newTaskHours}
                                                    onValueChange={(value) => setNewTaskHours(value)}
                                                    style={styles.durationPicker}
                                                    itemStyle={styles.pickerItem}
                                                >
                                                    {[...Array(13)].map((_, i) => (
                                                        <Picker.Item key={i} label={`${i}`} value={i} />
                                                    ))}
                                                </Picker>
                                                <Text style={styles.durationPickerLabel}>hours</Text>
                                            </View>
                                            {/* Minutes Picker */}
                                            <View style={styles.durationPickerColumn}>
                                                <Picker
                                                    selectedValue={newTaskMinutes}
                                                    onValueChange={(value) => setNewTaskMinutes(value)}
                                                    style={styles.durationPicker}
                                                    itemStyle={styles.pickerItem}
                                                >
                                                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                                                        <Picker.Item key={m} label={`${m}`} value={m} />
                                                    ))}
                                                </Picker>
                                                <Text style={styles.durationPickerLabel}>minutes</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </Modal>

                            {/* Priority Selector */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Priority</Text>
                                <View style={styles.segmentedControl}>
                                    {(['LOW', 'MEDIUM', 'HIGH'] as TaskPriority[]).map((priority) => (
                                        <TouchableOpacity
                                            key={priority}
                                            style={[
                                                styles.segmentedOption,
                                                newTaskPriority === priority && styles.segmentedOptionActive,
                                                newTaskPriority === priority && {
                                                    backgroundColor: getPriorityColor(priority) + '20',
                                                    borderColor: getPriorityColor(priority),
                                                }
                                            ]}
                                            onPress={() => setNewTaskPriority(priority)}
                                        >
                                            <Text style={[
                                                styles.segmentedOptionText,
                                                newTaskPriority === priority && { color: getPriorityColor(priority) }
                                            ]}>
                                                {priority}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Difficulty Selector */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Difficulty</Text>
                                <View style={styles.segmentedControl}>
                                    {(['EASY', 'MEDIUM', 'HARD'] as TaskDifficulty[]).map((difficulty) => (
                                        <TouchableOpacity
                                            key={difficulty}
                                            style={[
                                                styles.segmentedOption,
                                                newTaskDifficulty === difficulty && styles.segmentedOptionActive,
                                            ]}
                                            onPress={() => setNewTaskDifficulty(difficulty)}
                                        >
                                            <Text style={[
                                                styles.segmentedOptionText,
                                                newTaskDifficulty === difficulty && styles.segmentedOptionTextActive
                                            ]}>
                                                {difficulty}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (!newTaskTitle.trim() || !newTaskGoalId) && styles.submitButtonDisabled
                                ]}
                                onPress={handleAddTask}
                                disabled={!newTaskTitle.trim() || !newTaskGoalId}
                            >
                                <Ionicons name="add-circle" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Add Task</Text>
                            </TouchableOpacity>

                            <View style={{ height: 40 }} />
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
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    headerLeft: {
        flex: 1,
    },
    title: {
        ...typography.variants.h3,
        color: colors.text.primary,
    },
    subtitle: {
        ...typography.variants.body,
        color: colors.text.secondary,
    },

    // Goal Filter
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.background.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: spacing.borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.neutral[200],
    },
    filterText: {
        ...typography.variants.caption,
        color: colors.text.secondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    filterModal: {
        backgroundColor: colors.background.primary,
        borderRadius: spacing.borderRadius.xl,
        padding: spacing.lg,
        width: '100%',
        maxWidth: 320,
    },
    filterModalTitle: {
        ...typography.variants.labelLarge,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: spacing.borderRadius.md,
    },
    filterOptionActive: {
        backgroundColor: colors.primary.main + '15',
    },
    filterOptionText: {
        ...typography.variants.body,
        color: colors.text.primary,
        flex: 1,
    },
    filterOptionTextActive: {
        color: colors.primary.main,
        fontWeight: '600',
    },

    // Week Selector
    weekSelector: {
        marginBottom: spacing.lg,
        backgroundColor: colors.background.primary,
        borderRadius: spacing.borderRadius.xl,
        padding: spacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    dateScrollContent: {
        paddingHorizontal: 0,
    },
    dayButton: {
        width: DAY_ITEM_WIDTH,
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderRadius: spacing.borderRadius.lg,
    },
    dayButtonActive: {
        backgroundColor: colors.primary.main,
    },
    dayButtonToday: {
        borderWidth: 1,
        borderColor: colors.primary.main,
    },
    dayLabel: {
        ...typography.variants.caption,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    dayLabelActive: {
        color: colors.text.inverse,
    },
    dayDate: {
        ...typography.variants.labelLarge,
        color: colors.text.primary,
    },
    dayDateActive: {
        color: colors.text.inverse,
    },

    // Summary
    summaryRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    summaryCard: {
        flex: 1,
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.primary,
        borderRadius: spacing.borderRadius.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryValue: {
        ...typography.variants.h4,
        color: colors.primary.main,
    },
    progressValue: {
        ...typography.variants.labelLarge,
        color: colors.text.primary,
    },
    timeValue: {
        fontSize: 11,
    },
    summaryLabel: {
        ...typography.variants.caption,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },

    // Tasks List
    tasksList: {
        gap: spacing.sm,
    },

    // Delete Button (Swipe Action)
    deleteButtonContainer: {
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: '100%',
        borderRadius: spacing.borderRadius.lg,
        marginLeft: spacing.sm,
    },
    deleteButtonText: {
        ...typography.variants.caption,
        color: '#fff',
        fontWeight: '600',
        marginTop: 4,
    },

    // Task Card Shadow Wrapper
    taskCardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 6,
    },
    taskCard: {
        margin: spacing.xs,
        padding: spacing.md,
        backgroundColor: colors.background.primary,
        borderRadius: spacing.borderRadius.lg,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    checkbox: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxCompleted: {
        backgroundColor: colors.success.main,
        borderColor: colors.success.main,
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        ...typography.variants.label,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    taskTitleCompleted: {
        textDecorationLine: 'line-through',
        color: colors.text.secondary,
    },
    taskDescription: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    priorityBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: spacing.borderRadius.sm,
    },
    priorityText: {
        ...typography.variants.caption,
        fontWeight: '600',
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        ...typography.variants.caption,
        color: colors.text.secondary,
    },

    // Empty State
    emptyCard: {
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.background.primary,
        borderRadius: spacing.borderRadius.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        ...typography.variants.labelLarge,
        color: colors.text.primary,
        marginBottom: spacing.xs,
        marginTop: spacing.md,
    },
    emptyText: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        textAlign: 'center',
    },

    // Floating Action Button
    fab: {
        position: 'absolute',
        bottom: 10,
        right: 24,
        width: 50,
        height: 50,
        borderRadius: 20,
        backgroundColor: colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
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
    formSelectPlaceholder: {
        ...typography.variants.body,
        color: colors.text.tertiary,
    },

    // Goal Picker Dropdown
    goalPickerDropdown: {
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
    goalPickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    goalPickerOptionActive: {
        backgroundColor: colors.primary.main + '10',
    },
    goalPickerOptionText: {
        ...typography.variants.body,
        color: colors.text.primary,
        flex: 1,
    },
    goalPickerOptionTextActive: {
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
    segmentedOptionTextActive: {
        color: colors.primary.main,
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
    durationPickerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    durationPickerColumn: {
        flex: 1,
        alignItems: 'center',
    },
    durationPicker: {
        width: '100%',
        height: 150,
    },
    durationPickerLabel: {
        ...typography.variants.caption,
        color: colors.text.secondary,
        marginTop: -spacing.sm,
    },
    pickerItem: {
        ...typography.variants.body,
        color: colors.text.primary,
    },
});

export default TasksScreen;
