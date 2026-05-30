// src/presentation/screens/onboarding/WelcomeScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingLayout } from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;

const BACKGROUND: readonly [string, string] = [
    colors.primary.dark,
    colors.background.dark,
];

export const WelcomeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const blink = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(blink, { toValue: 0.15, duration: 600, useNativeDriver: true }),
                Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.delay(800),
            ]),
        ).start();
    }, [blink]);

    const goNext = () => navigation.navigate('Problem');

    return (
        <OnboardingLayout dark hideTopBar background={BACKGROUND}>
            <Pressable style={styles.content} onPress={goNext}>
                <View style={styles.hero}>
                    <Text style={styles.heroText}>Hey.</Text>
                    <Text style={styles.subtitle}>Let's make the{'\n'}dream real.</Text>
                </View>

                <Animated.View style={[styles.tapRow, { opacity: blink }]}>
                    <Text style={styles.tapText}>Tap to continue</Text>
                    <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="rgba(255,255,255,0.5)"
                    />
                </Animated.View>
            </Pressable>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingBottom: spacing.lg,
    },
    hero: {
        flex: 1,
        justifyContent: 'center',
        gap: spacing.sm,
    },
    heroText: {
        fontFamily: typography.fontFamily?.serif,
        fontStyle: 'italic',
        fontSize: 72,
        fontWeight: '700',
        letterSpacing: -1,
        color: colors.text.inverse,
    },
    subtitle: {
        ...typography.variants.bodyLarge,
        fontSize: 28,
        fontWeight: '300',
        color: 'rgba(255,255,255,0.65)',
        lineHeight: 36,
        letterSpacing: -0.5,
    },
    tapRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: spacing.xs,
    },
    tapText: {
        ...typography.variants.label,
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
    },
});

export default WelcomeScreen;
