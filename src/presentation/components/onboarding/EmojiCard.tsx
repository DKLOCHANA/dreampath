// src/presentation/components/onboarding/EmojiCard.tsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';

interface EmojiCardProps {
    label: string;
    emoji: string;
    active?: boolean;
    onPress: () => void;
}

export const EmojiCard: React.FC<EmojiCardProps> = ({
    label,
    emoji,
    active = false,
    onPress,
}) => {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.base,
                active && styles.active,
                pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
        >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    base: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md - 2,
        borderRadius: spacing.borderRadius.xl,
        borderWidth: 2,
        borderColor: colors.border.light,
        backgroundColor: colors.background.primary,
    },
    active: {
        borderColor: colors.accent.main,
        backgroundColor: colors.primary.background,
    },
    pressed: {
        opacity: 0.9,
    },
    emoji: {
        fontSize: 38,
    },
    label: {
        ...typography.variants.label,
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.primary,
    },
    labelActive: {
        color: colors.primary.dark,
    },
});

export default EmojiCard;
