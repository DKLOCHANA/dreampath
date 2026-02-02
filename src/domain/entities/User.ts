// src/domain/entities/User.ts

export interface UserProfile {
  age: number;
  occupation: string;
  educationLevel: string;
  location?: string;
}

export interface UserFinances {
  monthlyIncome: number;
  monthlySavings: number;
  currency: string;
  financialGoals?: string[];
}

export interface UserTime {
  dailyAvailableHours: number;
  preferredTimeSlots: TimeSlot[];
  busyDays?: string[];
}

export interface TimeSlot {
  start: string; // "09:00"
  end: string; // "17:00"
  days: DayOfWeek[];
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface UserSkills {
  existing: string[];
  learningInterests: string[];
  strengthAreas?: string[];
  improvementAreas?: string[];
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  profile?: UserProfile;
  finances?: UserFinances;
  timeAvailability?: UserTime;
  skills?: UserSkills;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const createEmptyUser = (id: string, email: string, displayName: string): User => ({
  id,
  email,
  displayName,
  onboardingCompleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});
