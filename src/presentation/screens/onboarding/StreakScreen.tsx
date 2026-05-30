// src/presentation/screens/onboarding/StreakScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    OnboardingLayout,
    OnboardingButton,
    SectionLabel,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Streak'>;

const BACKGROUND: readonly [string, string] = ['#3A1A6E', colors.background.dark];

export const StreakScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const name = useOnboardingStore((s) => s.name);
    const pulse = useRef(new Animated.Value(0)).current;
    const { width: screenWidth } = useWindowDimensions();

    // Emoji renders crisp up to ~96pt; keep fontSize small, scale container around it
    const emojiFontSize = Math.round(screenWidth * 0.20);
    const glowSize = Math.round(emojiFontSize * 1.8);

    useEffect(() => {
        Animated.loop(
            Animated.timing(pulse, {
                toValue: 1,
                duration: 1800,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ).start();
    }, [pulse]);

    const glowScale = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.85, 1.25],
    });
    const glowOpacity = pulse.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0, 0.55, 0],
    });

    return (
        <OnboardingLayout
            dark
            step={23}
            background={BACKGROUND}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Keep going"
                    onPress={() => navigation.navigate('CostAnchor')}
                />
            }
        >
            <View style={styles.body}>
                <SectionLabel dark>YOU JUST STARTED</SectionLabel>

                <View style={[styles.glowWrap, { marginVertical: spacing.xl }]}>
                    <Animated.View
                        style={[
                            styles.glow,
                            {
                                width: glowSize,
                                height: glowSize,
                                borderRadius: glowSize / 2,
                                opacity: glowOpacity,
                                transform: [{ scale: glowScale }],
                            },
                        ]}
                    />
                    <Text style={[styles.flameEmoji, { fontSize: emojiFontSize }]}>
                        🔥
                    </Text>
                </View>

                <Text style={styles.headline}>
                    {name || 'You'}, you just{' '}
                    <Text style={styles.accent}>started.</Text>
                </Text>
                <Text style={styles.sub}>
                    Day 1 of your streak. Come back tomorrow — we'll make it 2.
                </Text>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    glowWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        backgroundColor: colors.streak.glow,
    },
    flameEmoji: {
        textAlign: 'center',
        // No lineHeight — let the system size it naturally so emoji isn't clipped
    },
    headline: {
        ...typography.variants.h2,
        fontWeight: '800',
        color: colors.text.inverse,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    accent: {
        color: colors.streak.main,
    },
    sub: {
        ...typography.variants.body,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        maxWidth: 300,
    },
});

export default StreakScreen;
