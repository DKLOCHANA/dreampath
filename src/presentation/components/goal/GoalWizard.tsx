// src/presentation/components/goal/GoalWizard.tsx
// Shared wizard component used in both fullscreen (FirstGoalScreen) and drawer (GoalsScreen)
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Button, Input } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { GoalCategory, GoalPriority, Goal } from '@/domain/entities/Goal';
import { saveGoalLocally } from '@/data';
import { useAuthStore } from '@/infrastructure/stores/authStore';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CATEGORIES: { value: GoalCategory; icon: keyof typeof Ionicons.glyphMap; label: string; description: string }[] = [
    { value: 'CAREER', icon: 'briefcase-outline', label: 'Career', description: 'Job, business, professional growth' },
    { value: 'FINANCIAL', icon: 'wallet-outline', label: 'Financial', description: 'Savings, investments, income' },
    { value: 'HEALTH', icon: 'fitness-outline', label: 'Health', description: 'Fitness, wellness, habits' },
    { value: 'EDUCATION', icon: 'book-outline', label: 'Education', description: 'Learning, skills, certifications' },
    { value: 'PERSONAL', icon: 'leaf-outline', label: 'Personal', description: 'Self-improvement, hobbies' },
    { value: 'RELATIONSHIP', icon: 'heart-outline', label: 'Relationship', description: 'Family, friends, social' },
    { value: 'OTHER', icon: 'ellipsis-horizontal-outline', label: 'Other', description: 'Anything else' },
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
    { value: 'intermediate', icon: 'trending-up-outline' as keyof typeof Ionicons.glyphMap, label: 'Some Experience', description: 'Tried before' },
    { value: 'advanced', icon: 'rocket-outline' as keyof typeof Ionicons.glyphMap, label: 'Experienced', description: 'Want to level up' },
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

const PRIORITY_OPTIONS: { value: GoalPriority; label: string; color: string }[] = [
    { value: 'HIGH', label: 'High', color: '#ef4444' },
    { value: 'MEDIUM', label: 'Medium', color: '#f59e0b' },
    { value: 'LOW', label: 'Low', color: '#10b981' },
];

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface GoalWizardData {
    // Step 1: Goal
    category: GoalCategory | '';
    title: string;
    description: string;
    // Step 2: Timeline
    priority: GoalPriority;
    startDate: Date;
    targetDate: Date;
    // Step 3: Personal
    age: string;
    occupation: string;
    dailyHours: string;
    monthlyBudget: string;
    // Step 4: Experience
    experienceLevel: string;
    challenges: string[];
    customChallenge: string;
}

interface GoalWizardProps {
    mode: 'fullscreen' | 'drawer';
    onComplete: (data: GoalWizardData, goal?: Goal) => void;
    onClose?: () => void;
    onSkip?: () => void; // For fullscreen mode - skip goal creation
    initialStep?: number;
    totalSteps?: number;
    stepOffset?: number; // For onboarding where we start at step 2 of 5
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const GoalWizard: React.FC<GoalWizardProps> = ({
    mode,
    onComplete,
    onClose,
    onSkip,
    initialStep = 1,
    totalSteps = 5,
    stepOffset = 0,
}) => {
    const user = useAuthStore((state) => state.user);
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Step 1: Goal Details
    const [category, setCategory] = useState<GoalCategory | ''>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Step 2: Timeline
    const [priority, setPriority] = useState<GoalPriority>('MEDIUM');
    const [startDate, setStartDate] = useState(new Date());
    const [targetDate, setTargetDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 3);
        return date;
    });
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showTargetDatePicker, setShowTargetDatePicker] = useState(false);

    // Step 3: Personal
    const [age, setAge] = useState('');
    const [occupation, setOccupation] = useState('');
    const [dailyHours, setDailyHours] = useState('');
    const [monthlyBudget, setMonthlyBudget] = useState('');

    // Step 4: Experience & Challenges
    const [experienceLevel, setExperienceLevel] = useState('');
    const [challenges, setChallenges] = useState<string[]>([]);
    const [customChallenge, setCustomChallenge] = useState('');

    const WIZARD_TOTAL_STEPS = 5;
    const displayStep = currentStep + stepOffset;

    // Toggle challenge selection
    const toggleChallenge = (challenge: string) => {
        setChallenges((prev) =>
            prev.includes(challenge)
                ? prev.filter((c) => c !== challenge)
                : [...prev, challenge]
        );
    };

    // Validate current step
    const validateStep = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (currentStep === 1) {
            if (!category) newErrors.category = 'Please select a category';
            if (!title.trim()) newErrors.title = 'Please enter your goal';
        } else if (currentStep === 2) {
            if (targetDate <= startDate) {
                newErrors.targetDate = 'Target date must be after start date';
            }
        } else if (currentStep === 3) {
            if (!dailyHours) newErrors.dailyHours = 'Please select available time';
        } else if (currentStep === 4) {
            if (!experienceLevel) newErrors.experience = 'Please select your experience level';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle next step
    const handleNext = () => {
        if (!validateStep()) return;

        if (currentStep < WIZARD_TOTAL_STEPS) {
            setCurrentStep(currentStep + 1);
            setErrors({});
        } else {
            handleSubmit();
        }
    };

    // Handle previous step
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setErrors({});
        } else {
            onClose?.();
        }
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!validateStep()) return;

        setIsSubmitting(true);

        try {
            const wizardData: GoalWizardData = {
                category: category as GoalCategory,
                title,
                description,
                priority,
                startDate,
                targetDate,
                age,
                occupation,
                dailyHours,
                monthlyBudget,
                experienceLevel,
                challenges,
                customChallenge,
            };

            // Create goal object
            const newGoal: Goal = {
                id: `goal_${Date.now()}`,
                userId: user?.id || 'local_user',
                title: title.trim(),
                description: description.trim(),
                category: category as GoalCategory,
                priority,
                status: 'ACTIVE',
                startDate,
                targetDate,
                milestones: [],
                tags: [experienceLevel, ...challenges.slice(0, 3)].filter(Boolean),
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

            // Save goal locally
            await saveGoalLocally(newGoal);

            // TODO: Call AI API to generate tasks for this goal
            // Tasks will be created when user connects to the AI service

            console.log('[GoalWizard] Goal created:', newGoal.title);

            onComplete(wizardData, newGoal);
        } catch (error) {
            console.error('[GoalWizard] Error:', error);
            Alert.alert('Error', 'Failed to create goal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format date for display
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // ═══════════════════════════════════════════════════════════════
    // STEP RENDERERS
    // ═══════════════════════════════════════════════════════════════

    const renderStep1 = () => (
        <>
            <View style={styles.header}>
                <Text style={styles.stepTitle}>What's your main goal?</Text>
                <Text style={styles.stepSubtitle}>
                    Choose a category and describe what you want to achieve
                </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category</Text>
                <View style={styles.categoryGrid}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.value}
                            style={[
                                styles.categoryCard,
                                category === cat.value && styles.categoryCardSelected,
                            ]}
                            onPress={() => {
                                setCategory(cat.value);
                                setErrors({ ...errors, category: '' });
                            }}
                        >
                            <Ionicons
                                name={cat.icon}
                                size={28}
                                color={category === cat.value ? colors.primary.main : colors.text.secondary}
                            />
                            <Text style={[
                                styles.categoryLabel,
                                category === cat.value && styles.categoryLabelSelected,
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

            {/* Goal Input */}
            <View style={styles.section}>
                <Input
                    label="Your Goal"
                    placeholder="e.g., Save $10,000 for emergency fund"
                    value={title}
                    onChangeText={(text) => {
                        setTitle(text);
                        setErrors({ ...errors, title: '' });
                    }}
                    error={errors.title}
                />

                <Input
                    label="Why is this important? (optional)"
                    placeholder="Describe why you want to achieve this..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
            </View>
        </>
    );

    const renderStep2 = () => (
        <>
            <View style={styles.header}>
                <Text style={styles.stepTitle}>Set your timeline</Text>
                <Text style={styles.stepSubtitle}>
                    When do you want to start and achieve this goal?
                </Text>
            </View>

            {/* Priority */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Priority Level</Text>
                <View style={styles.priorityGrid}>
                    {PRIORITY_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.priorityCard,
                                priority === opt.value && [
                                    styles.priorityCardSelected,
                                    { borderColor: opt.color },
                                ],
                            ]}
                            onPress={() => setPriority(opt.value)}
                        >
                            <View style={[styles.priorityDot, { backgroundColor: opt.color }]} />
                            <Text style={[
                                styles.priorityLabel,
                                priority === opt.value && { color: opt.color, fontWeight: '600' },
                            ]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Start Date */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Start Date</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartDatePicker(true)}
                >
                    <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                    <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
            </View>

            {/* Target Date */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Target Date</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowTargetDatePicker(true)}
                >
                    <Ionicons name="flag-outline" size={20} color={colors.text.secondary} />
                    <Text style={styles.dateText}>{formatDate(targetDate)}</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
                {errors.targetDate && <Text style={styles.errorText}>{errors.targetDate}</Text>}
            </View>

            {/* Date Pickers */}
            {showStartDatePicker && (
                <Modal transparent animationType="fade">
                    <View style={styles.datePickerModal}>
                        <View style={styles.datePickerContent}>
                            <View style={styles.datePickerHeader}>
                                <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                                    <Text style={styles.datePickerCancel}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.datePickerTitle}>Start Date</Text>
                                <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                                    <Text style={styles.datePickerDone}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.datePickerWrapper}>
                                <DateTimePicker
                                    value={startDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(_, date) => date && setStartDate(date)}
                                    minimumDate={new Date()}
                                    style={styles.datePicker}
                                    textColor={colors.text.primary}
                                    themeVariant="light"
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {showTargetDatePicker && (
                <Modal transparent animationType="fade">
                    <View style={styles.datePickerModal}>
                        <View style={styles.datePickerContent}>
                            <View style={styles.datePickerHeader}>
                                <TouchableOpacity onPress={() => setShowTargetDatePicker(false)}>
                                    <Text style={styles.datePickerCancel}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.datePickerTitle}>Target Date</Text>
                                <TouchableOpacity onPress={() => setShowTargetDatePicker(false)}>
                                    <Text style={styles.datePickerDone}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.datePickerWrapper}>
                                <DateTimePicker
                                    value={targetDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(_, date) => date && setTargetDate(date)}
                                    minimumDate={new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)}
                                    style={styles.datePicker}
                                    textColor={colors.text.primary}
                                    themeVariant="light"
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </>
    );

    const renderStep3 = () => (
        <>
            <View style={styles.header}>
                <Text style={styles.stepTitle}>Tell us about yourself</Text>
                <Text style={styles.stepSubtitle}>
                    This helps us create realistic plans that fit your life
                </Text>
            </View>

            {/* Personal Info */}
            <View style={styles.section}>
                <Input
                    label="Your Age (optional)"
                    placeholder="25"
                    value={age}
                    onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={3}
                />

                <Input
                    label="Occupation (optional)"
                    placeholder="e.g., Software Developer, Student, etc."
                    value={occupation}
                    onChangeText={setOccupation}
                    autoCapitalize="words"
                />
            </View>

            {/* Time Availability */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily time for your goal</Text>
                <Text style={styles.sectionSubtitle}>How much time can you dedicate each day?</Text>

                <View style={styles.timeGrid}>
                    {TIME_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.timeCard,
                                dailyHours === opt.value && styles.timeCardSelected,
                            ]}
                            onPress={() => {
                                setDailyHours(opt.value);
                                setErrors({ ...errors, dailyHours: '' });
                            }}
                        >
                            <Text style={[
                                styles.timeLabel,
                                dailyHours === opt.value && styles.timeLabelSelected,
                            ]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {errors.dailyHours && <Text style={styles.errorText}>{errors.dailyHours}</Text>}
            </View>

            {/* Budget */}
            <View style={styles.section}>
                <Input
                    label="Monthly budget for this goal (optional)"
                    placeholder="e.g., 100"
                    value={monthlyBudget}
                    onChangeText={(text) => setMonthlyBudget(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    hint="In your local currency. Leave empty if no budget needed."
                />
            </View>
        </>
    );

    const renderStep4 = () => (
        <>
            <View style={styles.header}>
                <Text style={styles.stepTitle}>Your experience & challenges</Text>
                <Text style={styles.stepSubtitle}>
                    Help us understand where you're starting from
                </Text>
            </View>

            {/* Experience Level */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your experience with this goal</Text>

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
                                setErrors({ ...errors, experience: '' });
                            }}
                        >
                            <Ionicons
                                name={level.icon}
                                size={28}
                                color={experienceLevel === level.value ? colors.primary.main : colors.text.secondary}
                            />
                            <View style={styles.experienceTextContainer}>
                                <Text style={[
                                    styles.experienceLabel,
                                    experienceLevel === level.value && styles.experienceLabelSelected,
                                ]}>
                                    {level.label}
                                </Text>
                                <Text style={styles.experienceDesc}>{level.description}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
                {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}
            </View>

            {/* Challenges */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>What challenges do you face?</Text>
                <Text style={styles.sectionSubtitle}>Select all that apply (optional)</Text>

                <View style={styles.challengesGrid}>
                    {COMMON_CHALLENGES.map((challenge) => (
                        <TouchableOpacity
                            key={challenge}
                            style={[
                                styles.challengeChip,
                                challenges.includes(challenge) && styles.challengeChipSelected,
                            ]}
                            onPress={() => toggleChallenge(challenge)}
                        >
                            <Text style={[
                                styles.challengeText,
                                challenges.includes(challenge) && styles.challengeTextSelected,
                            ]}>
                                {challenge}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Input
                    label="Other challenges (optional)"
                    placeholder="Anything else holding you back?"
                    value={customChallenge}
                    onChangeText={setCustomChallenge}
                    containerStyle={{ marginTop: spacing.md }}
                />
            </View>
        </>
    );

    const renderStep5 = () => (
        <>
            <View style={styles.header}>
                <Text style={styles.stepTitle}>Ready to start! 🎯</Text>
                <Text style={styles.stepSubtitle}>
                    Review your goal and let's begin your journey
                </Text>
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <Ionicons name="flag" size={20} color={colors.primary.main} />
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryLabel}>Goal</Text>
                        <Text style={styles.summaryValue}>{title || 'Your goal'}</Text>
                    </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                    <Ionicons name="folder" size={20} color={colors.primary.main} />
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryLabel}>Category</Text>
                        <Text style={styles.summaryValue}>{category || 'Not selected'}</Text>
                    </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                    <Ionicons name="calendar" size={20} color={colors.primary.main} />
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryLabel}>Timeline</Text>
                        <Text style={styles.summaryValue}>{formatDate(startDate)} → {formatDate(targetDate)}</Text>
                    </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                    <Ionicons name="time" size={20} color={colors.primary.main} />
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryLabel}>Daily Commitment</Text>
                        <Text style={styles.summaryValue}>
                            {TIME_OPTIONS.find(t => t.value === dailyHours)?.label || 'Not set'}
                        </Text>
                    </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                    <Ionicons name="trending-up" size={20} color={colors.primary.main} />
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryLabel}>Experience</Text>
                        <Text style={styles.summaryValue}>
                            {EXPERIENCE_LEVELS.find(e => e.value === experienceLevel)?.label || 'Beginner'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.aiNote}>
                <Ionicons name="sparkles" size={20} color={colors.primary.main} />
                <Text style={styles.aiNoteText}>
                    Our AI will create a personalized plan with daily tasks based on your profile
                </Text>
            </View>
        </>
    );

    // Render current step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            case 5: return renderStep5();
            default: return null;
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* Fullscreen Header */}
            {mode === 'fullscreen' && (
                <View style={styles.fullscreenHeader}>
                    <View style={styles.fullscreenHeaderRow}>
                        <View style={styles.fullscreenHeaderContent}>
                            <Ionicons name="sparkles" size={24} color={colors.primary.main} />
                            <Text style={styles.fullscreenTitle}>Create Your First Goal</Text>
                        </View>
                        {onSkip && (
                            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
                                <Ionicons name="close" size={24} color={colors.text.secondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.fullscreenSubtitle}>
                        Let's set up your personalized path to success
                    </Text>
                </View>
            )}

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(displayStep / totalSteps) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>Step {displayStep} of {totalSteps}</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {renderStepContent()}
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.buttonSection}>
                {/* Hide back button on step 1 for fullscreen (user must create a goal) */}
                {!(mode === 'fullscreen' && currentStep === 1) ? (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backText}>
                            {currentStep === 1 && mode === 'drawer' ? '✕ Close' : '← Back'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.backButton} />
                )}

                <Button
                    title={currentStep === WIZARD_TOTAL_STEPS ? 'Create Goal' : 'Continue'}
                    onPress={handleNext}
                    loading={isSubmitting}
                    style={styles.continueButton}
                />
            </View>
        </KeyboardAvoidingView>
    );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    scrollContent: {
        padding: spacing.screenPadding,
        paddingBottom: 20,
    },

    // Fullscreen Header
    fullscreenHeader: {
        paddingHorizontal: spacing.screenPadding,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    fullscreenHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    fullscreenHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    fullscreenTitle: {
        ...typography.variants.h4,
        color: colors.text.primary,
    },
    fullscreenSubtitle: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
    },
    skipButton: {
        padding: spacing.xs,
    },

    // Progress
    progressContainer: {
        paddingHorizontal: spacing.screenPadding,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: colors.neutral[200],
        borderRadius: 2,
        marginBottom: spacing.xs,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary.main,
        borderRadius: 2,
    },
    progressText: {
        ...typography.variants.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
    },

    // Header
    header: {
        marginBottom: spacing.lg,
    },
    stepTitle: {
        ...typography.variants.h3,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    stepSubtitle: {
        ...typography.variants.body,
        color: colors.text.secondary,
        lineHeight: 22,
    },

    // Section
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.variants.label,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    sectionSubtitle: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        marginBottom: spacing.md,
    },

    // Category Grid
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    categoryCard: {
        width: '31%',
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    categoryLabel: {
        ...typography.variants.caption,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    categoryLabelSelected: {
        color: colors.primary.main,
        fontWeight: '600',
    },

    // Priority Grid
    priorityGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    priorityCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.md,
        padding: spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    priorityCardSelected: {
        backgroundColor: colors.background.primary,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    priorityLabel: {
        ...typography.variants.label,
        color: colors.text.secondary,
    },

    // Date Button
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    dateText: {
        flex: 1,
        ...typography.variants.body,
        color: colors.text.primary,
    },

    // Date Picker Modal
    datePickerModal: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    datePickerContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
    },
    datePickerWrapper: {
        backgroundColor: '#ffffff',
        paddingHorizontal: spacing.md,
    },
    datePicker: {
        height: 220,
        backgroundColor: '#ffffff',
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    datePickerTitle: {
        ...typography.variants.h5,
        color: colors.text.primary,
    },
    datePickerCancel: {
        ...typography.variants.body,
        color: colors.text.secondary,
    },
    datePickerDone: {
        ...typography.variants.body,
        color: colors.primary.main,
        fontWeight: '600',
    },

    // Time Grid
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    timeCard: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    timeCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    timeLabel: {
        ...typography.variants.label,
        color: colors.text.secondary,
    },
    timeLabelSelected: {
        color: colors.primary.main,
        fontWeight: '600',
    },

    // Experience Grid
    experienceGrid: {
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    experienceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.md,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: spacing.md,
    },
    experienceCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    experienceTextContainer: {
        flex: 1,
    },
    experienceLabel: {
        ...typography.variants.label,
        color: colors.text.primary,
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

    // Challenges Grid
    challengesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    challengeChip: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    challengeChipSelected: {
        backgroundColor: colors.primary.main + '20',
        borderColor: colors.primary.main,
    },
    challengeText: {
        ...typography.variants.caption,
        color: colors.text.secondary,
    },
    challengeTextSelected: {
        color: colors.primary.main,
        fontWeight: '600',
    },

    // Summary Card
    summaryCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    summaryContent: {
        flex: 1,
    },
    summaryLabel: {
        ...typography.variants.caption,
        color: colors.text.tertiary,
    },
    summaryValue: {
        ...typography.variants.body,
        color: colors.text.primary,
        fontWeight: '500',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: colors.border.light,
        marginVertical: spacing.md,
    },

    // AI Note
    aiNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primary.main + '10',
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.md,
    },
    aiNoteText: {
        flex: 1,
        ...typography.variants.bodySmall,
        color: colors.primary.main,
    },

    // Error
    errorText: {
        ...typography.variants.caption,
        color: colors.error.main,
        marginTop: spacing.xs,
    },

    // Buttons
    buttonSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.screenPadding,
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    backButton: {
        padding: spacing.sm,
    },
    backText: {
        ...typography.variants.label,
        color: colors.primary.main,
    },
    continueButton: {
        minWidth: 120,
    },
});

export default GoalWizard;
