import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    age: number | null;
    years: number | null;
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
// Used by Bombshell (S7), Analytics (S16), Summary (S26).

export const ageMidpoint = (age: number | null): number => age ?? 30;

export const yearsStuckMidpoint = (years: number | null): number => years ?? 3;

export const dailyMinutesValue = (band: DailyTimeBand | null): number => {
    switch (band) {
        case "10 minutes — I'm slammed": return 10;
        case '20–30 minutes': return 25;
        case 'An hour': return 60;
        case 'More if I see it working': return 90;
        default: return 10;
    }
};

export const dailyMinutesLabel = (band: DailyTimeBand | null): string => {
    if (!band) return '10 min';
    const match = band.match(/\d+[–\d]*/);
    return match ? `${match[0]} min` : '10 min';
};

export const momentumDaysSince = (last: string | null): number => {
    switch (last) {
        case 'This week': return 4;
        case 'This month': return 20;
        case 'This year': return 180;
        case "I honestly can't remember": return 365;
        default: return 30;
    }
};

export const momentumLabel = (last: string | null): string => {
    switch (last) {
        case 'This week': return 'days';
        case 'This month': return 'days';
        case 'This year': return 'days';
        case "I honestly can't remember": return 'days+';
        default: return 'days';
    }
};
