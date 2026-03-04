// src/presentation/hooks/useRevenueCat.ts
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useSubscriptionStore, useIsPro } from '@/infrastructure/stores/subscriptionStore';
import { checkConnectivityWithAlert } from '@/services/networkService';

/**
 * Hook that provides convenient subscription helpers:
 * - isPro: whether the user has the "Dreampath Pro" entitlement
 * - handleRestorePurchases: restore previous purchases with user feedback
 * - presentCustomerCenter: opens RevenueCat Customer Center (native builds only)
 */
export function useRevenueCat() {
  const isPro = useIsPro();
  const { restorePurchases } = useSubscriptionStore();

  /**
   * Present RevenueCat's Customer Center for subscription management.
   * Only works in native builds (not Expo Go). Falls back gracefully.
   */
  const presentCustomerCenter = useCallback(async () => {
    // Check network connectivity before opening customer center
    const isOnline = await checkConnectivityWithAlert({
      customMessage: 'An internet connection is required to manage your subscription.',
      onRetry: presentCustomerCenter,
    });
    if (!isOnline) return;

    try {
      // Dynamically import to avoid crashes in environments where the UI module isn't available
      const RevenueCatUI = require('react-native-purchases-ui').default;
      await RevenueCatUI.presentCustomerCenter();
    } catch (error: any) {
      console.warn('[RevenueCat] Customer Center not available:', error.message);
      Alert.alert(
        'Manage Subscription',
        'To manage your subscription, go to your device Settings > your Apple ID > Subscriptions.',
      );
    }
  }, []);

  /**
   * Restore purchases with user-facing feedback via Alert.
   */
  const handleRestorePurchases = useCallback(async () => {
    // Check network connectivity before restoring purchases
    const isOnline = await checkConnectivityWithAlert({
      customMessage: 'An internet connection is required to restore purchases.',
      onRetry: handleRestorePurchases,
    });
    if (!isOnline) return;

    const restored = await restorePurchases();
    if (restored) {
      Alert.alert(
        'Purchases Restored',
        'Your VividGoals Pro subscription has been restored successfully!',
      );
    } else {
      Alert.alert(
        'No Purchases Found',
        'We couldn\'t find any previous purchases to restore. If you believe this is an error, please contact support.',
      );
    }
  }, [restorePurchases]);

  return {
    isPro,
    presentCustomerCenter,
    handleRestorePurchases,
  };
}
