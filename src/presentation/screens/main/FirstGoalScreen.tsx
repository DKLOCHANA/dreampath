// src/presentation/screens/main/FirstGoalScreen.tsx
// Full-screen goal wizard shown when user has no goals
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { GoalWizard, GoalWizardData } from '@/presentation/components/goal/GoalWizard';
import { colors } from '@/presentation/theme/colors';
import { Goal } from '@/domain/entities/Goal';
import { MainStackParamList } from '@/presentation/navigation/types';
import { useIsPro } from '@/infrastructure/stores/subscriptionStore';

type FirstGoalNavigationProp = NativeStackNavigationProp<MainStackParamList, 'FirstGoal'>;

export const FirstGoalScreen: React.FC = () => {
    const navigation = useNavigation<FirstGoalNavigationProp>();
    const isPro = useIsPro();

    const handleComplete = (data: GoalWizardData, goal?: Goal) => {
        console.log('[FirstGoalScreen] Goal created:', goal?.title);

        if (isPro) {
            navigation.replace('Tabs', { screen: 'Home' });
        } else {
            // Navigate to Tabs then immediately present Paywall
            navigation.dispatch(
                CommonActions.reset({
                    index: 1,
                    routes: [
                        { name: 'Tabs', params: { screen: 'Home' } },
                        { name: 'Paywall' },
                    ],
                }),
            );
        }
    };

    const handleSkip = () => {
        navigation.replace('Tabs', { screen: 'Home' });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />
            <GoalWizard
                mode="fullscreen"
                onComplete={handleComplete}
                onSkip={handleSkip}
                totalSteps={5}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
});

export default FirstGoalScreen;
