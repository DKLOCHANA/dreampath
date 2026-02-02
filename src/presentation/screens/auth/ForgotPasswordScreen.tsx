// src/presentation/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { Button, Input } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { AuthStackParamList } from '@/presentation/navigation/types';
import { resetPassword } from '@/infrastructure/firebase/authService';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<ForgotPasswordNavigationProp>();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string>();

    const validateEmail = (): boolean => {
        if (!email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email');
            return false;
        }
        setError(undefined);
        return true;
    };

    const handleResetPassword = async () => {
        if (!validateEmail()) return;

        setLoading(true);
        try {
            await resetPassword(email.trim());
            setSent(true);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />

                <View style={styles.content}>
                    <View style={styles.successContainer}>
                        <Text style={styles.successEmoji}>📧</Text>
                        <Text style={styles.successTitle}>Check Your Email</Text>
                        <Text style={styles.successMessage}>
                            We've sent password reset instructions to {email}
                        </Text>
                    </View>

                    <View style={styles.buttonSection}>
                        <Button
                            title="Back to Login"
                            onPress={() => navigation.navigate('Login')}
                            fullWidth
                            size="large"
                        />

                        <TouchableOpacity
                            onPress={() => {
                                setSent(false);
                                setEmail('');
                            }}
                            style={styles.resendButton}
                        >
                            <Text style={styles.resendText}>Didn't receive it? Try again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>

                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>
                            Enter your email and we'll send you instructions to reset your password
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (error) setError(undefined);
                            }}
                            error={error}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    </View>

                    {/* Button */}
                    <View style={styles.buttonSection}>
                        <Button
                            title="Send Reset Link"
                            onPress={handleResetPassword}
                            loading={loading}
                            fullWidth
                            size="large"
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: spacing.screenPadding,
    },

    // Header
    header: {
        marginBottom: spacing.xl,
    },
    backButton: {
        marginBottom: spacing.lg,
    },
    backText: {
        ...typography.variants.label,
        color: colors.primary.main,
    },
    title: {
        ...typography.variants.h2,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.variants.body,
        color: colors.text.secondary,
    },

    // Form
    form: {
        flex: 1,
    },

    // Button
    buttonSection: {
        gap: spacing.md,
    },

    // Success State
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successEmoji: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    successTitle: {
        ...typography.variants.h3,
        color: colors.text.primary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    successMessage: {
        ...typography.variants.body,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
    resendButton: {
        alignItems: 'center',
    },
    resendText: {
        ...typography.variants.label,
        color: colors.primary.main,
    },
});

export default ForgotPasswordScreen;
