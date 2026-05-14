// src/presentation/components/onboarding/OnboardingButton.tsx
import React from 'react';
import {
    Pressable,
    Text,
    StyleSheet,
    View,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { shadows } from '@/presentation/theme/shadows';

interface OnboardingButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    dark?: boolean;
    style?: StyleProp<ViewStyle>;
}

export const OnboardingButton: React.FC<OnboardingButtonProps> = ({
    title,
    onPress,
    disabled = false,
    dark = false,
    style,
}) => {
    if (disabled) {
        return (
            <View
                style={[
                    styles.base,
                    dark ? styles.disabledDark : styles.disabledLight,
                    style,
                ]}
            >
                <Text
                    style={[
                        styles.label,
                        dark ? styles.disabledLabelDark : styles.disabledLabelLight,
                    ]}
                >
                    {title}
                </Text>
            </View>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.base,
                styles.shadow,
                pressed && styles.pressed,
                style,
            ]}
            accessibilityRole="button"
            accessibilityLabel={title}
        >
            <LinearGradient
                colors={[colors.primary.main, colors.accent.main]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <Text style={styles.label}>{title}</Text>
            </LinearGradient>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    base: {
        height: 56,
        borderRadius: spacing.borderRadius.xl,
        overflow: 'hidden',
    },
    shadow: {
        ...shadows.lg,
        shadowColor: colors.primary.main,
        shadowOpacity: 0.35,
    },
    pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.95,
    },
    gradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        ...typography.variants.button,
        fontSize: 17,
        fontWeight: '600',
        color: colors.text.inverse,
        letterSpacing: 0.2,
    },
    disabledLight: {
        backgroundColor: colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledDark: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledLabelLight: {
        color: colors.text.tertiary,
    },
    disabledLabelDark: {
        color: 'rgba(255,255,255,0.4)',
    },
});

export default OnboardingButton;
