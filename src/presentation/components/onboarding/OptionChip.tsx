// src/presentation/components/onboarding/OptionChip.tsx
import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';

interface OptionChipProps {
    label: string;
    emoji?: string;
    active?: boolean;
    dark?: boolean;
    onPress: () => void;
}

export const OptionChip: React.FC<OptionChipProps> = ({
    label,
    emoji,
    active = false,
    dark = false,
    onPress,
}) => {
    const containerStyle = [
        styles.base,
        dark ? styles.baseDark : styles.baseLight,
        active && (dark ? styles.activeDark : styles.activeLight),
    ];

    const labelStyle = [
        styles.label,
        dark ? styles.labelDark : styles.labelLight,
    ];

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [...containerStyle, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
        >
            {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
            <Text style={labelStyle} numberOfLines={2}>
                {label}
            </Text>
            {active ? (
                <View style={styles.check}>
                    <Ionicons name="checkmark" size={16} color={colors.accent.main} />
                </View>
            ) : null}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    base: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md - 2,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        borderRadius: spacing.borderRadius.lg + 1,
        borderWidth: 1.5,
    },
    baseLight: {
        backgroundColor: colors.background.primary,
        borderColor: colors.border.light,
    },
    baseDark: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    activeLight: {
        backgroundColor: colors.primary.background,
        borderColor: colors.accent.main,
    },
    activeDark: {
        backgroundColor: 'rgba(168, 85, 247, 0.18)',
        borderColor: colors.accent.main,
    },
    pressed: {
        opacity: 0.85,
    },
    emoji: {
        fontSize: 20,
    },
    label: {
        ...typography.variants.label,
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    labelLight: {
        color: colors.text.primary,
    },
    labelDark: {
        color: colors.text.inverse,
    },
    check: {
        marginLeft: spacing.xs,
    },
});

export default OptionChip;
