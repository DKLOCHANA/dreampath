// src/presentation/screens/onboarding/NameScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    OnboardingLayout,
    OnboardingButton,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { useOnboardingStore } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Name'>;

export const NameScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const storedName = useOnboardingStore((s) => s.name);
    const setAnswer = useOnboardingStore((s) => s.setAnswer);
    const [value, setValue] = useState<string>(storedName);

    const isValid = value.trim().length > 0;

    const handleContinue = () => {
        setAnswer('name', value.trim());
        navigation.navigate('Age');
    };

    return (
        <OnboardingLayout
            step={4}
            onBack={() => navigation.goBack()}
            footer={
                <OnboardingButton
                    title="Continue"
                    onPress={handleContinue}
                    disabled={!isValid}
                />
            }
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.body}
            >
                <Text style={styles.headline}>First — what should we call you?</Text>
                <Text style={styles.sub}>We'll use this to make your plan personal.</Text>

                <TextInput
                    value={value}
                    onChangeText={setValue}
                    placeholder="Your first name"
                    placeholderTextColor={colors.text.tertiary}
                    autoFocus
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={() => isValid && handleContinue()}
                    style={[
                        styles.input,
                        { borderColor: value ? colors.primary.main : colors.border.light },
                    ]}
                />

                <Text style={styles.hint}>🔒 Stored on your device.</Text>
            </KeyboardAvoidingView>
        </OnboardingLayout>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        paddingTop: spacing.lg,
    },
    headline: {
        ...typography.variants.h2,
        fontSize: 32,
        lineHeight: 38,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.5,
        marginBottom: spacing.sm,
    },
    sub: {
        ...typography.variants.body,
        color: colors.text.secondary,
        marginBottom: spacing.xl - 2,
    },
    input: {
        width: '100%',
        paddingHorizontal: spacing.md + 2,
        paddingVertical: spacing.md + 2,
        borderRadius: spacing.borderRadius.lg + 2,
        borderWidth: 1.5,
        backgroundColor: colors.background.primary,
        color: colors.text.primary,
        fontSize: 20,
        fontWeight: '600',
    },
    hint: {
        ...typography.variants.caption,
        marginTop: spacing.md - 2,
        color: colors.text.tertiary,
    },
});

export default NameScreen;
