// src/presentation/screens/onboarding/AgeScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Animated,
    Keyboard,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    OnboardingLayout,
    OnboardingButton,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Age'>;

const sanitize = (raw: string) => raw.replace(/[^0-9]/g, '').slice(0, 3);

export const AgeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const name = useOnboardingStore((s) => s.name);
    const storedAge = useOnboardingStore((s) => s.age);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);
    const insets = useSafeAreaInsets();

    const [value, setValue] = useState<string>(
        storedAge != null ? String(storedAge) : '',
    );

    // Animates the footer up when the keyboard opens, back down when it closes.
    // Using keyboard listeners directly is more reliable than KeyboardAvoidingView
    // when nested inside a layout component (offset calculation is unpredictable).
    const footerBottom = useRef(new Animated.Value(insets.bottom)).current;

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onShow = Keyboard.addListener(showEvent, (e) => {
            Animated.timing(footerBottom, {
                toValue: e.endCoordinates.height + spacing.md,
                duration: Platform.OS === 'ios' ? e.duration : 250,
                useNativeDriver: false,
            }).start();
        });

        const onHide = Keyboard.addListener(hideEvent, () => {
            Animated.timing(footerBottom, {
                toValue: insets.bottom,
                duration: 250,
                useNativeDriver: false,
            }).start();
        });

        return () => {
            onShow.remove();
            onHide.remove();
        };
    }, []);

    const parsed = parseInt(value, 10);
    const isValid = !Number.isNaN(parsed) && parsed >= 13;

    const handleContinue = () => {
        setAnswer('age', parsed);
        navigation.navigate('Years');
    };

    return (
        <OnboardingLayout
            step={5}
            onBack={() => navigation.goBack()}
        >
            <View style={styles.body}>
                <View style={styles.content}>
                    <Text style={styles.headline}>
                        Nice to meet you, {name || 'friend'}.{'\n'}How old are you?
                    </Text>
                    <Text style={styles.sub}>The math we're about to do depends on this.</Text>

                    <TextInput
                        value={value}
                        onChangeText={(t) => setValue(sanitize(t))}
                        placeholder="e.g. 28"
                        placeholderTextColor={colors.text.tertiary}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        maxLength={3}
                        autoFocus
                        style={[
                            styles.input,
                            { borderColor: value ? colors.primary.main : colors.border.light },
                        ]}
                    />

                    <Text style={styles.hint}>
                        {value && !isValid
                            ? 'Must be 13 or older.'
                            : "Just a number — we won't store anything else."}
                    </Text>
                </View>

                <Animated.View style={[styles.footer, { bottom: footerBottom }]}>
                    <OnboardingButton
                        title="Continue"
                        onPress={handleContinue}
                        disabled={!isValid}
                    />
                </Animated.View>
            </View>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingTop: spacing.md,
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        paddingTop: spacing.sm,
    },
    headline: {
        ...typography.variants.h2,
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.5,
        marginBottom: spacing.sm,
    },
    sub: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        marginBottom: spacing.lg,
    },
    input: {
        width: '100%',
        paddingHorizontal: spacing.md + 2,
        paddingVertical: spacing.md + 2,
        borderRadius: spacing.borderRadius.lg + 2,
        borderWidth: 1.5,
        backgroundColor: colors.background.primary,
        color: colors.text.primary,
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 2,
    },
    hint: {
        ...typography.variants.caption,
        marginTop: spacing.md - 2,
        color: colors.text.tertiary,
        textAlign: 'center',
    },
});

export default AgeScreen;
