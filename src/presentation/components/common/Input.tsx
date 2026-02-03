// src/presentation/components/common/Input.tsx
import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
    required?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    containerStyle,
    required = false,
    secureTextEntry,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    const inputContainerStyles: ViewStyle[] = [
        styles.inputContainer,
        isFocused ? styles.inputFocused : {},
        error ? styles.inputError : {},
        props.editable === false ? styles.inputDisabled : {},
    ];

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>
                        {label}
                        {required && <Text style={styles.required}> *</Text>}
                    </Text>
                </View>
            )}

            <View style={inputContainerStyles}>
                {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

                <TextInput
                    style={[
                        styles.input,
                        leftIcon ? styles.inputWithLeftIcon : null,
                        (rightIcon || secureTextEntry) ? styles.inputWithRightIcon : null,
                    ]}
                    placeholderTextColor={colors.text.tertiary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isSecure}
                    {...props}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.iconRight}
                        onPress={() => setIsSecure(!isSecure)}
                    >
                        <Text style={styles.toggleText}>
                            {isSecure ? 'Show' : 'Hide'}
                        </Text>
                    </TouchableOpacity>
                )}

                {rightIcon && !secureTextEntry && (
                    <View style={styles.iconRight}>{rightIcon}</View>
                )}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
            {hint && !error && <Text style={styles.hint}>{hint}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },

    labelContainer: {
        flexDirection: 'row',
        marginBottom: spacing.xs,
    },

    label: {
        ...typography.variants.label,
        color: colors.text.primary,
    },

    required: {
        color: colors.error.main,
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.light,
        borderRadius: spacing.borderRadius.lg,
        minHeight: 56,
    },

    inputFocused: {
        borderColor: colors.primary.main,
        backgroundColor: colors.background.primary,
    },

    inputError: {
        borderColor: colors.error.main,
    },

    inputDisabled: {
        backgroundColor: colors.neutral[100],
        opacity: 0.7,
    },

    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '400' as const,
        color: colors.text.primary,
        paddingHorizontal: spacing.inputPaddingHorizontal,
        paddingVertical: spacing.inputPaddingVertical,
        includeFontPadding: true,
    },

    inputWithLeftIcon: {
        paddingLeft: spacing.xs,
    },

    inputWithRightIcon: {
        paddingRight: spacing.xs,
    },

    iconLeft: {
        paddingLeft: spacing.inputPaddingHorizontal,
    },

    iconRight: {
        paddingRight: spacing.inputPaddingHorizontal,
    },

    toggleText: {
        ...typography.variants.labelSmall,
        color: colors.primary.main,
    },

    error: {
        ...typography.variants.caption,
        color: colors.error.main,
        marginTop: spacing.xs,
    },

    hint: {
        ...typography.variants.caption,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
});

export default Input;
