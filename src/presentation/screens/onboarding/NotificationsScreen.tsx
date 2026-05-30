// src/presentation/screens/onboarding/NotificationsScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import {
    OnboardingLayout,
    OnboardingButton,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { RootStackParamList } from '@/presentation/navigation/types';
import {
    saveNotificationsEnabled,
    scheduleReengagementNotification,
} from '@/services/notificationService';
import { requestTrackingPermission } from '@/services/appsflyerService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    // Request ATT alongside the notification prompt — Apple requires contextual
    // justification before the system dialog, and this screen provides it.
    useEffect(() => {
        const t = setTimeout(() => { requestTrackingPermission(); }, 800);
        return () => clearTimeout(t);
    }, []);

    const exitToAuth = () => {
        navigation.navigate('Auth', { screen: 'Register' });
    };

    const handleAllow = async () => {
        try {
            const { status: currentStatus, canAskAgain } =
                await Notifications.getPermissionsAsync();

            // Already granted — nothing to ask, just schedule + advance
            if (currentStatus === 'granted') {
                setAnswer('notificationsAllowed', true);
                await saveNotificationsEnabled(true);
                await scheduleReengagementNotification();
                exitToAuth();
                return;
            }

            // iOS only shows the system prompt once. If it's been denied (or the
            // OS otherwise won't ask again), route the user to Settings.
            if (currentStatus === 'denied' || !canAskAgain) {
                setAnswer('notificationsAllowed', false);
                await saveNotificationsEnabled(false);
                Alert.alert(
                    'Notifications Blocked',
                    'Enable notifications for VividGoals in your device Settings to receive the trial-ending reminder.',
                    [
                        { text: 'Not Now', style: 'cancel', onPress: exitToAuth },
                        {
                            text: 'Open Settings',
                            onPress: () => {
                                Linking.openSettings();
                                exitToAuth();
                            },
                        },
                    ],
                );
                return;
            }

            // Status is 'undetermined' — trigger the system prompt
            const { status } = await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                },
            });
            const granted = status === 'granted';
            setAnswer('notificationsAllowed', granted);
            await saveNotificationsEnabled(granted);
            if (granted) {
                await scheduleReengagementNotification();
            }
            exitToAuth();
        } catch (error) {
            console.warn('[Notifications] permission request failed', error);
            setAnswer('notificationsAllowed', false);
            exitToAuth();
        }
    };

    const handleSkip = () => {
        setAnswer('notificationsAllowed', false);
        saveNotificationsEnabled(false); // fire-and-forget
        exitToAuth();
    };

    return (
        <OnboardingLayout
            step={28}
            onBack={() => navigation.goBack()}
            scrollable
            contentContainerStyle={styles.content}
            footer={
                <View style={styles.footer}>
                    <OnboardingButton title="Enable reminders" onPress={handleAllow} />
                    <Pressable
                        onPress={handleSkip}
                        style={({ pressed }) => [
                            styles.skipBtn,
                            pressed && styles.skipPressed,
                        ]}
                    >
                        <Text style={styles.skipText}>
                            Skip — I'll risk missing the reminder
                        </Text>
                    </Pressable>
                </View>
            }
        >
            <View style={styles.heroWrap}>
                <View style={styles.heroCircle}>
                    <Ionicons
                        name="notifications"
                        size={44}
                        color={colors.primary.main}
                    />
                </View>
            </View>

            <Text style={styles.title}>
                We'll remind you{'\n'}before your trial ends.
            </Text>

            <Text style={styles.subtitle}>
                No surprise charges. Turn on notifications and we'll ping you
                24 hours before your free trial converts — so you decide.
            </Text>

            <View style={styles.compareCard}>
                <View style={styles.compareRow}>
                    <View style={[styles.compareIcon, styles.compareIconOn]}>
                        <Ionicons
                            name="notifications"
                            size={20}
                            color={colors.primary.main}
                        />
                    </View>
                    <View style={styles.compareBody}>
                        <Text style={styles.compareTitle}>Trial-ending reminder</Text>
                        <Text style={styles.compareSubtitle}>
                            A heads-up the day before billing starts. Cancel in one tap
                            if it's not for you.
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.compareRow}>
                    <View style={[styles.compareIcon, styles.compareIconOff]}>
                        <Ionicons
                            name="notifications-off"
                            size={20}
                            color={colors.error.main}
                        />
                    </View>
                    <View style={styles.compareBody}>
                        <Text style={styles.compareTitle}>Without notifications</Text>
                        <Text style={styles.compareSubtitle}>
                            You won't get the trial-ending reminder, and may not realise
                            billing has started.
                        </Text>
                    </View>
                </View>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingTop: spacing.lg,
        paddingBottom: spacing.lg,
    },
    heroWrap: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    heroCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.primary.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...typography.variants.h1,
        fontSize: 30,
        lineHeight: 38,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.5,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    subtitle: {
        ...typography.variants.body,
        fontSize: 15,
        lineHeight: 22,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.xl,
    },
    compareCard: {
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.light,
        borderRadius: spacing.borderRadius.xl,
        padding: spacing.md,
        gap: spacing.md,
    },
    compareRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
    },
    compareIcon: {
        width: 40,
        height: 40,
        borderRadius: spacing.borderRadius.md + 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    compareIconOn: {
        backgroundColor: colors.primary.background,
    },
    compareIconOff: {
        backgroundColor: colors.error.background,
    },
    compareBody: {
        flex: 1,
    },
    compareTitle: {
        ...typography.variants.h6,
        fontSize: 15,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 2,
    },
    compareSubtitle: {
        ...typography.variants.bodySmall,
        fontSize: 13,
        lineHeight: 18,
        color: colors.text.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border.light,
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
        fontWeight: '500',
        color: colors.text.secondary,
        textDecorationLine: 'underline',
    },
});

export default NotificationsScreen;
