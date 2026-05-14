// src/presentation/components/onboarding/SectionLabel.tsx
import React from 'react';
import { Text, StyleSheet, View, TextStyle, StyleProp } from 'react-native';

import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';

type Variant = 'plain' | 'pill';

interface SectionLabelProps {
    children: string;
    variant?: Variant;
    dark?: boolean;
    style?: StyleProp<TextStyle>;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
    children,
    variant = 'plain',
    dark = false,
    style,
}) => {
    const text = (
        <Text
            style={[
                styles.text,
                dark ? styles.textDark : styles.textLight,
                variant === 'pill' && styles.pillText,
                style,
            ]}
        >
            {children}
        </Text>
    );

    if (variant === 'pill') {
        return (
            <View
                style={[
                    styles.pill,
                    dark ? styles.pillDark : styles.pillLight,
                ]}
            >
                {text}
            </View>
        );
    }

    return text;
};

const styles = StyleSheet.create({
    text: {
        ...typography.variants.labelSmall,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    textLight: {
        color: colors.primary.main,
    },
    textDark: {
        color: colors.accent.light,
    },
    pill: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md - 4,
        paddingVertical: 5,
        borderRadius: spacing.borderRadius.full,
    },
    pillLight: {
        backgroundColor: colors.primary.background,
    },
    pillDark: {
        backgroundColor: 'rgba(168, 85, 247, 0.18)',
    },
    pillText: {
        fontSize: 11,
        letterSpacing: 1,
    },
});

export default SectionLabel;
