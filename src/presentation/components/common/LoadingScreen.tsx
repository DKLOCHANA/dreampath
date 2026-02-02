// src/presentation/components/common/LoadingScreen.tsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';

interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = 'Loading...'
}) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
        padding: spacing.screenPadding,
    },
    message: {
        ...typography.variants.body,
        color: colors.text.secondary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
});

export default LoadingScreen;
