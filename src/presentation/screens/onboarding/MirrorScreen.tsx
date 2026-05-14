// src/presentation/screens/onboarding/MirrorScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    OnboardingLayout,
    OnboardingButton,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import {
    dailyMinutesLabel,
    useOnboardingStore,
} from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Mirror'>;

const Reveal: React.FC<{ delay: number; children: React.ReactNode }> = ({
    delay,
    children,
}) => {
    const value = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(value, {
            toValue: 1,
            duration: 550,
            delay,
            useNativeDriver: true,
        }).start();
    }, [delay, value]);
    const translateY = value.interpolate({
        inputRange: [0, 1],
        outputRange: [12, 0],
    });
    return (
        <Animated.View style={{ opacity: value, transform: [{ translateY }] }}>
            {children}
        </Animated.View>
    );
};

interface ReflectCardProps {
    title: string;
    body: string;
    emoji: string;
}

const ReflectCard: React.FC<ReflectCardProps> = ({ title, body, emoji }) => (
    <View style={styles.reflectCard}>
        <View style={styles.reflectIcon}>
            <Text style={styles.reflectEmoji}>{emoji}</Text>
        </View>
        <View style={styles.reflectText}>
            <Text style={styles.reflectTitle}>{title}</Text>
            <Text style={styles.reflectBody}>{body}</Text>
        </View>
    </View>
);

export const MirrorScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { name, goalArea, blockers, daily, payoff } = useOnboardingStore();

    const goal = (goalArea ?? 'achieve your goal').split('—')[0].trim().toLowerCase();
    const blocker = (blockers[0] ?? "you don't know where to start").toLowerCase();
    const time = dailyMinutesLabel(daily);
    const payoffWord = (payoff ?? 'Relief').split('—')[0].trim().toLowerCase();

    return (
        <OnboardingLayout
            step={15}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Yes — keep going"
                    onPress={() => navigation.navigate('Analytics')}
                />
            }
        >
            <View style={styles.body}>
                <Text style={styles.headline}>
                    Here's what we heard,{' '}
                    <Text style={styles.accent}>{name || 'friend'}.</Text>
                </Text>
                <View style={styles.cards}>
                    <Reveal delay={300}>
                        <ReflectCard title="YOU WANT TO" body={goal} emoji="🎯" />
                    </Reveal>
                    <Reveal delay={900}>
                        <ReflectCard title="YOU'VE BEEN STUCK BECAUSE" body={blocker} emoji="🔒" />
                    </Reveal>
                    <Reveal delay={1500}>
                        <ReflectCard title="YOU CAN GIVE IT" body={`${time} a day`} emoji="⏱️" />
                    </Reveal>
                    <Reveal delay={2100}>
                        <ReflectCard
                            title="AND WHEN IT'S DONE, YOU'LL FEEL"
                            body={payoffWord}
                            emoji="✨"
                        />
                    </Reveal>
                </View>
                <Reveal delay={2600}>
                    <Text style={styles.confirm}>Sound about right?</Text>
                </Reveal>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        paddingTop: spacing.md,
    },
    headline: {
        ...typography.variants.h2,
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.5,
        marginBottom: spacing.lg,
    },
    accent: {
        color: colors.primary.main,
    },
    cards: {
        gap: spacing.md - 2,
    },
    reflectCard: {
        flexDirection: 'row',
        gap: spacing.md - 2,
        padding: 14,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.lg + 2,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    reflectIcon: {
        width: 36,
        height: 36,
        borderRadius: spacing.borderRadius.md + 2,
        backgroundColor: colors.background.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reflectEmoji: {
        fontSize: 20,
    },
    reflectText: {
        flex: 1,
    },
    reflectTitle: {
        ...typography.variants.labelSmall,
        fontSize: 11,
        fontWeight: '600',
        color: colors.text.tertiary,
        letterSpacing: 0.8,
    },
    reflectBody: {
        ...typography.variants.label,
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: 2,
    },
    confirm: {
        ...typography.variants.body,
        fontSize: 16,
        textAlign: 'center',
        color: colors.text.secondary,
        marginTop: spacing.md,
    },
});

export default MirrorScreen;
