// src/presentation/screens/onboarding/SecondMirrorScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    OnboardingLayout,
    OnboardingButton,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'SecondMirror'>;

const BACKGROUND: readonly [string, string] = [colors.background.dark, '#170A30'];

export const SecondMirrorScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { name, blockers, analytics1, payoff } = useOnboardingStore();

    const line1 = blockers[0] ?? "I don't know where to start";
    const line2 = analytics1 ?? 'Honestly? Myself.';
    const line3 =
        payoff?.split('—')[1]?.trim() ?? 'I want to prove it to myself';

    return (
        <OnboardingLayout
            dark
            step={18}
            background={BACKGROUND}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Keep going"
                    onPress={() => navigation.navigate('Chart')}
                />
            }
        >
            <View style={styles.body}>
                <Text style={styles.headline}>
                    That's a lot to carry,{' '}
                    <Text style={styles.accent}>{name || 'friend'}.</Text>
                </Text>
                <View style={styles.quote}>
                    <Text style={styles.quoteMark}>"</Text>
                    <Text style={styles.quoteBody}>
                        {line1}. {line2}. And underneath it all — {line3.toLowerCase()}.
                    </Text>
                </View>
                <Text style={styles.footnote}>
                    Most people never even say this part out loud.{' '}
                    <Text style={styles.footnoteBold}>You just did.</Text>
                </Text>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        paddingTop: spacing.lg,
        gap: spacing.lg,
    },
    headline: {
        ...typography.variants.h2,
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '800',
        color: colors.text.inverse,
        letterSpacing: -0.5,
    },
    accent: {
        color: colors.accent.main,
    },
    quote: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.25)',
        borderRadius: spacing.borderRadius.xl + 2,
        paddingHorizontal: spacing.md + 4,
        paddingVertical: spacing.lg,
    },
    quoteMark: {
        fontSize: 32,
        lineHeight: 32,
        color: colors.accent.main,
        fontWeight: '700',
        marginBottom: spacing.xs + 2,
    },
    quoteBody: {
        ...typography.variants.body,
        fontSize: 18,
        lineHeight: 28,
        color: 'rgba(255,255,255,0.92)',
        fontStyle: 'italic',
    },
    footnote: {
        ...typography.variants.body,
        fontSize: 15,
        lineHeight: 22,
        color: 'rgba(255,255,255,0.7)',
    },
    footnoteBold: {
        color: colors.text.inverse,
        fontWeight: '700',
    },
});

export default SecondMirrorScreen;
