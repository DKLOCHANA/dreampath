// src/presentation/components/onboarding/OnboardingLayout.tsx
import React from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ScrollView,
    ScrollViewProps,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';

export const TOTAL_ONBOARDING_STEPS = 28;

interface TopBarProps {
    step?: number;
    onBack?: () => void;
    dark?: boolean;
    hide?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ step, onBack, dark = false, hide }) => {
    if (hide) return <View style={styles.topBarSpacer} />;

    const progress = step ? Math.max(0.02, step / TOTAL_ONBOARDING_STEPS) : 0;
    const trackColor = dark ? 'rgba(255,255,255,0.08)' : colors.background.tertiary;

    return (
        <View style={styles.topBar}>
            {onBack && (
                <Pressable
                    onPress={onBack}
                    style={[
                        styles.backBtn,
                        { backgroundColor: trackColor },
                    ]}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons
                        name="chevron-back"
                        size={20}
                        color={dark ? colors.text.inverse : colors.text.primary}
                    />
                </Pressable>
            )}
            <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
                <LinearGradient
                    colors={[colors.primary.main, colors.accent.main]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
            </View>
        </View>
    );
};

interface OnboardingLayoutProps {
    step?: number;
    onBack?: () => void;
    dark?: boolean;
    hideTopBar?: boolean;
    background?: readonly [string, string, ...string[]];
    /** Footer content (typically the primary button). Rendered at the bottom. */
    footer?: React.ReactNode;
    /** When true, body content scrolls. Default false (fixed height). */
    scrollable?: boolean;
    scrollProps?: ScrollViewProps;
    contentContainerStyle?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
    step,
    onBack,
    dark = false,
    hideTopBar = false,
    background,
    footer,
    scrollable = false,
    scrollProps,
    contentContainerStyle,
    children,
}) => {
    const containerBg = dark ? colors.background.dark : colors.background.primary;

    const inner = (
        <>
            <SafeAreaView edges={['top']} style={styles.topSafeArea}>
                <TopBar step={step} onBack={onBack} dark={dark} hide={hideTopBar} />
            </SafeAreaView>

            {scrollable ? (
                <ScrollView
                    style={styles.body}
                    contentContainerStyle={[styles.bodyContent, contentContainerStyle]}
                    showsVerticalScrollIndicator={false}
                    {...scrollProps}
                >
                    {children}
                </ScrollView>
            ) : (
                <View style={[styles.body, styles.bodyContent, contentContainerStyle]}>
                    {children}
                </View>
            )}

            {footer && (
                <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
                    <View style={styles.footer}>{footer}</View>
                </SafeAreaView>
            )}
        </>
    );

    return (
        <View style={[styles.container, { backgroundColor: containerBg }]}>
            <StatusBar style={dark ? 'light' : 'dark'} />
            {background ? (
                <LinearGradient colors={background} style={StyleSheet.absoluteFill} />
            ) : null}
            {inner}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topSafeArea: {
        backgroundColor: 'transparent',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.screenPadding,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    topBarSpacer: {
        height: spacing.md,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressTrack: {
        flex: 1,
        height: 6,
        borderRadius: spacing.borderRadius.full,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: spacing.borderRadius.full,
    },
    body: {
        flex: 1,
    },
    bodyContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        flexGrow: 1,
    },
    footerSafeArea: {
        backgroundColor: 'transparent',
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
});

export default OnboardingLayout;
