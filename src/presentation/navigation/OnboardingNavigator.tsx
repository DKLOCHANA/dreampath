// src/presentation/navigation/OnboardingNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingStackParamList } from './types';
import {
    WelcomeScreen,
    ProblemScreen,
    SolutionScreen,
    NameScreen,
    AgeScreen,
    YearsScreen,
    BombshellScreen,
    BridgeScreen,
    GoalAreaScreen,
    BlockersScreen,
    TrackingScreen,
    MomentumScreen,
    DailyTimeScreen,
    PayoffScreen,
    MirrorScreen,
    AnalyticsScreen,
    PhoneScreen,
    SecondMirrorScreen,
    ChartScreen,
    Checkin1Screen,
    Checkin2Screen,
    MiniPlanScreen,
    StreakScreen,
    PlanLoadingScreen,
    SummaryScreen,
    CostAnchorScreen,
    CommitmentScreen,
    NotificationsScreen,
} from '@/presentation/screens/onboarding';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: false,
            }}
        >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Problem" component={ProblemScreen} />
            <Stack.Screen name="Solution" component={SolutionScreen} />
            <Stack.Screen name="Name" component={NameScreen} />
            <Stack.Screen name="Age" component={AgeScreen} />
            <Stack.Screen name="Years" component={YearsScreen} />
            <Stack.Screen name="Bombshell" component={BombshellScreen} />
            <Stack.Screen name="Bridge" component={BridgeScreen} />
            <Stack.Screen name="GoalArea" component={GoalAreaScreen} />
            <Stack.Screen name="Blockers" component={BlockersScreen} />
            <Stack.Screen name="Tracking" component={TrackingScreen} />
            <Stack.Screen name="Momentum" component={MomentumScreen} />
            <Stack.Screen name="DailyTime" component={DailyTimeScreen} />
            <Stack.Screen name="Payoff" component={PayoffScreen} />
            <Stack.Screen name="Mirror" component={MirrorScreen} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
            <Stack.Screen name="Phone" component={PhoneScreen} />
            <Stack.Screen name="SecondMirror" component={SecondMirrorScreen} />
            <Stack.Screen name="Chart" component={ChartScreen} />
            <Stack.Screen name="Checkin1" component={Checkin1Screen} />
            <Stack.Screen name="Checkin2" component={Checkin2Screen} />
            <Stack.Screen name="MiniPlan" component={MiniPlanScreen} />
            <Stack.Screen name="Streak" component={StreakScreen} />
            <Stack.Screen name="PlanLoading" component={PlanLoadingScreen} />
            <Stack.Screen name="Summary" component={SummaryScreen} />
            <Stack.Screen name="CostAnchor" component={CostAnchorScreen} />
            <Stack.Screen name="Commitment" component={CommitmentScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </Stack.Navigator>
    );
};

export default OnboardingNavigator;
