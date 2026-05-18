// src/services/appsflyerService.ts
// ═══════════════════════════════════════════════════════════════
// AppsFlyer Event Tracking Service
// Handles SDK initialization, ATT consent, SKAN fallback,
// and in-app event logging for attribution analytics.
// ═══════════════════════════════════════════════════════════════

import appsFlyer from 'react-native-appsflyer';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import {
    requestTrackingPermissionsAsync,
    getTrackingPermissionsAsync,
    PermissionStatus,
} from 'expo-tracking-transparency';

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const APPSFLYER_CONFIG = {
    devKey: process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY ?? '',
    appId: process.env.EXPO_PUBLIC_APPSFLYER_APP_ID ?? '',
    /** Seconds the SDK waits for ATT authorization before recording install */
    attTimeout: 120,
} as const;

// ═══════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════

type InitState = 'idle' | 'ready' | 'failed';

let _initState: InitState = 'idle';
let _initPromise: Promise<void> | null = null;
let _appsFlyerUID: string | null = null;

// ═══════════════════════════════════════════════════════════════
// SDK Initialization
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize the AppsFlyer SDK. Call once at app startup.
 *
 * - Installs are attributed automatically.
 * - SKAN is enabled by default for iOS 14+ privacy-safe attribution
 *   when the user denies ATT.
 * - `timeToWaitForATTUserAuthorization` defers the install event
 *   so the SDK can capture IDFA if ATT is granted during onboarding.
 *
 * Concurrent calls share a single in-flight promise so `initSdk` only
 * fires once even if multiple call sites race at startup.
 */
export const initializeAppsFlyer = (): Promise<void> => {
    if (_initState === 'ready') return Promise.resolve();
    if (_initPromise) return _initPromise;

    if (!APPSFLYER_CONFIG.devKey) {
        console.warn('[AppsFlyer] Missing dev key — skipping initialization');
        return Promise.resolve();
    }

    _initPromise = new Promise((resolve, reject) => {
        appsFlyer.initSdk(
            {
                devKey: APPSFLYER_CONFIG.devKey,
                isDebug: __DEV__,
                appId: APPSFLYER_CONFIG.appId,
                onInstallConversionDataListener: true,
                onDeepLinkListener: false,
                timeToWaitForATTUserAuthorization: APPSFLYER_CONFIG.attTimeout,
            },
            (result) => {
                console.log('[AppsFlyer] SDK initialized:', result);
                _initState = 'ready';
                _cacheUID();
                resolve();
            },
            (error) => {
                console.error('[AppsFlyer] SDK init error:', error);
                _initState = 'failed';
                _initPromise = null; // allow a future caller to retry
                reject(error);
            },
        );
    });

    return _initPromise;
};

// ═══════════════════════════════════════════════════════════════
// ATT (App Tracking Transparency)
// ═══════════════════════════════════════════════════════════════

/**
 * Request iOS App Tracking Transparency permission.
 * No-op on Android. If the user denies, SKAN handles attribution.
 *
 * @returns `true` if tracking was authorized.
 */
export const requestTrackingPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') return true;

    try {
        const { status } = await requestTrackingPermissionsAsync();
        const granted = status === PermissionStatus.GRANTED;
        console.log('[AppsFlyer] ATT permission:', status);
        return granted;
    } catch (error) {
        console.error('[AppsFlyer] ATT request error:', error);
        return false;
    }
};

/**
 * Check current ATT status without prompting.
 */
export const getTrackingStatus = async (): Promise<PermissionStatus> => {
    if (Platform.OS !== 'ios') return PermissionStatus.GRANTED;

    try {
        const { status } = await getTrackingPermissionsAsync();
        return status;
    } catch {
        return PermissionStatus.UNDETERMINED;
    }
};

// ═══════════════════════════════════════════════════════════════
// AppsFlyer UID
// ═══════════════════════════════════════════════════════════════

/** Pre-cache the UID after init so it's available synchronously later. */
const _cacheUID = (): void => {
    appsFlyer.getAppsFlyerUID((error, uid) => {
        if (!error && uid) {
            _appsFlyerUID = uid;
            console.log('[AppsFlyer] UID cached:', uid);
        }
    });
};

/**
 * Get the AppsFlyer unique user ID.
 * Used to link RevenueCat subscriber attributes for server-to-server attribution.
 */
export const getAppsFlyerUID = (): Promise<string | null> => {
    if (_appsFlyerUID) return Promise.resolve(_appsFlyerUID);

    return new Promise((resolve) => {
        appsFlyer.getAppsFlyerUID((error, uid) => {
            if (error) {
                console.error('[AppsFlyer] Failed to get UID:', error);
                resolve(null);
            } else {
                _appsFlyerUID = uid;
                resolve(uid);
            }
        });
    });
};

/**
 * Set the AppsFlyer UID on the RevenueCat subscriber (required for the
 * RevenueCat ↔ AppsFlyer server integration).
 *
 * Waits for AppsFlyer to finish initializing, then calls
 * `Purchases.setAppsflyerID`. Safe to call multiple times (e.g. after `logIn`).
 */
export const syncAppsFlyerIdToRevenueCat = async (): Promise<void> => {
    try {
        await initializeAppsFlyer();
        const uid = await getAppsFlyerUID();
        if (!uid) {
            console.warn('[AppsFlyer] No UID yet — RevenueCat AppsFlyer attribute not set');
            return;
        }
        await Purchases.setAppsflyerID(uid);
        console.log('[AppsFlyer] Subscriber attribute $appsflyerId set on RevenueCat');
    } catch (error) {
        console.warn('[AppsFlyer] Failed to sync UID to RevenueCat:', error);
    }
};

// ═══════════════════════════════════════════════════════════════
// Event Logging
// ═══════════════════════════════════════════════════════════════

/**
 * Log a generic in-app event to AppsFlyer.
 */
export const logEvent = async (
    eventName: string,
    eventValues: Record<string, string | number | boolean> = {},
): Promise<void> => {
    if (_initState !== 'ready') {
        console.warn(
            '[AppsFlyer] SDK not ready (' + _initState + ') — skipping event:',
            eventName,
        );
        return;
    }

    try {
        await appsFlyer.logEvent(eventName, eventValues);
        console.log('[AppsFlyer] Event logged:', eventName, eventValues);
    } catch (error) {
        console.error('[AppsFlyer] Failed to log event:', eventName, error);
    }
};

/**
 * Log the `af_complete_registration` standard event.
 * Call after a successful sign-up (email/password).
 */
export const logCompleteRegistration = async (
    method: string = 'email',
): Promise<void> => {
    await logEvent('af_complete_registration', {
        af_registration_method: method,
    });
};

// ═══════════════════════════════════════════════════════════════
// Convenience Getters
// ═══════════════════════════════════════════════════════════════

export const isInitialized = (): boolean => _initState === 'ready';

export default {
    initializeAppsFlyer,
    requestTrackingPermission,
    getTrackingStatus,
    getAppsFlyerUID,
    syncAppsFlyerIdToRevenueCat,
    logEvent,
    logCompleteRegistration,
    isInitialized,
};
