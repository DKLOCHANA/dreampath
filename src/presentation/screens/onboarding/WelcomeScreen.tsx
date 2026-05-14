// src/presentation/screens/onboarding/WelcomeScreen.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import {
    OnboardingLayout,
    OnboardingButton,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { shadows } from '@/presentation/theme/shadows';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;

const BRAND_NAME = 'VividGoals';
const BACKGROUND: readonly [string, string] = [
    colors.primary.dark,
    colors.background.dark,
];

export const WelcomeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <OnboardingLayout
            dark
            hideTopBar
            background={BACKGROUND}
            footer={
                <OnboardingButton title="Continue" onPress={() => navigation.navigate('Problem')} />
            }
        >
            <View style={styles.content}>
                <LinearGradient
                    colors={[colors.primary.main, colors.accent.main]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoFrame}
                >
                    <Image
                        source={require('../../../../assets/icon.png')}
                        style={styles.logo}
                    />
                </LinearGradient>

                <Text style={styles.hero}>Hey.</Text>
                <Text style={styles.subtitle}>
                    Welcome to <Text style={styles.brand}>{BRAND_NAME}</Text>.{'\n'}
                    Let's make the dream real.
                </Text>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    logoFrame: {
        width: 132,
        height: 132,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
        ...shadows.xl,
        shadowColor: colors.primary.main,
    },
    logo: {
        width: 110,
        height: 110,
        borderRadius: 28,
    },
    hero: {
        fontSize: 64,
        fontWeight: '800',
        letterSpacing: -1.5,
        color: colors.text.inverse,
    },
    subtitle: {
        ...typography.variants.bodyLarge,
        fontSize: 19,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 28,
        maxWidth: 300,
    },
    brand: {
        color: colors.text.inverse,
        fontWeight: '700',
    },
});

export default WelcomeScreen;
