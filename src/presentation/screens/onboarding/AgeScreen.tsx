// src/presentation/screens/onboarding/AgeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    OnboardingLayout,
    OnboardingButton,
    OptionChip,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import {
    AgeBand,
    useOnboardingStore,
} from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Age'>;

const AGE_OPTIONS: AgeBand[] = ['18–24', '25–34', '35–44', '45–54', '55+'];

export const AgeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const name = useOnboardingStore((s) => s.name);
    const age = useOnboardingStore((s) => s.age);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <OnboardingLayout
            step={5}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Continue"
                    onPress={() => navigation.navigate('Years')}
                    disabled={!age}
                />
            }
        >
            <View style={styles.body}>
                <Text style={styles.headline}>
                    Nice to meet you, {name || 'friend'}.{'\n'}How old are you?
                </Text>
                <Text style={styles.sub}>The math we're about to do depends on this.</Text>
                <View style={styles.list}>
                    {AGE_OPTIONS.map((option) => (
                        <OptionChip
                            key={option}
                            label={option}
                            active={age === option}
                            onPress={() => setAnswer('age', option)}
                        />
                    ))}
                </View>
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
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.5,
        marginBottom: spacing.sm,
    },
    sub: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        marginBottom: spacing.lg,
    },
    list: {
        gap: spacing.sm + 2,
    },
});

export default AgeScreen;
