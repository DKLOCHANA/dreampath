// src/infrastructure/stores/goalsStore.ts
import { create } from 'zustand';
import { Goal, GoalStatus } from '@/domain/entities/Goal';

interface GoalsState {
  goals: Goal[];
  activeGoal: Goal | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  removeGoal: (goalId: string) => void;
  setActiveGoal: (goal: Goal | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearGoals: () => void;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  activeGoal: null,
  isLoading: false,
  error: null,
  
  setGoals: (goals) => set({ goals, isLoading: false, error: null }),
  
  addGoal: (goal) => set((state) => ({ 
    goals: [goal, ...state.goals],
    error: null,
  })),
  
  updateGoal: (updatedGoal) => set((state) => ({
    goals: state.goals.map((g) => 
      g.id === updatedGoal.id ? { ...updatedGoal, updatedAt: new Date() } : g
    ),
    activeGoal: state.activeGoal?.id === updatedGoal.id 
      ? { ...updatedGoal, updatedAt: new Date() }
      : state.activeGoal,
    error: null,
  })),
  
  removeGoal: (goalId) => set((state) => ({
    goals: state.goals.filter((g) => g.id !== goalId),
    activeGoal: state.activeGoal?.id === goalId ? null : state.activeGoal,
  })),
  
  setActiveGoal: (goal) => set({ activeGoal: goal }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  clearGoals: () => set({ goals: [], activeGoal: null, error: null }),
}));

// Selectors
export const useActiveGoals = () => useGoalsStore(
  (state) => state.goals.filter((g) => g.status === 'ACTIVE')
);

export const useGoalsByStatus = (status: GoalStatus) => useGoalsStore(
  (state) => state.goals.filter((g) => g.status === status)
);

export const useGoalById = (id: string) => useGoalsStore(
  (state) => state.goals.find((g) => g.id === id)
);

export const useGoalsCount = () => useGoalsStore(
  (state) => ({
    total: state.goals.length,
    active: state.goals.filter((g) => g.status === 'ACTIVE').length,
    completed: state.goals.filter((g) => g.status === 'COMPLETED').length,
  })
);
