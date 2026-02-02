// src/domain/entities/Task.ts

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Task {
  id: string;
  goalId: string;
  userId: string;
  milestoneId?: string;
  
  // Task Details
  title: string;
  description: string;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  
  // Time
  scheduledDate: Date;
  estimatedMinutes: number;
  actualMinutes?: number;
  completedAt?: Date;
  
  // AI Generated
  isAiGenerated: boolean;
  aiReasoning?: string;
  
  // Recurrence
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  
  // Metadata
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurrencePattern {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  endDate?: Date;
}

export interface DailyTaskSummary {
  date: Date;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  skippedTasks: number;
  totalMinutes: number;
  completedMinutes: number;
}

export const createTask = (
  goalId: string,
  userId: string,
  title: string,
  scheduledDate: Date
): Partial<Task> => ({
  goalId,
  userId,
  title,
  status: 'PENDING',
  priority: 'MEDIUM',
  difficulty: 'MEDIUM',
  scheduledDate,
  estimatedMinutes: 30,
  isAiGenerated: false,
  isRecurring: false,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const isTaskOverdue = (task: Task): boolean => {
  if (task.status === 'COMPLETED' || task.status === 'SKIPPED') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(task.scheduledDate);
  taskDate.setHours(0, 0, 0, 0);
  return taskDate < today;
};
