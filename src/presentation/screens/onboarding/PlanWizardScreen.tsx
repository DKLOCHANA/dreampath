// src/presentation/screens/onboarding/PlanWizardScreen.tsx
// Real goal-creation flow run BEFORE login. Replaces the demo MiniPlan/
// PlanLoading/Summary screens. The same GoalWizard used post-login powers
// this — answers collected earlier in onboarding (goal area, blockers,
// daily-time band) pre-fill the wizard so the user only fills in what's
// missing. On submit it calls the real AI and caches the plan locally;
// migrateGuestCacheToUser() promotes it to a real goal on auth.

import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { GoalWizard } from '@/presentation/components/goal/GoalWizard';
import { GoalCategory } from '@/domain/entities/Goal';
import { colors } from '@/presentation/theme/colors';
import { useOnboardingStore, DailyTimeBand } from '@/infrastructure/stores/onboardingStore';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'PlanWizard'>;

// ─── Mapping from onboarding answers to wizard defaults ────────────────

const goalAreaToCategory = (area: string | null): GoalCategory | '' => {
    if (!area) return '';
    const a = area.toLowerCase();
    if (a.includes('career')) return 'CAREER';
    if (a.includes('business')) return 'CAREER';
    if (a.includes('health') || a.includes('fitness')) return 'HEALTH';
    if (a.includes('financial')) return 'FINANCIAL';
    if (a.includes('creative')) return 'PERSONAL';
    if (a.includes('learn') || a.includes('study') || a.includes('skill')) return 'EDUCATION';
    if (a.includes('relationships') || a.includes('family')) return 'RELATIONSHIP';
    return 'PERSONAL';
};

const dailyBandToHours = (band: DailyTimeBand | null): string => {
    switch (band) {
        case "10 minutes — I'm slammed": return '1';
        case '20–30 minutes': return '1';
        case 'An hour': return '2';
        case 'More if I see it working': return '3';
        default: return '1';
    }
};

const blockerToChallenge = (blocker: string): string => {
    const b = blocker.toLowerCase();
    if (b.includes("don't know where to start")) return 'Lack of knowledge';
    if (b.includes('lose steam')) return 'Staying motivated';
    if (b.includes('too busy')) return 'Finding time';
    if (b.includes('doubt')) return 'Fear of failure';
    if (b.includes('plan i make falls apart')) return 'No accountability';
    if (b.includes('distracted')) return 'Procrastination';
    return 'Overwhelmed';
};

// ───────────────────────────────────────────────────────────────────────

export const PlanWizardScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { goalArea, blockers, daily, name, age } = useOnboardingStore();

    const initialCategory = goalAreaToCategory(goalArea);
    const initialDailyHours = dailyBandToHours(daily);
    const initialChallenges = Array.from(new Set(blockers.map(blockerToChallenge)));
    const initialAge = age != null ? String(age) : '';

    const handleComplete = () => {
        // Guest cache is already populated by GoalWizard's save path
        // (localDataService falls back to base keys when no userId is set).
        // Show the generated plan so the user sees the real output before login.
        navigation.navigate('PlanPreview');
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />
            <GoalWizard
                mode="onboarding"
                headerTitle={name ? `Let's build your plan, ${name}` : "Let's build your plan"}
                headerSubtitle="A real AI roadmap tailored to your goal — yours to keep."
                suppressSuccessAlert
                onComplete={handleComplete}
                onClose={handleBack}
                initialCategory={initialCategory}
                initialDailyHours={initialDailyHours}
                initialChallenges={initialChallenges}
                initialAge={initialAge}
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

export default PlanWizardScreen;
