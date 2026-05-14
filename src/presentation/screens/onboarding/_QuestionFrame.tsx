// src/presentation/screens/onboarding/_QuestionFrame.tsx
// Internal helper for question-style onboarding screens (Q-bank + analytics).
// Not exported from index — screens import it directly.
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import {
    OnboardingLayout,
    OnboardingButton,
    OptionChip,
    SectionLabel,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';

export type QuestionOption = {
    /** Stored value (string identity used for selection). */
    value: string;
    /** Optional emoji rendered to the left of the label. */
    emoji?: string;
    /** Display label (defaults to value). */
    label?: string;
};

interface QuestionFrameBaseProps {
    step: number;
    label: string;
    title: string;
    sub?: string;
    options: QuestionOption[];
    onBack: () => void;
    onContinue: () => void;
}

interface SingleProps extends QuestionFrameBaseProps {
    multi?: false;
    value: string | null;
    onChange: (value: string) => void;
}

interface MultiProps extends QuestionFrameBaseProps {
    multi: true;
    max?: number;
    value: string[];
    onChange: (value: string[]) => void;
}

export const QuestionFrame: React.FC<SingleProps | MultiProps> = (props) => {
    const {
        step,
        label,
        title,
        sub,
        options,
        onBack,
        onContinue,
    } = props;

    const isActive = (value: string): boolean =>
        props.multi ? props.value.includes(value) : props.value === value;

    const handleSelect = (value: string) => {
        if (props.multi) {
            const max = props.max ?? options.length;
            const exists = props.value.includes(value);
            let next = exists
                ? props.value.filter((v) => v !== value)
                : [...props.value, value];
            if (next.length > max) next = next.slice(next.length - max);
            props.onChange(next);
        } else {
            props.onChange(value);
        }
    };

    const canContinue = props.multi ? props.value.length > 0 : !!props.value;

    return (
        <OnboardingLayout
            step={step}
            onBack={onBack}
            footer={
                <View style={styles.footer}>
                    {props.multi && (
                        <Text style={styles.maxHint}>
                            Pick up to {props.max ?? options.length}
                        </Text>
                    )}
                    <OnboardingButton
                        title="Continue"
                        onPress={onContinue}
                        disabled={!canContinue}
                    />
                </View>
            }
        >
            <View style={styles.header}>
                <SectionLabel>{label}</SectionLabel>
                <Text style={styles.title}>{title}</Text>
                {sub ? <Text style={styles.sub}>{sub}</Text> : null}
            </View>
            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {options.map((opt) => (
                    <OptionChip
                        key={opt.value}
                        label={opt.label ?? opt.value}
                        emoji={opt.emoji}
                        active={isActive(opt.value)}
                        onPress={() => handleSelect(opt.value)}
                    />
                ))}
            </ScrollView>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingBottom: spacing.md,
    },
    title: {
        ...typography.variants.h3,
        fontSize: 26,
        lineHeight: 32,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.4,
        marginTop: spacing.xs + 2,
    },
    sub: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    list: {
        flex: 1,
    },
    listContent: {
        gap: spacing.sm + 1,
        paddingBottom: spacing.lg,
    },
    footer: {
        gap: spacing.sm,
    },
    maxHint: {
        ...typography.variants.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
    },
});

export default QuestionFrame;
