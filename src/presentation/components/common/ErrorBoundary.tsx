// src/presentation/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });
        // Log error to your error reporting service here
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.emoji}>😕</Text>
                        <Text style={styles.title}>Oops! Something went wrong</Text>
                        <Text style={styles.message}>
                            The app encountered an unexpected error. Please try again.
                        </Text>

                        {__DEV__ && this.state.error && (
                            <ScrollView style={styles.errorContainer}>
                                <Text style={styles.errorTitle}>Error Details:</Text>
                                <Text style={styles.errorText}>
                                    {this.state.error.toString()}
                                </Text>
                                {this.state.errorInfo && (
                                    <Text style={styles.errorStack}>
                                        {this.state.errorInfo.componentStack}
                                    </Text>
                                )}
                            </ScrollView>
                        )}

                        <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
        padding: spacing.screenPadding,
    },
    content: {
        alignItems: 'center',
        maxWidth: 320,
    },
    emoji: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.variants.h2,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    message: {
        ...typography.variants.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    errorContainer: {
        maxHeight: 200,
        width: '100%',
        backgroundColor: colors.background.secondary,
        borderRadius: 8,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    errorTitle: {
        ...typography.variants.label,
        color: colors.error.main,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    errorText: {
        ...typography.variants.caption,
        color: colors.error.main,
        fontFamily: 'monospace',
    },
    errorStack: {
        ...typography.variants.caption,
        color: colors.text.tertiary,
        fontFamily: 'monospace',
        marginTop: spacing.sm,
        fontSize: 10,
    },
    button: {
        backgroundColor: colors.primary.main,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 12,
        minWidth: 160,
    },
    buttonText: {
        ...typography.variants.button,
        color: colors.text.inverse,
        textAlign: 'center',
    },
});

export default ErrorBoundary;
