// src/presentation/screens/onboarding/OnboardingIntroScreen.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { useAuthStore } from '@/infrastructure/stores/authStore';

type OnboardingNavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingIntro'>;

export const OnboardingIntroScreen: React.FC = () => {
    const navigation = useNavigation<OnboardingNavigationProp>();
    const user = useAuthStore((state) => state.user);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.content}>
                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '20%' }]} />
                    </View>
                    <Text style={styles.progressText}>Step 1 of 5</Text>
                </View>

                {/* Content */}
                <View style={styles.mainContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="hand-right" size={48} color={colors.primary.main} />
                    </View>
                    <Text style={styles.title}>
                        Welcome, {user?.displayName?.split(' ')[0] || 'there'}!
                    </Text>
                    <Text style={styles.subtitle}>
                        Let's set up your profile so we can create personalized plans for you.
                    </Text>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>What we'll ask:</Text>
                        <View style={styles.infoItem}>
                            <Ionicons name="flag-outline" size={20} color={colors.primary.main} />
                            <Text style={styles.infoText}>Your main goal</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="person-outline" size={20} color={colors.primary.main} />
                            <Text style={styles.infoText}>Personal & financial info</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="fitness-outline" size={20} color={colors.primary.main} />
                            <Text style={styles.infoText}>Skills & challenges</Text>
                        </View>
                    </View>

                    <Text style={styles.note}>
                        This takes about 3 minutes and helps our AI create better plans for you.
                    </Text>
                </View>

                {/* Button */}
                <View style={styles.buttonSection}>
                    <Button
                        title="Let's Begin"
                        onPress={() => navigation.navigate('OnboardingGoal')}
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
        backgroundColor: colors.primary.main,
        borderRadius: 2,
    },
    progressText: {
        ...typography.variants.caption,
        color: colors.text.secondary,
    },

    // Content
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary.light + '20',
        alignItems: 'center',
        justifyContent: 'center',
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

    // Info Box
    infoBox: {
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.xl,
        padding: spacing.lg,
        width: '100%',
        marginBottom: spacing.lg,
    },
    infoTitle: {
        ...typography.variants.labelLarge,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    infoText: {
        ...typography.variants.body,
        color: colors.text.secondary,
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

export default OnboardingIntroScreen;
