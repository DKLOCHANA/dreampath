// src/services/networkService.ts
// Network connectivity service for handling offline scenarios

import { Alert } from 'react-native';
import * as Network from 'expo-network';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface NetworkState {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: Network.NetworkStateType | null;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const NO_INTERNET_TITLE = 'No Internet Connection';
const NO_INTERNET_MESSAGE = 'Please check your internet connection and try again.';

// Track last alert time to prevent multiple alerts in quick succession
let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 3000; // 3 seconds cooldown between alerts

// ═══════════════════════════════════════════════════════════════
// FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get current network state
 */
export async function getNetworkState(): Promise<NetworkState> {
    try {
        const networkState = await Network.getNetworkStateAsync();
        return {
            isConnected: networkState.isConnected ?? false,
            isInternetReachable: networkState.isInternetReachable ?? null,
            type: networkState.type ?? null,
        };
    } catch (error) {
        console.error('[NetworkService] Error getting network state:', error);
        return {
            isConnected: false,
            isInternetReachable: false,
            type: null,
        };
    }
}

/**
 * Check if device has internet connectivity
 * @returns true if connected to internet, false otherwise
 */
export async function isOnline(): Promise<boolean> {
    try {
        const networkState = await Network.getNetworkStateAsync();
        // Check both isConnected and isInternetReachable for reliable detection
        return networkState.isConnected === true && 
               networkState.isInternetReachable !== false;
    } catch (error) {
        console.error('[NetworkService] Error checking connectivity:', error);
        return false;
    }
}

/**
 * Check if device is offline
 * @returns true if offline, false if online
 */
export async function isOffline(): Promise<boolean> {
    return !(await isOnline());
}

/**
 * Show no internet connection alert
 * Includes cooldown to prevent multiple alerts in quick succession
 * @param customTitle Optional custom title for the alert
 * @param customMessage Optional custom message for the alert
 * @param onRetry Optional callback function for retry button
 */
export function showNoInternetAlert(
    customTitle?: string,
    customMessage?: string,
    onRetry?: () => void
): void {
    const now = Date.now();
    
    // Check cooldown to prevent alert spam
    if (now - lastAlertTime < ALERT_COOLDOWN_MS) {
        console.log('[NetworkService] Alert cooldown active, skipping alert');
        return;
    }
    
    lastAlertTime = now;
    
    const title = customTitle || NO_INTERNET_TITLE;
    const message = customMessage || NO_INTERNET_MESSAGE;
    
    const buttons = onRetry
        ? [
            { text: 'Cancel', style: 'cancel' as const },
            { text: 'Retry', onPress: onRetry },
          ]
        : [{ text: 'OK', style: 'default' as const }];
    
    Alert.alert(title, message, buttons);
}

/**
 * Check connectivity and show alert if offline
 * @param options Optional configuration for the alert
 * @returns true if online, false if offline (alert shown)
 */
export async function checkConnectivityWithAlert(options?: {
    customTitle?: string;
    customMessage?: string;
    onRetry?: () => void;
    showAlert?: boolean;
}): Promise<boolean> {
    const online = await isOnline();
    
    if (!online && (options?.showAlert !== false)) {
        showNoInternetAlert(
            options?.customTitle,
            options?.customMessage,
            options?.onRetry
        );
    }
    
    return online;
}

/**
 * Wrapper function to execute a network operation with connectivity check
 * Shows alert if offline before attempting the operation
 * 
 * @param operation The async network operation to execute
 * @param options Optional configuration
 * @returns Result of the operation, or null if offline
 */
export async function withNetworkCheck<T>(
    operation: () => Promise<T>,
    options?: {
        customTitle?: string;
        customMessage?: string;
        onRetry?: () => void;
        throwOnOffline?: boolean;
    }
): Promise<T | null> {
    const online = await isOnline();
    
    if (!online) {
        showNoInternetAlert(
            options?.customTitle,
            options?.customMessage,
            options?.onRetry
        );
        
        if (options?.throwOnOffline) {
            throw new NetworkOfflineError();
        }
        
        return null;
    }
    
    return await operation();
}

/**
 * Custom error class for offline scenarios
 */
export class NetworkOfflineError extends Error {
    constructor(message: string = 'No internet connection') {
        super(message);
        this.name = 'NetworkOfflineError';
    }
}

/**
 * Check if an error is a network-related error
 * @param error The error to check
 * @returns true if the error is network-related
 */
export function isNetworkError(error: unknown): boolean {
    if (!error) return false;
    
    if (error instanceof NetworkOfflineError) return true;
    
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('network') ||
            message.includes('internet') ||
            message.includes('connection') ||
            message.includes('offline') ||
            message.includes('fetch') ||
            message.includes('timeout') ||
            message.includes('network request failed')
        );
    }
    
    return false;
}

/**
 * Handle network error by showing appropriate alert
 * @param error The error that occurred
 * @param onRetry Optional retry callback
 */
export function handleNetworkError(
    error: unknown,
    onRetry?: () => void
): void {
    if (isNetworkError(error)) {
        showNoInternetAlert(
            undefined,
            undefined,
            onRetry
        );
    }
}

// Default export
export default {
    getNetworkState,
    isOnline,
    isOffline,
    showNoInternetAlert,
    checkConnectivityWithAlert,
    withNetworkCheck,
    isNetworkError,
    handleNetworkError,
    NetworkOfflineError,
};
