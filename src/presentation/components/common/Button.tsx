// src/presentation/components/common/Button.tsx
import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps,
} from 'react-native';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { shadows } from '@/presentation/theme/shadows';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    style,
    ...props
}) => {
    const isDisabled = disabled || loading;

    const buttonStyles = [
        styles.base,
        styles[variant],
        styles[`${size}Size`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        isDisabled && styles[`${variant}Disabled`],
        style as ViewStyle,
    ].filter(Boolean) as ViewStyle[];

    const textStyles = [
        styles.text,
        styles[`${variant}Text`],
        styles[`${size}Text`],
        isDisabled && styles.disabledText,
    ].filter(Boolean) as TextStyle[];

    const loaderColor = variant === 'primary' || variant === 'secondary' || variant === 'danger'
        ? colors.text.inverse
        : colors.primary.main;

    return (
        <TouchableOpacity
            style={buttonStyles}
            disabled={isDisabled}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={loaderColor} size="small" />
            ) : (
                <>
                    {leftIcon}
                    <Text style={textStyles}>{title}</Text>
                    {rightIcon}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: spacing.borderRadius.lg,
        gap: spacing.sm,
        ...shadows.sm,
    },

    // Variants
    primary: {
        backgroundColor: colors.primary.main,
    },
    secondary: {
        backgroundColor: colors.secondary.main,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary.main,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    danger: {
        backgroundColor: colors.error.main,
    },

    // Sizes
    smallSize: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        minHeight: 36,
    },
    mediumSize: {
        paddingVertical: spacing.buttonPaddingVertical,
        paddingHorizontal: spacing.buttonPaddingHorizontal,
        minHeight: 48,
    },
    largeSize: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        minHeight: 56,
    },

    fullWidth: {
        width: '100%',
    },

    // Disabled
    disabled: {
        opacity: 0.5,
    },
    primaryDisabled: {},
    secondaryDisabled: {},
    outlineDisabled: {},
    ghostDisabled: {},
    dangerDisabled: {},

    // Text
    text: {
        ...typography.variants.button,
    },
    primaryText: {
        color: colors.text.inverse,
    },
    secondaryText: {
        color: colors.text.inverse,
    },
    outlineText: {
        color: colors.primary.main,
    },
    ghostText: {
        color: colors.primary.main,
    },
    dangerText: {
        color: colors.text.inverse,
    },

    smallText: {
        ...typography.variants.buttonSmall,
    },
    mediumText: {
        ...typography.variants.button,
    },
    largeText: {
        ...typography.variants.button,
        fontSize: 18,
    },

    disabledText: {
        opacity: 0.7,
    },
});

export default Button;
