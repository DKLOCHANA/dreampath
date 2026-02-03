// src/presentation/screens/main/PaywallScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PlanType = 'lifetime' | 'monthly';

const FEATURES = [
    { icon: 'sparkles', text: 'Unlimited AI Goal Breakdowns' },
    { icon: 'analytics', text: 'Advanced Analytics & Insights' },
    { icon: 'color-palette', text: 'Custom Themes & Dark Mode' },
    { icon: 'cloud-upload', text: 'Cloud Sync & Backup' },
];

export const PaywallScreen: React.FC = () => {
    const navigation = useNavigation();
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');

    const handlePurchase = () => {
        if (selectedPlan === 'lifetime') {
            Alert.alert(
                'Lifetime Plan',
                'You selected the Lifetime Plan for US$39.99 one-time payment.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Purchase', onPress: () => console.log('Purchase lifetime') },
                ]
            );
        } else {
            Alert.alert(
                'Start Free Trial',
                'Start your 3-day free trial. After trial ends, you will be charged US$7.99/month.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Start Trial', onPress: () => console.log('Start trial') },
                ]
            );
        }
    };

    const handleRestore = () => {
        Alert.alert('Restore Purchases', 'Checking for previous purchases...', [{ text: 'OK' }]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="dark" />

            {/* Close Button */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="close" size={28} color={colors.text.secondary} />
            </TouchableOpacity>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Mascot / Illustration */}
                <View style={styles.illustrationContainer}>
                    <LinearGradient
                        colors={[colors.primary.light + '30', colors.accent.light + '30']}
                        style={styles.illustrationBg}
                    >
                        <View style={styles.mascotContainer}>
                            <Ionicons name="rocket" size={48} color={colors.primary.main} />
                        </View>
                    </LinearGradient>
                </View>

                {/* Title */}
                <Text style={styles.title}>Unlock Your Full Potential</Text>

                {/* Features List */}
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

                {/* Plan Options */}
                <View style={styles.plansContainer}>
                    {/* Lifetime Plan */}
                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            selectedPlan === 'lifetime' && styles.planCardSelected,
                        ]}
                        onPress={() => setSelectedPlan('lifetime')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.planContent}>
                            <Text style={styles.planTitle}>Lifetime plan</Text>
                            <Text style={styles.planPrice}>US$39.99 one-time</Text>
                        </View>
                        <View style={[
                            styles.planBadge,
                            selectedPlan === 'lifetime' && styles.planBadgeSelected,
                        ]}>
                            <Text style={[
                                styles.planBadgeText,
                                selectedPlan === 'lifetime' && styles.planBadgeTextSelected,
                            ]}>PAY ONCE</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Monthly Plan with Trial */}
                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            selectedPlan === 'monthly' && styles.planCardSelected,
                        ]}
                        onPress={() => setSelectedPlan('monthly')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.planContent}>
                            <Text style={styles.planTitle}>3-Day Free Trial</Text>
                            <Text style={styles.planPrice}>then US$7.99 per month</Text>
                        </View>
                        <View style={[
                            styles.planBadge,
                            selectedPlan === 'monthly' && styles.planBadgeSelected,
                        ]}>
                            <Text style={[
                                styles.planBadgeText,
                                selectedPlan === 'monthly' && styles.planBadgeTextSelected,
                            ]}>FREE</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Spacer */}
                <View style={{ flex: 1 }} />

                {/* CTA Button */}
                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={handlePurchase}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[colors.primary.main, colors.primary.dark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.ctaButtonGradient}
                    >
                        <Text style={styles.ctaButtonText}>
                            {selectedPlan === 'lifetime'
                                ? 'Get Lifetime Access'
                                : 'Start Free Trial'
                            }
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Footer Links */}
                <View style={styles.footerLinks}>
                    <TouchableOpacity onPress={handleRestore}>
                        <Text style={styles.footerLink}>Restore</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerDivider}>•</Text>
                    <TouchableOpacity onPress={() => Alert.alert('Terms of Use', 'Terms of Use link')}>
                        <Text style={styles.footerLink}>Terms of Use</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerDivider}>•</Text>
                    <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'Privacy Policy link')}>
                        <Text style={styles.footerLink}>Privacy Policy</Text>
                    </TouchableOpacity>
                </View>
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

    // Illustration
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
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },

    // Title
    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },

    // Features
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

    // Plans
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

    // CTA Button
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

    // Footer
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
});

export default PaywallScreen;
