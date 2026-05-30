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



interface SubscriptionState {
  /** Whether the RevenueCat SDK has been configured */
  isConfigured: boolean;
  /** The appUserID currently identified to RevenueCat (Firebase UID after logIn).
   *  Null when anonymous. Used by RootNavigator to ensure we evaluate isPro
   *  against the *current* user's entitlements, not the anonymous default. */
  identifiedUserId: string | null;
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
  /** Error from the most recent failed logIn (after retries). Surfaced to the
   *  RootNavigator so the user can retry identification instead of getting
   *  stuck on a loading screen. */
  identifyError: string | null;

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

/**
 * Reconcile the denormalized Firestore subscriptionTier with RevenueCat's live
 * entitlement after identification. RevenueCat is the source of truth, but the
 * Firestore field can drift if a sub expires or renews while the app is closed
 * (those transitions only sync via the in-session update listener). Only writes
 * when the tier actually differs, and only for the currently identified user.
 */
const reconcileFirestoreTier = async (info: CustomerInfo, userId: string) => {
  const desiredTier = hasPro(info) ? 'pro' : 'free';
  try {
    const { useAuthStore } = await import('@/infrastructure/stores/authStore');
    const currentTier = useAuthStore.getState().user?.subscriptionTier;
    if (currentTier === desiredTier) return;
    const { setSubscriptionTier } = await import('@/infrastructure/firebase/authService');
    await setSubscriptionTier(userId, desiredTier);
  } catch (e) {
    console.warn('[RevenueCat] Firestore tier reconcile failed:', e);
  }
};

// ============ Store ============

export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  isConfigured: false,
  identifiedUserId: null,
  customerInfo: null,
  isPro: false,
  hasEverSubscribed: false,
  isExpired: false,
  currentOffering: null,
  isLoading: false,
  isRestoring: false,
  isPurchasing: false,
  error: null,
  identifyError: null,

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

      // Listen for customer info changes (renewals, cancellations, expirations).
      // Syncs both upgrades AND downgrades to Firestore. The originalAppUserId
      // guard prevents a user-switch from being mis-read as a downgrade —
      // a real downgrade keeps the same originalAppUserId, only the
      // entitlement status flips.
      Purchases.addCustomerInfoUpdateListener((info) => {
        const prevInfo = get().customerInfo;
        const prevPro = hasPro(prevInfo);
        const status = deriveSubscriptionStatus(info);
        set({
          customerInfo: info,
          ...status,
        });

        const sameUser =
          prevInfo?.originalAppUserId === info.originalAppUserId;
        if (!sameUser) return; // user switch — not a real transition

        if (!prevPro && status.isPro) {
          // Upgrade: false → true
          import('@/infrastructure/stores/authStore').then(({ useAuthStore }) => {
            const userId = useAuthStore.getState().user?.id;
            if (!userId || get().identifiedUserId !== userId) return;
            import('@/infrastructure/firebase/authService').then(({ setSubscriptionTier }) => {
              setSubscriptionTier(userId, 'pro');
            });
          });
        } else if (prevPro && !status.isPro) {
          // Downgrade: true → false (sub expired or cancelled mid-session)
          import('@/infrastructure/stores/authStore').then(({ useAuthStore }) => {
            const userId = useAuthStore.getState().user?.id;
            if (!userId || get().identifiedUserId !== userId) return;
            import('@/infrastructure/firebase/authService').then(({ setSubscriptionTier }) => {
              setSubscriptionTier(userId, 'free');
            });
          });
        }
      });

      // Fetch initial customer info
      const info = await Purchases.getCustomerInfo();

      set({
        isConfigured: true,
        customerInfo: info,
        // If we initialized with an explicit appUserID, RC is already identified
        // as that user — record it so RootNavigator's gate can resolve without
        // waiting for a follow-up logIn().
        identifiedUserId: appUserID ?? null,
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
    // Retry with linear backoff (300ms, 900ms) — transient network failures
    // on first launch are common and identification is a hard requirement
    // for the paywall gate. On final failure we surface identifyError so
    // the RootNavigator can show a retry UI instead of an endless spinner.
    set({ error: null, identifyError: null });

    const MAX_ATTEMPTS = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { customerInfo } = await Purchases.logIn(appUserID);
        set({
          customerInfo,
          identifiedUserId: appUserID,
          identifyError: null,
          ...deriveSubscriptionStatus(customerInfo),
        });
        // Reconcile the Firestore tier in case the entitlement changed while
        // the app was closed (expiry/renewal not seen by the live listener).
        reconcileFirestoreTier(customerInfo, appUserID);
        await syncAppsFlyerIdToRevenueCat();
        return;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `[RevenueCat] logIn attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
          error?.message,
        );
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 300 * attempt * attempt));
        }
      }
    }

    console.error('[RevenueCat] logIn failed after retries:', lastError);
    set({
      identifyError:
        lastError?.message || 'Failed to sync subscription account',
      error: lastError?.message || 'Failed to sync subscription account',
    });
  },

  /**
   * Log out and reset to anonymous user.
   */
  logOut: async () => {
    try {
      set({ error: null, identifyError: null });
      const info = await Purchases.logOut();
      set({
        customerInfo: info,
        identifiedUserId: null,
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
