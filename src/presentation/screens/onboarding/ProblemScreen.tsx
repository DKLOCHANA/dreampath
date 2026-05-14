// src/presentation/screens/onboarding/ProblemScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Problem'>;

const BACKGROUND: readonly [string, string] = [
    colors.background.dark,
    colors.background.darkSecondary,
];

export const ProblemScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <OnboardingLayout
            dark
            step={2}
            background={BACKGROUND}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton title="That's me" onPress={() => navigation.navigate('Solution')} />
            }
        >
            <View style={styles.body}>
                <SectionLabel dark>THE TRUTH</SectionLabel>
                <Text style={styles.headline}>
                    Ever feel like your biggest dream keeps slipping into{' '}
                    <Text style={styles.accent}>"someday"?</Text>
                </Text>
                <Text style={styles.sub}>
                    You're not lazy. You're not unmotivated.{'\n'}
                    You just don't have a system.
                </Text>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        justifyContent: 'center',
        gap: spacing.lg,
    },
    headline: {
        ...typography.variants.h1,
        fontSize: 34,
        lineHeight: 40,
        fontWeight: '800',
        color: colors.text.inverse,
        letterSpacing: -0.6,
    },
    accent: {
        color: colors.accent.main,
    },
    sub: {
        ...typography.variants.bodyLarge,
        fontSize: 17,
        lineHeight: 26,
        color: 'rgba(255,255,255,0.65)',
    },
});

export default ProblemScreen;
