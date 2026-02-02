// src/presentation/screens/auth/WelcomeScreen.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { AuthStackParamList } from '@/presentation/navigation/types';

type WelcomeNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
    const navigation = useNavigation<WelcomeNavigationProp>();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.content}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="sparkles" size={36} color={colors.text.inverse} />
                    </View>

                    <Text style={styles.title}>Your goals</Text>
                    <Text style={styles.titleHighlight}>Your way</Text>
                    <Text style={styles.subtitle}>
                        Transform your dreams into achievable goals with AI-powered guidance
                    </Text>
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                    <FeatureItem
                        icon="flag"
                        title="Set Clear Goals"
                        description="Define what you want to achieve"
                    />
                    <FeatureItem
                        icon="bulb"
                        title="AI-Powered Plans"
                        description="Get personalized action plans"
                    />
                    <FeatureItem
                        icon="checkmark-done"
                        title="Daily Tasks"
                        description="Small steps lead to big results"
                    />
                </View>

                {/* Buttons */}
                <View style={styles.buttonSection}>
                    <Button
                        title="Get Started"
                        onPress={() => navigation.navigate('Register')}
                        fullWidth
                        size="large"
                    />

                    <Button
                        title="I already have an account"
                        variant="ghost"
                        onPress={() => navigation.navigate('Login')}
                        fullWidth
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

interface FeatureItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
            <Ionicons name={icon} size={24} color={colors.primary.main} />
        </View>
        <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    content: {
        flex: 1,
        padding: spacing.screenPadding,
        justifyContent: 'space-between',
    },

    // Hero
    heroSection: {
        alignItems: 'flex-start',
        paddingTop: spacing['2xl'],
    },
    logoContainer: {
        width: 70,
        height: 70,
        borderRadius: 20,
        backgroundColor: colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    logoEmoji: {
        fontSize: 36,
    },
    title: {
        ...typography.variants.h1,
        color: colors.text.primary,
        fontSize: 42,
        lineHeight: 50,
    },
    titleHighlight: {
        ...typography.variants.h1,
        color: colors.primary.main,
        fontSize: 42,
        lineHeight: 50,
        marginBottom: spacing.md,
    },
    subtitle: {
        ...typography.variants.bodyLarge,
        color: colors.text.secondary,
        lineHeight: 26,
    },

    // Features
    featuresSection: {
        gap: spacing.sm,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        padding: spacing.md,
        borderRadius: spacing.borderRadius.lg,
        gap: spacing.md,
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.primary.light + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureEmoji: {
        fontSize: 24,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        ...typography.variants.labelLarge,
        color: colors.text.primary,
        marginBottom: 2,
    },
    featureDescription: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
    },

    // Buttons
    buttonSection: {
        gap: spacing.sm,
        paddingBottom: spacing.lg,
    },
});

export default WelcomeScreen;
