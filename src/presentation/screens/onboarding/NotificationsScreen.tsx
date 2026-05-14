// src/presentation/screens/onboarding/NotificationsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';

import {
    OnboardingLayout,
    OnboardingButton,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { shadows } from '@/presentation/theme/shadows';
import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { RootStackParamList } from '@/presentation/navigation/types';
import { saveNotificationsEnabled, scheduleReengagementNotification } from '@/services/notificationService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    const exitToAuth = () => {
        // Onboarding ends here; new user heads to Register. Paywall lives
        // downstream in MainNavigator (unchanged).
        navigation.navigate('Auth', { screen: 'Register' });
    };

    const handleAllow = async () => {
        try {
            const { status: currentStatus } = await Notifications.getPermissionsAsync();

            if (currentStatus === 'denied') {
                // iOS won't re-show the system prompt after denial — inform and let them proceed
                setAnswer('notificationsAllowed', false);
                await saveNotificationsEnabled(false);
                Alert.alert(
                    'Notifications Blocked',
                    'Enable notifications for VividGoals in your device Settings to receive goal reminders.',
                    [
                        { text: 'Not Now', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                    ],
                );
                return; // finally still runs and calls exitToAuth
            }

            const { status } = await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                },
            });
            const granted = status === 'granted';
            setAnswer('notificationsAllowed', granted);
            if (granted) {
                await saveNotificationsEnabled(true);
                await scheduleReengagementNotification();
            } else {
                await saveNotificationsEnabled(false);
            }
        } catch (error) {
            // Permission flow errored — proceed without blocking onboarding.
            console.warn('[Notifications] permission request failed', error);
            setAnswer('notificationsAllowed', false);
        } finally {
            exitToAuth();
        }
    };

    const handleSkip = () => {
        setAnswer('notificationsAllowed', false);
        saveNotificationsEnabled(false); // fire-and-forget, non-critical
        exitToAuth();
    };

    return (
        <OnboardingLayout
            step={28}
            onBack={() => navigation.goBack()}
            footer={
                <View style={styles.footer}>
                    <OnboardingButton title="Allow notifications" onPress={handleAllow} />
                    <Pressable
                        onPress={handleSkip}
                        style={({ pressed }) => [
                            styles.skipBtn,
                            pressed && styles.skipPressed,
                        ]}
                    >
                        <Text style={styles.skipText}>Maybe later</Text>
                    </Pressable>
                </View>
            }
        >
            <View style={styles.body}>
                <Text style={styles.headline}>
                    One last thing — we'll need to nudge you.
                </Text>
                <Text style={styles.sub}>
                    A gentle reminder at the time <Text style={styles.italic}>you</Text> pick.
                    No spam. Change anytime.
                </Text>

                <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>PREVIEW</Text>
                    <View style={styles.previewNotif}>
                        <LinearGradient
                            colors={[colors.primary.main, colors.accent.main]}
                            style={styles.previewIcon}
                        >
                            <Text style={styles.previewIconEmoji}>✨</Text>
                        </LinearGradient>
                        <View style={styles.previewBody}>
                            <View style={styles.previewHeadRow}>
                                <Text style={styles.previewTitle}>VividGoals</Text>
                                <Text style={styles.previewTime}>now</Text>
                            </View>
                            <Text style={styles.previewMessage}>
                                Your one move is ready. 10 min. Let's go. 🔥
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        paddingTop: spacing.md,
        gap: spacing.md,
    },
    headline: {
        ...typography.variants.h2,
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.5,
    },
    sub: {
        ...typography.variants.body,
        fontSize: 15,
        lineHeight: 22,
        color: colors.text.secondary,
    },
    italic: {
        fontStyle: 'italic',
    },
    previewCard: {
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.light,
        borderRadius: spacing.borderRadius.xl + 2,
        padding: spacing.md,
        marginTop: spacing.sm,
    },
    previewLabel: {
        ...typography.variants.labelSmall,
        fontSize: 12,
        fontWeight: '600',
        color: colors.text.tertiary,
        letterSpacing: 0.8,
        marginBottom: spacing.sm + 2,
    },
    previewNotif: {
        flexDirection: 'row',
        gap: spacing.md - 2,
        backgroundColor: colors.background.primary,
        padding: spacing.sm + 4,
        borderRadius: spacing.borderRadius.lg + 2,
        ...shadows.sm,
    },
    previewIcon: {
        width: 38,
        height: 38,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewIconEmoji: {
        fontSize: 20,
    },
    previewBody: {
        flex: 1,
    },
    previewHeadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    previewTitle: {
        ...typography.variants.label,
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.primary,
    },
    previewTime: {
        ...typography.variants.caption,
        fontSize: 11,
        color: colors.text.tertiary,
    },
    previewMessage: {
        ...typography.variants.bodySmall,
        fontSize: 14,
        color: colors.text.primary,
        lineHeight: 19,
        marginTop: 2,
    },
    footer: {
        gap: spacing.xs,
    },
    skipBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
    },
    skipPressed: {
        opacity: 0.7,
    },
    skipText: {
        ...typography.variants.label,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.secondary,
    },
});

export default NotificationsScreen;
