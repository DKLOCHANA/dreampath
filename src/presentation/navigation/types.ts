// src/presentation/navigation/types.ts

import { NavigatorScreenParams } from '@react-navigation/native';
import { Answer } from '@/presentation/screens/onboarding/onboardingData';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Onboarding Stack
export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  Question: { questionIndex: number };
  Report: { questionIndex: number; selectedAnswer: Answer };
  Report1: { questionIndex: number; selectedAnswer: Answer };
  Report2: { questionIndex: number; selectedAnswer: Answer };
  Report3: { questionIndex: number; selectedAnswer: Answer };
  Report4: { questionIndex: number; selectedAnswer: Answer };
  FinalWelcome: undefined;
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
};

// Main Stack (wraps tabs, includes FirstGoal screen)
export type MainStackParamList = {
  FirstGoal: undefined;
  Tabs: NavigatorScreenParams<MainTabParamList>;
  Paywall: undefined;
  Analytics: undefined;
};

// Declare global types for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
