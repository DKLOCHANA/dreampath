// src/presentation/navigation/types.ts

import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Onboarding Stack
export type OnboardingStackParamList = {
  OnboardingIntro: undefined;
  OnboardingGoal: undefined;
  OnboardingPersonal: undefined;
  OnboardingSkills: undefined;
  OnboardingComplete: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Goals: undefined;
  Tasks: undefined;
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
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Declare global types for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
