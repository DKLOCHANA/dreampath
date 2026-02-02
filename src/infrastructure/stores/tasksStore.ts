// src/infrastructure/stores/tasksStore.ts
import { create } from 'zustand';
import { Task, TaskStatus, DailyTaskSummary } from '@/domain/entities/Task';

interface TasksState {
  tasks: Task[];
  todayTasks: Task[];
  selectedDate: Date;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  setTodayTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  completeTask: (taskId: string) => void;
  skipTask: (taskId: string) => void;
  removeTask: (taskId: string) => void;
  setSelectedDate: (date: Date) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTasks: () => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  todayTasks: [],
  selectedDate: new Date(),
  isLoading: false,
  error: null,
  
  setTasks: (tasks) => set({ tasks, isLoading: false, error: null }),
  
  setTodayTasks: (todayTasks) => set({ todayTasks, isLoading: false }),
  
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task],
    todayTasks: isSameDay(task.scheduledDate, state.selectedDate) 
      ? [...state.todayTasks, task] 
      : state.todayTasks,
  })),
  
  updateTask: (updatedTask) => set((state) => ({
    tasks: state.tasks.map((t) => 
      t.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date() } : t
    ),
    todayTasks: state.todayTasks.map((t) => 
      t.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date() } : t
    ),
  })),
  
  completeTask: (taskId) => set((state) => {
    const now = new Date();
    return {
      tasks: state.tasks.map((t) =>
        t.id === taskId 
          ? { ...t, status: 'COMPLETED' as TaskStatus, completedAt: now, updatedAt: now }
          : t
      ),
      todayTasks: state.todayTasks.map((t) =>
        t.id === taskId 
          ? { ...t, status: 'COMPLETED' as TaskStatus, completedAt: now, updatedAt: now }
          : t
      ),
    };
  }),
  
  skipTask: (taskId) => set((state) => {
    const now = new Date();
    return {
      tasks: state.tasks.map((t) =>
        t.id === taskId 
          ? { ...t, status: 'SKIPPED' as TaskStatus, updatedAt: now }
          : t
      ),
      todayTasks: state.todayTasks.map((t) =>
        t.id === taskId 
          ? { ...t, status: 'SKIPPED' as TaskStatus, updatedAt: now }
          : t
      ),
    };
  }),
  
  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== taskId),
    todayTasks: state.todayTasks.filter((t) => t.id !== taskId),
  })),
  
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  clearTasks: () => set({ tasks: [], todayTasks: [], error: null }),
}));

// Helper
const isSameDay = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// Selectors
export const usePendingTasks = () => useTasksStore(
  (state) => state.todayTasks.filter((t) => t.status === 'PENDING')
);

export const useCompletedTasks = () => useTasksStore(
  (state) => state.todayTasks.filter((t) => t.status === 'COMPLETED')
);

export const useTaskProgress = () => useTasksStore((state) => {
  const total = state.todayTasks.length;
  const completed = state.todayTasks.filter((t) => t.status === 'COMPLETED').length;
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
});

export const useDailyTaskSummary = (): DailyTaskSummary => useTasksStore((state) => {
  const tasks = state.todayTasks;
  return {
    date: state.selectedDate,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === 'COMPLETED').length,
    pendingTasks: tasks.filter((t) => t.status === 'PENDING').length,
    skippedTasks: tasks.filter((t) => t.status === 'SKIPPED').length,
    totalMinutes: tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0),
    completedMinutes: tasks
      .filter((t) => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + (t.actualMinutes || t.estimatedMinutes), 0),
  };
});
