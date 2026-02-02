// src/presentation/screens/onboarding/OnboardingCompleteScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { useAuthStore } from '@/infrastructure/stores/authStore';
import { db } from '@/infrastructure/firebase/config';
import { onboardingData } from './OnboardingGoalScreen';
import { personalData } from './OnboardingPersonalScreen';
import { skillsData } from './OnboardingSkillsScreen';

// Local data service for testing
import { completeOnboardingLocally, USE_LOCAL_DATA, LocalOnboardingData } from '@/data';

export const OnboardingCompleteScreen: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const { user, updateUserProfile } = useAuthStore();

    // ============================================
    // LOCAL MODE: Complete onboarding with local data
    // TODO: Remove this function when using Firebase
    // ============================================
    const handleCompleteLocal = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Gather all onboarding data
            const localOnboardingData: LocalOnboardingData = {
                goalCategory: onboardingData.goalCategory,
                goalTitle: onboardingData.goalTitle,
                goalDescription: onboardingData.goalDescription,
                age: personalData.age,
                occupation: personalData.occupation,
                dailyHours: personalData.dailyHours,
                monthlyBudget: personalData.monthlyBudget,
                experienceLevel: skillsData.experienceLevel,
                challenges: skillsData.challenges,
                customChallenge: skillsData.customChallenge,
            };

            // Save everything locally and generate mock tasks
            const { goal, tasks } = await completeOnboardingLocally(user.id, localOnboardingData);

            console.log('[OnboardingComplete] Local mode - Created goal:', goal.title);
            console.log('[OnboardingComplete] Local mode - Created tasks:', tasks.length);

            // Update local auth state
            updateUserProfile({
                profile: {
                    age: Number(personalData.age),
                    occupation: personalData.occupation,
                    educationLevel: '',
                },
                timeAvailability: {
                    dailyAvailableHours: Number(personalData.dailyHours),
                    preferredTimeSlots: [],
                },
                skills: {
                    existing: [],
                    learningInterests: [],
                },
                onboardingCompleted: true,
            });

            // Navigation will be handled automatically by RootNavigator
        } catch (error) {
            console.error('Error completing onboarding locally:', error);
            Alert.alert(
                'Error',
                'Failed to save your profile. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // FIREBASE MODE: Complete onboarding with Firebase
    // ============================================
    const handleCompleteFirebase = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Prepare user data update
            const userData = {
                profile: {
                    age: Number(personalData.age),
                    occupation: personalData.occupation,
                    educationLevel: '',
                },
                timeAvailability: {
                    dailyAvailableHours: Number(personalData.dailyHours),
                },
                skills: {
                    experienceLevel: skillsData.experienceLevel,
                    challenges: skillsData.challenges,
                },
                onboardingCompleted: true,
                updatedAt: serverTimestamp(),
            };

            // Update Firestore
            await updateDoc(doc(db, 'users', user.id), userData);

            // Update local state
            updateUserProfile({
                profile: {
                    age: Number(personalData.age),
                    occupation: personalData.occupation,
                    educationLevel: '',
                },
                timeAvailability: {
                    dailyAvailableHours: Number(personalData.dailyHours),
                    preferredTimeSlots: [],
                },
                skills: {
                    existing: [],
                    learningInterests: [],
                },
                onboardingCompleted: true,
            });

            // Navigation will be handled automatically by RootNavigator
        } catch (error) {
            console.error('Error completing onboarding:', error);
            Alert.alert(
                'Error',
                'Failed to save your profile. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    // Choose which handler to use based on USE_LOCAL_DATA flag
    const handleComplete = USE_LOCAL_DATA ? handleCompleteLocal : handleCompleteFirebase;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.content}>
                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '100%' }]} />
                    </View>
                    <Text style={styles.progressText}>Step 5 of 5</Text>
                </View>

                {/* Content */}
                <View style={styles.mainContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-circle" size={64} color={colors.success.main} />
                    </View>
                    <Text style={styles.title}>You're all set!</Text>
                    <Text style={styles.subtitle}>
                        We have everything we need to create your personalized plan.
                    </Text>

                    {/* Summary Card */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Your Goal Summary</Text>

                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Goal Category</Text>
                            <Text style={styles.summaryValue}>
                                {onboardingData.goalCategory || 'Not set'}
                            </Text>
                        </View>

                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Your Goal</Text>
                            <Text style={styles.summaryValue} numberOfLines={2}>
                                {onboardingData.goalTitle || 'Not set'}
                            </Text>
                        </View>

                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Daily Time</Text>
                            <Text style={styles.summaryValue}>
                                {personalData.dailyHours ? `${personalData.dailyHours} hours` : 'Not set'}
                            </Text>
                        </View>

                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Experience</Text>
                            <Text style={styles.summaryValue}>
                                {skillsData.experienceLevel || 'Not set'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.note}>
                        Our AI will analyze your profile and create a personalized action plan with daily tasks.
                    </Text>
                </View>

                {/* Button */}
                <View style={styles.buttonSection}>
                    <Button
                        title="Start My Journey"
                        onPress={handleComplete}
                        loading={loading}
                        fullWidth
                        size="large"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    content: {
        flex: 1,
        padding: spacing.screenPadding,
    },

    // Progress
    progressContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
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
        backgroundColor: colors.success.main,
        borderRadius: 2,
    },
    progressText: {
        ...typography.variants.caption,
        color: colors.success.main,
    },

    // Content
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.variants.h2,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        ...typography.variants.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.md,
    },

    // Summary Card
    summaryCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.xl,
        padding: spacing.lg,
        width: '100%',
        marginBottom: spacing.lg,
    },
    summaryTitle: {
        ...typography.variants.labelLarge,
        color: colors.text.primary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    summaryLabel: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
    },
    summaryValue: {
        ...typography.variants.label,
        color: colors.text.primary,
        textAlign: 'right',
        flex: 1,
        marginLeft: spacing.md,
    },

    note: {
        ...typography.variants.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
    },

    // Button
    buttonSection: {
        paddingTop: spacing.lg,
    },
});

export default OnboardingCompleteScreen;
