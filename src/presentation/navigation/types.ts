// src/presentation/navigation/types.ts

import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Onboarding Stack — VividGoals 30-screen flow (Welcome → Social Proof).
// Splash is handled by Expo; Paywall lives downstream in the Main stack.
export type OnboardingStackParamList = {
  Welcome: undefined;
  Problem: undefined;
  Solution: undefined;
  Name: undefined;
  Age: undefined;
  Years: undefined;
  Bombshell: undefined;
  Bridge: undefined;
  GoalArea: undefined;
  Blockers: undefined;
  Tracking: undefined;
  Momentum: undefined;
  DailyTime: undefined;
  Payoff: undefined;
  Mirror: undefined;
  Analytics: undefined;
  Phone: undefined;
  SecondMirror: undefined;
  Chart: undefined;
  Checkin1: undefined;
  Checkin2: undefined;
  PlanWizard: undefined;
  PlanPreview: undefined;
  Streak: undefined;
  CostAnchor: undefined;
  Commitment: undefined;
  TrialReminder: undefined;
  Notifications: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Goals: undefined;
  Tasks: undefined;
  Analytics: undefined;
  Profile: undefined;
};

// Goals Stack
export type GoalsStackParamList = {
  GoalsList: undefined;
  GoalDetail: { goalId: string };
  CreateGoal: undefined;
  EditGoal: { goalId: string };
};

// Tasks Stack
export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { taskId: string };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  HardPaywall: { hard: true } | undefined;
};

// Main Stack (wraps tabs, includes FirstGoal screen)
export type MainStackParamList = {
  FirstGoal: undefined;
  Tabs: NavigatorScreenParams<MainTabParamList>;
  Paywall: { hard?: boolean } | undefined;
  Analytics: undefined;
};

// Declare global types for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
