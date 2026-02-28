// src/infrastructure/revenuecat/config.ts

/**
 * RevenueCat configuration for VividGoals
 *
 * Uses EXPO_PUBLIC_APP_ENV to pick the right key:
 *   - "production" → production key
 *   - anything else → test key
 * Set EXPO_PUBLIC_APP_ENV in your .env / .env.production files.
 */

console.log('process.env.EXPO_PUBLIC_APP_ENV', process.env.EXPO_PUBLIC_APP_ENV);
const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';
console.log('isProduction', isProduction);
const apiKey = isProduction
  ? (process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '')
  : (process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_TEST ?? '');

export const REVENUECAT_CONFIG = {
  /** RevenueCat public API key (test in dev, production in release) */
  apiKey,

  /** Entitlement identifier configured in RevenueCat dashboard */
  entitlementId: 'Dreampath Pro',

  /** Product identifiers configured in RevenueCat dashboard offerings */
  productIds: {
    monthly: 'dreampath',
    annual: 'dreampath_yearly',
  },
} as const;

export type ProductId = keyof typeof REVENUECAT_CONFIG.productIds;
