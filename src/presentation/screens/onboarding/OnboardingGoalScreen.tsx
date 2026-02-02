// src/presentation/screens/onboarding/OnboardingGoalScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { Button, Input } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { GoalCategory } from '@/domain/entities/Goal';

type OnboardingNavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingGoal'>;

interface CategoryOption {
    value: GoalCategory;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    description: string;
}

const CATEGORIES: CategoryOption[] = [
    { value: 'CAREER', icon: 'briefcase-outline', label: 'Career', description: 'Job, business, professional growth' },
    { value: 'FINANCIAL', icon: 'wallet-outline', label: 'Financial', description: 'Savings, investments, income' },
    { value: 'HEALTH', icon: 'fitness-outline', label: 'Health', description: 'Fitness, wellness, habits' },
    { value: 'EDUCATION', icon: 'book-outline', label: 'Education', description: 'Learning, skills, certifications' },
    { value: 'PERSONAL', icon: 'leaf-outline', label: 'Personal', description: 'Self-improvement, hobbies' },
    { value: 'RELATIONSHIP', icon: 'heart-outline', label: 'Relationship', description: 'Family, friends, social' },
];

// Store onboarding data temporarily
export const onboardingData = {
    goalCategory: '' as GoalCategory | '',
    goalTitle: '',
    goalDescription: '',
};

export const OnboardingGoalScreen: React.FC = () => {
    const navigation = useNavigation<OnboardingNavigationProp>();

    const [selectedCategory, setSelectedCategory] = useState<GoalCategory | ''>('');
    const [goalTitle, setGoalTitle] = useState('');
    const [goalDescription, setGoalDescription] = useState('');
    const [errors, setErrors] = useState<{ category?: string; title?: string }>({});

    const validateAndContinue = () => {
        const newErrors: typeof errors = {};

        if (!selectedCategory) {
            newErrors.category = 'Please select a category';
        }
        if (!goalTitle.trim()) {
            newErrors.title = 'Please enter your goal';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            // Store data
            onboardingData.goalCategory = selectedCategory;
            onboardingData.goalTitle = goalTitle;
            onboardingData.goalDescription = goalDescription;

            navigation.navigate('OnboardingPersonal');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Progress */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: '40%' }]} />
                        </View>
                        <Text style={styles.progressText}>Step 2 of 5</Text>
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>What's your main goal?</Text>
                        <Text style={styles.subtitle}>
                            Choose a category and describe what you want to achieve
                        </Text>
                    </View>

                    {/* Category Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Category</Text>
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map((category) => (
                                <TouchableOpacity
                                    key={category.value}
                                    style={[
                                        styles.categoryCard,
                                        selectedCategory === category.value && styles.categoryCardSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedCategory(category.value);
                                        if (errors.category) setErrors({ ...errors, category: undefined });
                                    }}
                                >
                                    <Ionicons
                                        name={category.icon}
                                        size={28}
                                        color={selectedCategory === category.value ? colors.primary.main : colors.text.secondary}
                                    />
                                    <Text style={[
                                        styles.categoryLabel,
                                        selectedCategory === category.value && styles.categoryLabelSelected,
                                    ]}>
                                        {category.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.category && (
                            <Text style={styles.errorText}>{errors.category}</Text>
                        )}
                    </View>

                    {/* Goal Input */}
                    <View style={styles.section}>
                        <Input
                            label="Your Goal"
                            placeholder="e.g., Save $10,000 for emergency fund"
                            value={goalTitle}
                            onChangeText={(text) => {
                                setGoalTitle(text);
                                if (errors.title) setErrors({ ...errors, title: undefined });
                            }}
                            error={errors.title}
                        />

                        <Input
                            label="Why is this important? (optional)"
                            placeholder="Describe why you want to achieve this..."
                            value={goalDescription}
                            onChangeText={setGoalDescription}
                            multiline
                            numberOfLines={3}
                            style={{ minHeight: 80, textAlignVertical: 'top' }}
                        />
                    </View>
                </ScrollView>

                {/* Buttons */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>

                    <Button
                        title="Continue"
                        onPress={validateAndContinue}
                        style={styles.continueButton}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.screenPadding,
        paddingBottom: 100,
    },

    // Progress
    progressContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: colors.neutral[200],
        borderRadius: 2,
        marginBottom: spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary.main,
        borderRadius: 2,
    },
    progressText: {
        ...typography.variants.caption,
        color: colors.text.secondary,
    },

    // Header
    header: {
        marginBottom: spacing.xl,
    },
    title: {
        ...typography.variants.h3,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.variants.body,
        color: colors.text.secondary,
    },

    // Section
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.variants.label,
        color: colors.text.primary,
        marginBottom: spacing.sm,
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
    categoryEmoji: {
        fontSize: 28,
        marginBottom: spacing.xs,
    },
    categoryLabel: {
        ...typography.variants.labelSmall,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    categoryLabelSelected: {
        color: colors.primary.main,
    },

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

export default OnboardingGoalScreen;
