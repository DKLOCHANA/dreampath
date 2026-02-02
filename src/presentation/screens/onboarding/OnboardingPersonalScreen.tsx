// src/presentation/screens/onboarding/OnboardingPersonalScreen.tsx
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

import { Button, Input } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type OnboardingNavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingPersonal'>;

// Store onboarding data temporarily
export const personalData = {
    age: '',
    occupation: '',
    dailyHours: '',
    monthlyBudget: '',
};

const TIME_OPTIONS = [
    { value: '1', label: '< 1 hour' },
    { value: '2', label: '1-2 hours' },
    { value: '3', label: '2-3 hours' },
    { value: '4', label: '3-4 hours' },
    { value: '5', label: '4+ hours' },
];

export const OnboardingPersonalScreen: React.FC = () => {
    const navigation = useNavigation<OnboardingNavigationProp>();

    const [age, setAge] = useState('');
    const [occupation, setOccupation] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [monthlyBudget, setMonthlyBudget] = useState('');
    const [errors, setErrors] = useState<{ age?: string; time?: string }>({});

    const validateAndContinue = () => {
        const newErrors: typeof errors = {};

        if (!age.trim() || isNaN(Number(age)) || Number(age) < 13 || Number(age) > 120) {
            newErrors.age = 'Please enter a valid age';
        }
        if (!selectedTime) {
            newErrors.time = 'Please select your available time';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            // Store data
            personalData.age = age;
            personalData.occupation = occupation;
            personalData.dailyHours = selectedTime;
            personalData.monthlyBudget = monthlyBudget;

            navigation.navigate('OnboardingSkills');
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
                            <View style={[styles.progressFill, { width: '60%' }]} />
                        </View>
                        <Text style={styles.progressText}>Step 3 of 5</Text>
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Tell us about yourself</Text>
                        <Text style={styles.subtitle}>
                            This helps us create realistic plans that fit your life
                        </Text>
                    </View>

                    {/* Personal Info */}
                    <View style={styles.section}>
                        <Input
                            label="Your Age"
                            placeholder="25"
                            value={age}
                            onChangeText={(text) => {
                                setAge(text.replace(/[^0-9]/g, ''));
                                if (errors.age) setErrors({ ...errors, age: undefined });
                            }}
                            error={errors.age}
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
                        <Text style={styles.sectionSubtitle}>
                            How much time can you dedicate each day?
                        </Text>

                        <View style={styles.optionsGrid}>
                            {TIME_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionCard,
                                        selectedTime === option.value && styles.optionCardSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedTime(option.value);
                                        if (errors.time) setErrors({ ...errors, time: undefined });
                                    }}
                                >
                                    <Text style={[
                                        styles.optionLabel,
                                        selectedTime === option.value && styles.optionLabelSelected,
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.time && (
                            <Text style={styles.errorText}>{errors.time}</Text>
                        )}
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
        marginBottom: spacing.xs,
    },
    sectionSubtitle: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        marginBottom: spacing.md,
    },

    // Options Grid
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    optionCard: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    optionLabel: {
        ...typography.variants.label,
        color: colors.text.secondary,
    },
    optionLabelSelected: {
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

export default OnboardingPersonalScreen;
