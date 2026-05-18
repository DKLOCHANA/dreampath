// src/infrastructure/stores/subscriptionStore.ts
import { create } from 'zustand';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
  PurchasesPackage,
} from 'react-native-purchases';
import { Alert, Platform } from 'react-native';
import { REVENUECAT_CONFIG } from '@/infrastructure/revenuecat/config';
import { syncAppsFlyerIdToRevenueCat } from '@/services/appsflyerService';

// ============ Types ============

interface SubscriptionState {
  /** Whether the RevenueCat SDK has been configured */
  isConfigured: boolean;
  /** Latest customer info from RevenueCat */
  customerInfo: CustomerInfo | null;
  /** Whether the user has the "Dreampath Pro" entitlement */
  isPro: boolean;
  /** Whether the user ever had the "Dreampath Pro" entitlement (including expired) */
  hasEverSubscribed: boolean;
  /** Whether the user's subscription has expired (was pro, no longer active) */
  isExpired: boolean;
  /** Current offering (contains available packages) */
  currentOffering: PurchasesOffering | null;
  /** Loading states */
  isLoading: boolean;
  isRestoring: boolean;
  isPurchasing: boolean;
  /** Error message (cleared on next action) */
  error: string | null;

  // Actions
  initialize: (appUserID?: string) => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  logIn: (appUserID: string) => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
}

// ============ Helpers ============

/** Check if a CustomerInfo object has the "Dreampath Pro" entitlement active */
const hasPro = (info: CustomerInfo | null): boolean => {
  if (!info) return false;
  return info.entitlements.active[REVENUECAT_CONFIG.entitlementId] !== undefined;
};

/** Check if the user ever had the "Dreampath Pro" entitlement (active or expired) */
const everSubscribed = (info: CustomerInfo | null): boolean => {
  if (!info) return false;
  return info.entitlements.all[REVENUECAT_CONFIG.entitlementId] !== undefined;
};

/** Derive subscription status fields from CustomerInfo */
const deriveSubscriptionStatus = (info: CustomerInfo | null) => {
  const pro = hasPro(info);
  const ever = everSubscribed(info);
  return {
    isPro: pro,
    hasEverSubscribed: ever,
    isExpired: ever && !pro,
  };
};

// ============ Store ============

export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  isConfigured: false,
  customerInfo: null,
  isPro: false,
  hasEverSubscribed: false,
  isExpired: false,
  currentOffering: null,
  isLoading: false,
  isRestoring: false,
  isPurchasing: false,
  error: null,

  /**
   * Configure the RevenueCat SDK and fetch initial customer info.
   * Call this once at app startup (e.g. in App.tsx).
   * Optionally pass an appUserID to identify the user (e.g. Firebase UID).
   */
  initialize: async (appUserID?: string) => {
    try {
      if (get().isConfigured) return;
      set({ isLoading: true, error: null });

      // Enable verbose logging in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      }

      // Configure the SDK
      Purchases.configure({
        apiKey: REVENUECAT_CONFIG.apiKey,
        appUserID: appUserID ?? undefined,
      });
      console.log('REVENUECAT_CONFIG.apiKey', REVENUECAT_CONFIG.apiKey);

      // Listen for customer info changes (e.g. subscription renewals, cancellations)
      Purchases.addCustomerInfoUpdateListener((info) => {
        const status = deriveSubscriptionStatus(info);
        const prevPro = get().isPro;
        set({
          customerInfo: info,
          ...status,
        });
        // Sync tier upgrades to Firestore on transition false -> true.
        // Downgrades to 'free' are recorded only when the user dismisses the expired-paywall,
        // so we don't auto-write 'free' here.
        if (!prevPro && status.isPro) {
          import('@/infrastructure/stores/authStore').then(({ useAuthStore }) => {
            const userId = useAuthStore.getState().user?.id;
            if (!userId) return;
            import('@/infrastructure/firebase/authService').then(({ setSubscriptionTier }) => {
              setSubscriptionTier(userId, 'pro');
            });
          });
        }
      });

      // Fetch initial customer info
      const info = await Purchases.getCustomerInfo();

      set({
        isConfigured: true,
        customerInfo: info,
        ...deriveSubscriptionStatus(info),
        isLoading: false,
      });

      // Pre-fetch offerings in the background
      get().fetchOfferings();
    } catch (error: any) {
      console.error('[RevenueCat] Initialize error:', error);
      set({
        isConfigured: true, // Mark as configured even on error so we don't retry infinitely
        isLoading: false,
        error: error.message || 'Failed to initialize subscriptions',
      });
    }
  },

  /**
   * Refresh the customer info from RevenueCat.
   * Useful after login or to verify current entitlement status.
   */
  refreshCustomerInfo: async () => {
    try {
      set({ error: null });
      const info = await Purchases.getCustomerInfo();
      set({
        customerInfo: info,
        ...deriveSubscriptionStatus(info),
      });
    } catch (error: any) {
      console.error('[RevenueCat] Refresh customer info error:', error);
      set({ error: error.message || 'Failed to refresh subscription status' });
    }
  },

  /**
   * Fetch current offerings (products/packages) from RevenueCat.
   */
  fetchOfferings: async () => {
    try {
      set({ error: null });
      const offerings = await Purchases.getOfferings();
      set({ currentOffering: offerings.current ?? null });
    } catch (error: any) {
      console.error('[RevenueCat] Fetch offerings error:', error);
      set({ error: error.message || 'Failed to load subscription options' });
    }
  },

  /**
   * Purchase a specific package (monthly, yearly, or lifetime).
   * Returns true if the purchase was successful.
   */
  purchasePackage: async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      set({ isPurchasing: true, error: null });

      const { customerInfo } = await Purchases.purchasePackage(pkg);

      set({
        customerInfo,
        ...deriveSubscriptionStatus(customerInfo),
        isPurchasing: false,
      });

      return hasPro(customerInfo);
    } catch (error: any) {
      // User cancelled the purchase — not a real error
      if (error.userCancelled) {
        set({ isPurchasing: false });
        return false;
      }

      console.warn('[RevenueCat] Purchase error:', error);

      const errorCode = error.code?.toString() ?? '';
      const errorMsg = error.message ?? '';

      // Sandbox / test environment errors
      if (
        errorCode === '5' ||
        errorMsg.toLowerCase().includes('test') ||
        errorMsg.toLowerCase().includes('sandbox')
      ) {
        Alert.alert(
          'Sandbox Mode',
          'Purchases are not available in the test environment. This will work in production.',
        );
      } else if (errorMsg.toLowerCase().includes('network')) {
        Alert.alert(
          'Connection Error',
          'Please check your internet connection and try again.',
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          'Something went wrong with your purchase. Please try again later.',
        );
      }

      set({
        isPurchasing: false,
        error: errorMsg || 'Purchase failed. Please try again.',
      });
      return false;
    }
  },

  /**
   * Restore previous purchases (e.g. after reinstall or new device).
   * Returns true if the "Dreampath Pro" entitlement was restored.
   */
  restorePurchases: async (): Promise<boolean> => {
    try {
      set({ isRestoring: true, error: null });

      const info = await Purchases.restorePurchases();

      set({
        customerInfo: info,
        ...deriveSubscriptionStatus(info),
        isRestoring: false,
      });

      return hasPro(info);
    } catch (error: any) {
      console.warn('[RevenueCat] Restore error:', error);

      Alert.alert(
        'Restore Failed',
        'We couldn\'t restore your purchases right now. Please check your connection and try again.',
      );

      set({
        isRestoring: false,
        error: error.message || 'Failed to restore purchases. Please try again.',
      });
      return false;
    }
  },

  /**
   * Log in with a specific appUserID (e.g. Firebase UID).
   * This transfers any anonymous purchases to the identified user.
   */
  logIn: async (appUserID: string) => {
    try {
      set({ error: null });
      const { customerInfo } = await Purchases.logIn(appUserID);
      set({
        customerInfo,
        ...deriveSubscriptionStatus(customerInfo),
      });
      await syncAppsFlyerIdToRevenueCat();
    } catch (error: any) {
      console.error('[RevenueCat] Login error:', error);
      set({ error: error.message || 'Failed to sync subscription account' });
    }
  },

  /**
   * Log out and reset to anonymous user.
   */
  logOut: async () => {
    try {
      set({ error: null });
      const info = await Purchases.logOut();
      set({
        customerInfo: info,
        ...deriveSubscriptionStatus(info),
      });
    } catch (error: any) {
      console.error('[RevenueCat] Logout error:', error);
      // Non-critical — don't block the user
    }
  },

  clearError: () => set({ error: null }),
}));

// ============ Selectors ============

/** Whether the user has the Dreampath Pro entitlement */
export const useIsPro = () => useSubscriptionStore((s) => s.isPro);

/** Whether the user ever had the Dreampath Pro entitlement */
export const useHasEverSubscribed = () => useSubscriptionStore((s) => s.hasEverSubscribed);

/** Whether the user's subscription has expired */
export const useIsExpired = () => useSubscriptionStore((s) => s.isExpired);

/** Whether a purchase is currently in progress */
export const useIsPurchasing = () => useSubscriptionStore((s) => s.isPurchasing);

/** The current RevenueCat offering */
export const useCurrentOffering = () => useSubscriptionStore((s) => s.currentOffering);

/** Any active error message from the subscription store */
export const useSubscriptionError = () => useSubscriptionStore((s) => s.error);
