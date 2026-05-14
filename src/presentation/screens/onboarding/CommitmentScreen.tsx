// src/presentation/screens/onboarding/CommitmentScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import {
    OnboardingLayout,
    OnboardingButton,
    SectionLabel,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import {
    CommitmentLevel,
    useOnboardingStore,
} from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Commitment'>;

interface CommitOption {
    value: CommitmentLevel;
    sub: string;
    emoji: string;
}

const OPTIONS: CommitOption[] = [
    { value: 'Extremely committed', sub: "I'm done waiting", emoji: '🔥' },
    { value: 'Very committed', sub: 'This is the year', emoji: '💪' },
    { value: 'Pretty committed', sub: "I'll give it a real try", emoji: '🤝' },
    { value: 'Just exploring', sub: "Let's see how it feels", emoji: '👀' },
];

const RESPONSES: Record<CommitmentLevel, string> = {
    'Extremely committed': 'Then we move fast. Your plan starts now.',
    'Very committed': 'Good. Decisiveness is the difference.',
    'Pretty committed': 'Trying is the whole game. Show up — we handle the rest.',
    'Just exploring': "Fair. Try us free for a week — we'll do the convincing.",
};

export const CommitmentScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const name = useOnboardingStore((s) => s.name);
    const commit = useOnboardingStore((s) => s.commit);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);

    return (
        <OnboardingLayout
            step={27}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Continue"
                    onPress={() => navigation.navigate('Notifications')}
                    disabled={!commit}
                />
            }
        >
            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
            >
                <SectionLabel>ONE LAST QUESTION</SectionLabel>
                <Text style={styles.headline}>
                    {name || 'Friend'} — how committed are you{' '}
                    <Text style={styles.accent}>to making this happen?</Text>
                </Text>

                <View style={styles.list}>
                    {OPTIONS.map((opt) => {
                        const active = commit === opt.value;
                        return (
                            <Pressable
                                key={opt.value}
                                onPress={() => setAnswer('commit', opt.value)}
                                style={({ pressed }) => [
                                    styles.option,
                                    active && styles.optionActive,
                                    pressed && styles.optionPressed,
                                ]}
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                            >
                                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                                <View style={styles.optionText}>
                                    <Text style={styles.optionTitle}>{opt.value}</Text>
                                    <Text style={styles.optionSub}>{opt.sub}</Text>
                                </View>
                                {active ? (
                                    <Ionicons name="checkmark" size={18} color={colors.accent.main} />
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>

                {commit ? (
                    <View style={styles.response}>
                        <Text style={styles.responseText}>
                            <Text style={styles.responseBrand}>VividGoals: </Text>
                            {RESPONSES[commit]}
                        </Text>
                    </View>
                ) : null}
            </ScrollView>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
    },
    bodyContent: {
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg,
    },
    headline: {
        ...typography.variants.h2,
        fontSize: 26,
        lineHeight: 32,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.5,
        marginTop: spacing.xs + 2,
        marginBottom: spacing.lg,
    },
    accent: {
        color: colors.primary.main,
    },
    list: {
        gap: spacing.sm + 2,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md - 2,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        borderRadius: spacing.borderRadius.lg + 2,
        borderWidth: 1.5,
        borderColor: colors.border.light,
        backgroundColor: colors.background.primary,
    },
    optionActive: {
        backgroundColor: colors.primary.background,
        borderColor: colors.accent.main,
    },
    optionPressed: {
        opacity: 0.85,
    },
    optionEmoji: {
        fontSize: 24,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        ...typography.variants.label,
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.primary,
    },
    optionSub: {
        ...typography.variants.bodySmall,
        fontSize: 13,
        color: colors.text.secondary,
        marginTop: 2,
    },
    response: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        backgroundColor: colors.primary.background,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary.main,
        borderRadius: spacing.borderRadius.md + 2,
    },
    responseText: {
        ...typography.variants.bodySmall,
        fontSize: 14,
        color: colors.text.primary,
        fontWeight: '500',
        lineHeight: 21,
    },
    responseBrand: {
        color: colors.primary.main,
        fontWeight: '700',
    },
});

export default CommitmentScreen;
