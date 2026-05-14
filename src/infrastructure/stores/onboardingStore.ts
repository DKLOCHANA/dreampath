// src/infrastructure/stores/onboardingStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AgeBand = '18–24' | '25–34' | '35–44' | '45–54' | '55+';
export type YearsBand =
    | 'Less than a year'
    | '1–3 years'
    | '3–5 years'
    | '5+ years'
    | 'I keep restarting';
export type DailyTimeBand =
    | "10 minutes — I'm slammed"
    | '20–30 minutes'
    | 'An hour'
    | 'More if I see it working';
export type CommitmentLevel =
    | 'Extremely committed'
    | 'Very committed'
    | 'Pretty committed'
    | 'Just exploring';

export interface OnboardingAnswers {
    name: string;
    age: AgeBand | null;
    years: YearsBand | null;
    goalArea: string | null;
    blockers: string[];
    tracking: string | null;
    lastMomentum: string | null;
    daily: DailyTimeBand | null;
    payoff: string | null;
    analytics1: string | null;
    phone: string | null;
    checkin1: string | null;
    checkin2: string | null;
    commit: CommitmentLevel | null;
    notificationsAllowed: boolean | null;
}

interface OnboardingState extends OnboardingAnswers {
    setAnswer: <K extends keyof OnboardingAnswers>(
        key: K,
        value: OnboardingAnswers[K],
    ) => void;
    setAnswers: (patch: Partial<OnboardingAnswers>) => void;
    reset: () => void;
}

const initialAnswers: OnboardingAnswers = {
    name: '',
    age: null,
    years: null,
    goalArea: null,
    blockers: [],
    tracking: null,
    lastMomentum: null,
    daily: null,
    payoff: null,
    analytics1: null,
    phone: null,
    checkin1: null,
    checkin2: null,
    commit: null,
    notificationsAllowed: null,
};

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            ...initialAnswers,
            setAnswer: (key, value) => set({ [key]: value } as Partial<OnboardingState>),
            setAnswers: (patch) => set(patch as Partial<OnboardingState>),
            reset: () => set({ ...initialAnswers }),
        }),
        {
            name: 'vividgoals-onboarding',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                name: state.name,
                age: state.age,
                years: state.years,
                goalArea: state.goalArea,
                blockers: state.blockers,
                tracking: state.tracking,
                lastMomentum: state.lastMomentum,
                daily: state.daily,
                payoff: state.payoff,
                analytics1: state.analytics1,
                phone: state.phone,
                checkin1: state.checkin1,
                checkin2: state.checkin2,
                commit: state.commit,
                notificationsAllowed: state.notificationsAllowed,
            }),
        },
    ),
);

// ──────────────────────────── Derivations ────────────────────────────
// Used by Bombshell (S7), Summary (S26), and other math/copy screens.

export const ageMidpoint = (band: AgeBand | null): number => {
    switch (band) {
        case '18–24': return 21;
        case '25–34': return 30;
        case '35–44': return 40;
        case '45–54': return 50;
        case '55+': return 60;
        default: return 30;
    }
};

export const yearsStuckMidpoint = (band: YearsBand | null): number => {
    switch (band) {
        case 'Less than a year': return 1;
        case '1–3 years': return 2;
        case '3–5 years': return 4;
        case '5+ years': return 7;
        case 'I keep restarting': return 5;
        default: return 3;
    }
};

export const dailyMinutesLabel = (band: DailyTimeBand | null): string => {
    if (!band) return '10 min';
    const match = band.match(/\d+[–\d]*/);
    return match ? `${match[0]} min` : '10 min';
};
