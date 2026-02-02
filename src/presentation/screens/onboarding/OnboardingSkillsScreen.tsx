// src/presentation/screens/onboarding/OnboardingSkillsScreen.tsx
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

type OnboardingNavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingSkills'>;

// Store onboarding data temporarily
export const skillsData = {
    experienceLevel: '',
    challenges: [] as string[],
    customChallenge: '',
};

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

export const OnboardingSkillsScreen: React.FC = () => {
    const navigation = useNavigation<OnboardingNavigationProp>();

    const [experienceLevel, setExperienceLevel] = useState('');
    const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
    const [customChallenge, setCustomChallenge] = useState('');
    const [errors, setErrors] = useState<{ experience?: string }>({});

    const toggleChallenge = (challenge: string) => {
        setSelectedChallenges((prev) =>
            prev.includes(challenge)
                ? prev.filter((c) => c !== challenge)
                : [...prev, challenge]
        );
    };

    const validateAndContinue = () => {
        const newErrors: typeof errors = {};

        if (!experienceLevel) {
            newErrors.experience = 'Please select your experience level';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            // Store data
            skillsData.experienceLevel = experienceLevel;
            skillsData.challenges = selectedChallenges;
            skillsData.customChallenge = customChallenge;

            navigation.navigate('OnboardingComplete');
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
                            <View style={[styles.progressFill, { width: '80%' }]} />
                        </View>
                        <Text style={styles.progressText}>Step 4 of 5</Text>
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Your experience & challenges</Text>
                        <Text style={styles.subtitle}>
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
                                        if (errors.experience) setErrors({ ...errors, experience: undefined });
                                    }}
                                >
                                    <Ionicons
                                        name={level.icon}
                                        size={32}
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
                        {errors.experience && (
                            <Text style={styles.errorText}>{errors.experience}</Text>
                        )}
                    </View>

                    {/* Challenges */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>What challenges do you face?</Text>
                        <Text style={styles.sectionSubtitle}>
                            Select all that apply (optional)
                        </Text>

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
                                        styles.challengeText,
                                        selectedChallenges.includes(challenge) && styles.challengeTextSelected,
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
        gap: spacing.sm,
    },
    experienceCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    experienceEmoji: {
        fontSize: 28,
    },
    experienceLabel: {
        ...typography.variants.labelLarge,
        color: colors.text.primary,
        flex: 0,
    },
    experienceLabelSelected: {
        color: colors.primary.main,
    },
    experienceDesc: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        flex: 1,
        textAlign: 'right',
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
        ...typography.variants.labelSmall,
        color: colors.text.secondary,
    },
    challengeTextSelected: {
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

export default OnboardingSkillsScreen;
