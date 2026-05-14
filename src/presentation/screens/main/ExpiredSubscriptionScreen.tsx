// src/presentation/screens/main/ExpiredSubscriptionScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    ActivityIndicator,
    Platform,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';

import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { useSubscriptionStore } from '@/infrastructure/stores/subscriptionStore';
import { useAuthStore } from '@/infrastructure/stores/authStore';
import { setSubscriptionTier } from '@/infrastructure/firebase/authService';
import { checkConnectivityWithAlert } from '@/services/networkService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PlanType = 'annual' | 'monthly';

const FEATURES = [
    { icon: 'sparkles', text: 'Unlimited AI Goal Breakdowns' },
    { icon: 'bulb', text: 'Advanced AI Planning Agent' },
    { icon: 'analytics', text: 'Advanced Analytics & Insights' },
];

export const ExpiredSubscriptionScreen: React.FC = () => {
    const navigation = useNavigation();
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');

    const {
        currentOffering,
        isPurchasing,
        isRestoring,
        isPro,
        error,
        isLoading,
        fetchOfferings,
        purchasePackage,
        restorePurchases,
        clearError,
    } = useSubscriptionStore();

    useEffect(() => {
        fetchOfferings();
    }, [fetchOfferings]);

    const goToHome = useCallback(() => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'Tabs' as never }],
            }),
        );
    }, [navigation]);

    const handleClose = useCallback(async () => {
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
            // Fire-and-forget: persist tier locally and in Firestore. Navigation must not wait on the network.
            setSubscriptionTier(userId, 'free');
        }
        goToHome();
    }, [goToHome]);

    useEffect(() => {
        if (isPro) {
            const userId = useAuthStore.getState().user?.id;
            if (userId) {
                setSubscriptionTier(userId, 'pro');
            }
            Alert.alert(
                'Welcome Back!',
                'Your VividGoals Pro subscription has been reactivated.',
                [{ text: 'Awesome!', onPress: goToHome }],
            );
        }
    }, [isPro, goToHome]);

    const getPackageForPlan = useCallback((plan: PlanType): PurchasesPackage | undefined => {
        if (!currentOffering?.availablePackages) return undefined;

        const packages = currentOffering.availablePackages;

        if (plan === 'annual') {
            return packages.find(
                (p) =>
                    p.packageType === 'ANNUAL' ||
                    p.identifier === '$rc_annual' ||
                    p.identifier === 'annual'
            );
        }

        return packages.find(
            (p) =>
                p.packageType === 'MONTHLY' ||
                p.identifier === '$rc_monthly' ||
                p.identifier === 'monthly'
        );
    }, [currentOffering]);

    const annualPackage = getPackageForPlan('annual');
    const monthlyPackage = getPackageForPlan('monthly');

    const savingsPercentage = useCallback(() => {
        if (!annualPackage || !monthlyPackage) return null;

        const monthlyPrice = monthlyPackage.product.price;
        const annualPrice = annualPackage.product.price;
        const yearlyMonthlyPrice = monthlyPrice * 12;

        if (yearlyMonthlyPrice <= 0) return null;

        const savings = ((yearlyMonthlyPrice - annualPrice) / yearlyMonthlyPrice) * 100;
        return Math.round(savings);
    }, [annualPackage, monthlyPackage]);

    const formatPriceDisplay = useCallback((pkg: PurchasesPackage | undefined, planType: PlanType) => {
        if (!pkg) {
            return {
                title: planType === 'annual' ? 'Annual plan' : 'Monthly plan',
                price: planType === 'annual' ? 'US$49.99 per year' : 'US$7.99 per month',
            };
        }

        const { product } = pkg;
        const priceString = product.priceString;

        if (planType === 'annual') {
            return {
                title: 'Annual plan',
                price: `${priceString} per year`,
            };
        }

        return {
            title: 'Monthly plan',
            price: `${priceString} per month`,
        };
    }, []);

    const handlePurchase = async () => {
        const isOnline = await checkConnectivityWithAlert({
            customMessage: 'An internet connection is required to complete your purchase. Please check your connection and try again.',
            onRetry: handlePurchase,
        });
        if (!isOnline) return;

        const pkg = getPackageForPlan(selectedPlan);

        if (!pkg) {
            Alert.alert(
                'Not Available',
                'Subscription packages are not available yet. Make sure you are running a native build with StoreKit configured.',
            );
            return;
        }

        await purchasePackage(pkg);
    };

    const handleRestore = async () => {
        const isOnline = await checkConnectivityWithAlert({
            customMessage: 'An internet connection is required to restore purchases. Please check your connection and try again.',
            onRetry: handleRestore,
        });
        if (!isOnline) return;

        const restored = await restorePurchases();
        if (restored) {
            Alert.alert(
                'Purchases Restored',
                'Your VividGoals Pro subscription has been restored!',
            );
        } else {
            Alert.alert(
                'No Purchases Found',
                'We couldn\'t find any previous purchases to restore.',
            );
        }
    };

    const renderErrorState = () => {
        if (!error && !isLoading && !annualPackage && !monthlyPackage && currentOffering) {
            return (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={colors.error?.main || '#f44336'} />
                    <Text style={styles.errorTitle}>No Subscription Packages Available</Text>
                    <Text style={styles.errorMessage}>
                        The subscription offerings are empty. Please try again later.
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchOfferings}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={colors.error?.main || '#f44336'} />
                    <Text style={styles.errorTitle}>Subscription Error</Text>
                    <Text style={styles.errorMessage}>
                        We encountered an issue loading subscription options.
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            clearError();
                            fetchOfferings();
                        }}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return null;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="dark" />

            <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
            >
                <Ionicons name="close" size={28} color={colors.text.secondary} />
            </TouchableOpacity>

            <View style={styles.content}>
                {renderErrorState() ? (
                    renderErrorState()
                ) : (
                    <>
                        <View style={styles.illustrationContainer}>
                            <LinearGradient
                                colors={['#fbbf2430', '#f59e0b30']}
                                style={styles.illustrationBg}
                            >
                                <View style={styles.mascotContainer}>
                                    <Ionicons name="time-outline" size={48} color="#f59e0b" />
                                </View>
                            </LinearGradient>
                        </View>

                        <Text style={styles.title}>Your Subscription Has Expired</Text>
                        <Text style={styles.subtitle}>
                            Reactivate to continue using all premium features
                        </Text>

                        <View style={styles.featuresContainer}>
                            {FEATURES.map((feature, index) => (
                                <View key={index} style={styles.featureRow}>
                                    <View style={styles.featureIconContainer}>
                                        <Ionicons
                                            name={feature.icon as any}
                                            size={18}
                                            color={colors.primary.main}
                                        />
                                    </View>
                                    <Text style={styles.featureText}>{feature.text}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.plansContainer}>
                            {annualPackage && (
                                <TouchableOpacity
                                    style={[
                                        styles.planCard,
                                        selectedPlan === 'annual' && styles.planCardSelected,
                                    ]}
                                    onPress={() => setSelectedPlan('annual')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.planContent}>
                                        <Text style={styles.planTitle}>
                                            {formatPriceDisplay(annualPackage, 'annual').title}
                                        </Text>
                                        <Text style={styles.planPrice}>
                                            {formatPriceDisplay(annualPackage, 'annual').price}
                                        </Text>
                                    </View>
                                    {savingsPercentage() && (
                                        <View style={[
                                            styles.planBadge,
                                            selectedPlan === 'annual' && styles.planBadgeSelected,
                                        ]}>
                                            <Text style={[
                                                styles.planBadgeText,
                                                selectedPlan === 'annual' && styles.planBadgeTextSelected,
                                            ]}>SAVE {savingsPercentage()}%</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}

                            {monthlyPackage && (
                                <TouchableOpacity
                                    style={[
                                        styles.planCard,
                                        selectedPlan === 'monthly' && styles.planCardSelected,
                                    ]}
                                    onPress={() => setSelectedPlan('monthly')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.planContent}>
                                        <Text style={styles.planTitle}>
                                            {formatPriceDisplay(monthlyPackage, 'monthly').title}
                                        </Text>
                                        <Text style={styles.planPrice}>
                                            {formatPriceDisplay(monthlyPackage, 'monthly').price}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}

                            {!annualPackage && !monthlyPackage && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color={colors.primary.main} size="small" />
                                    <Text style={styles.loadingText}>Loading subscription options...</Text>
                                </View>
                            )}
                        </View>

                        <View style={{ flex: 1 }} />

                        <TouchableOpacity
                            style={[styles.ctaButton, (isPurchasing || isRestoring) && { opacity: 0.7 }]}
                            onPress={handlePurchase}
                            activeOpacity={0.9}
                            disabled={isPurchasing || isRestoring}
                        >
                            <LinearGradient
                                colors={[colors.primary.main, colors.primary.dark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaButtonGradient}
                            >
                                {isPurchasing ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.ctaButtonText}>Reactivate</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.footerLinks}>
                            <TouchableOpacity onPress={handleRestore}>
                                <Text style={styles.footerLink}>Restore</Text>
                            </TouchableOpacity>
                            <Text style={styles.footerDivider}>•</Text>
                            <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                                <Text style={styles.footerLink}>Terms of Use</Text>
                            </TouchableOpacity>
                            <Text style={styles.footerDivider}>•</Text>
                            <TouchableOpacity onPress={() => Linking.openURL('https://dklochana.github.io/vividgoals-policies/privacy-policy/')}>
                                <Text style={styles.footerLink}>Privacy Policy</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: spacing.md,
        zIndex: 10,
        padding: spacing.xs,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        alignItems: 'center',
    },

    illustrationContainer: {
        marginBottom: spacing.md,
    },
    illustrationBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mascotContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.background.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },

    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },

    featuresContainer: {
        width: '100%',
        marginBottom: spacing.lg,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    featureIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.primary.main + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    featureText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium as any,
        color: colors.text.primary,
        flex: 1,
    },

    plansContainer: {
        width: '100%',
        gap: spacing.md,
    },
    planCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background.primary,
        borderRadius: 18,
        padding: spacing.md + 4,
        borderWidth: 2.5,
        borderColor: colors.neutral[200],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    planCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '08',
        shadowColor: colors.primary.main,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    planContent: {
        flex: 1,
    },
    planTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        marginBottom: 4,
    },
    planPrice: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    planBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: 20,
        backgroundColor: colors.neutral[200],
    },
    planBadgeSelected: {
        backgroundColor: colors.primary.main,
    },
    planBadgeText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.secondary,
        letterSpacing: 0.5,
    },
    planBadgeTextSelected: {
        color: '#fff',
    },

    ctaButton: {
        width: '100%',
        marginBottom: spacing.md,
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    ctaButtonGradient: {
        paddingVertical: spacing.md,
        borderRadius: 14,
        alignItems: 'center',
    },
    ctaButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold as any,
        color: '#fff',
    },

    footerLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    footerLink: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
    },
    footerDivider: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
    },

    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    loadingText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginTop: spacing.sm,
    },

    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
    },
    errorTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    retryButton: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary.main,
        borderRadius: 12,
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    retryButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold as any,
        color: '#fff',
    },
});

export default ExpiredSubscriptionScreen;
