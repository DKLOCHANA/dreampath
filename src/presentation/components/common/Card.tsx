// src/presentation/components/common/Card.tsx
import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
    TouchableOpacityProps,
} from 'react-native';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { shadows } from '@/presentation/theme/shadows';

type CardVariant = 'elevated' | 'outlined' | 'filled';

interface CardProps extends TouchableOpacityProps {
    children: React.ReactNode;
    variant?: CardVariant;
    padding?: 'none' | 'small' | 'medium' | 'large';
    style?: ViewStyle;
    onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'elevated',
    padding = 'medium',
    style,
    onPress,
    ...props
}) => {
    const cardStyles = [
        styles.base,
        styles[variant],
        styles[`${padding}Padding`],
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity
                style={cardStyles}
                onPress={onPress}
                activeOpacity={0.7}
                {...props}
            >
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
    base: {
        borderRadius: spacing.borderRadius.xl,
        overflow: 'hidden',
    },

    // Variants
    elevated: {
        backgroundColor: colors.background.primary,
        ...shadows.md,
    },
    outlined: {
        backgroundColor: colors.background.primary,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    filled: {
        backgroundColor: colors.background.secondary,
    },

    // Padding
    nonePadding: {
        padding: 0,
    },
    smallPadding: {
        padding: spacing.sm,
    },
    mediumPadding: {
        padding: spacing.cardPadding,
    },
    largePadding: {
        padding: spacing.lg,
    },
});

export default Card;
