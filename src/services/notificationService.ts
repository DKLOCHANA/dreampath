// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';

const NOTIF_ENABLED_KEY = '@dreampath_notifications_enabled';
const NOTIF_IDENTIFIER = 'dreampath_reengagement';
const TRIAL_END_NOTIF_IDENTIFIER = 'dreampath_trial_end_reminder';
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const MESSAGES = [
    {
        title: 'Your goals are waiting ✨',
        body: "Small steps add up fast. Check in for 2 minutes — your future self will thank you.",
    },
    {
        title: "Keep your momentum going 🔥",
        body: "You've come too far to slow down. One quick action keeps the streak alive.",
    },
    {
        title: "Your dreams need attention 🎯",
        body: "Goals don't chase themselves. Tap in and make today count.",
    },
    {
        title: "One step closer to your best self 🚀",
        body: "Progress, not perfection. What's the one thing you can do right now?",
    },
    {
        title: "Check in on your dreams 🌟",
        body: "Success is built in the small moments. Let's keep building yours.",
    },
    {
        title: "You've got this 💪",
        body: "The best version of you is being built one day at a time. Don't miss today.",
    },
];

/**
 * Configure how notifications display when the app is foregrounded.
 * Must be called once at app startup, before any notification can arrive.
 */
export const initializeNotificationHandler = (): void => {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
};

/** Read the user's notification on/off preference from AsyncStorage */
export const getNotificationsEnabled = async (): Promise<boolean> => {
    try {
        const val = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
        return val === 'true';
    } catch {
        return false;
    }
};

/** Persist the user's notification preference */
export const saveNotificationsEnabled = async (enabled: boolean): Promise<void> => {
    try {
        await AsyncStorage.setItem(NOTIF_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch (error) {
        console.warn('[Notifications] Failed to save preference:', error);
    }
};

/**
 * Schedule a single reengagement notification 12 hours from now.
 * Cancels any existing one first so the window always resets to "now".
 */
export const scheduleReengagementNotification = async (): Promise<void> => {
    try {
        await Notifications.cancelScheduledNotificationAsync(NOTIF_IDENTIFIER);
    } catch {
        // Notification may not exist yet — safe to ignore
    }

    try {
        const { title, body } = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        await Notifications.scheduleNotificationAsync({
            identifier: NOTIF_IDENTIFIER,
            content: {
                title,
                body,
                sound: true,
                badge: 1,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: new Date(Date.now() + TWELVE_HOURS_MS),
            },
        });
        console.log('[Notifications] Reengagement scheduled 12h from now');
    } catch (error) {
        console.warn('[Notifications] Failed to schedule notification:', error);
    }
};

/** Cancel the reengagement notification (user is active or turned off) */
export const cancelReengagementNotification = async (): Promise<void> => {
    try {
        await Notifications.cancelScheduledNotificationAsync(NOTIF_IDENTIFIER);
    } catch {
        // Ignore — may not exist
    }
};

/**
 * Schedule a one-shot reminder 24h before the user's free trial converts to a
 * paid subscription. Pass the trial's expiration timestamp (ms). If the
 * reminder window has already passed, this no-ops silently.
 */
export const scheduleTrialEndReminder = async (
    trialEndMs: number,
): Promise<void> => {
    try {
        await Notifications.cancelScheduledNotificationAsync(TRIAL_END_NOTIF_IDENTIFIER);
    } catch {
        // Not yet scheduled — safe to ignore
    }

    const fireAt = trialEndMs - ONE_DAY_MS;
    if (fireAt <= Date.now()) {
        console.log('[Notifications] Trial-end reminder window already passed');
        return;
    }

    try {
        await Notifications.scheduleNotificationAsync({
            identifier: TRIAL_END_NOTIF_IDENTIFIER,
            content: {
                title: 'Your free trial ends tomorrow',
                body: "Heads-up — billing starts in 24 hours. Cancel in one tap if VividGoals isn't for you.",
                sound: true,
                badge: 1,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: new Date(fireAt),
            },
        });
        console.log('[Notifications] Trial-end reminder scheduled for', new Date(fireAt).toISOString());
    } catch (error) {
        console.warn('[Notifications] Failed to schedule trial-end reminder:', error);
    }
};

/** Cancel the trial-end reminder (purchase refunded, user upgraded, etc.) */
export const cancelTrialEndReminder = async (): Promise<void> => {
    try {
        await Notifications.cancelScheduledNotificationAsync(TRIAL_END_NOTIF_IDENTIFIER);
    } catch {
        // Ignore
    }
};

/**
 * Show a pre-permission rationale alert (App Store guideline: always explain WHY
 * before triggering the system permission prompt), then request permission.
 * Returns true if permission was ultimately granted.
 */
export const requestPermissionsWithRationale = async (): Promise<boolean> => {
    const { status } = await Notifications.getPermissionsAsync();

    if (status === 'granted') return true;

    if (status === 'denied') {
        // iOS won't re-show the system prompt after denial — send user to Settings
        Alert.alert(
            'Notifications Blocked',
            'To receive goal reminders, please enable notifications for VividGoals in your device Settings.',
            [
                { text: 'Not Now', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
        );
        return false;
    }

    // Status is 'undetermined' — show our rationale before the system prompt
    return new Promise((resolve) => {
        Alert.alert(
            'Stay on Track',
            "VividGoals will send a gentle nudge if you haven't checked your goals in a while. You can turn this off any time inside the app.",
            [
                { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
                {
                    text: 'Allow',
                    onPress: async () => {
                        const { status: newStatus } = await Notifications.requestPermissionsAsync({
                            ios: {
                                allowAlert: true,
                                allowBadge: true,
                                allowSound: true,
                            },
                        });
                        resolve(newStatus === 'granted');
                    },
                },
            ],
        );
    });
};

/**
 * Call on every app launch.
 * If notifications are enabled and permission is granted, resets the 12-hour
 * reengagement window from now (cancels old, schedules new).
 * If the user never opens the app within 12h, the notification fires.
 */
export const handleAppLaunch = async (): Promise<void> => {
    try {
        const enabled = await getNotificationsEnabled();
        if (!enabled) return;

        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;

        await scheduleReengagementNotification();
    } catch (error) {
        console.warn('[Notifications] handleAppLaunch error:', error);
    }
};
