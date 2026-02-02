// src/domain/entities/Goal.ts

export type GoalStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
export type GoalCategory = 'CAREER' | 'HEALTH' | 'FINANCIAL' | 'EDUCATION' | 'PERSONAL' | 'RELATIONSHIP' | 'OTHER';
export type GoalPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GoalMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedAt?: Date;
  isCompleted: boolean;
  order: number;
}

export interface GoalMetrics {
  totalTasks: number;
  completedTasks: number;
  currentStreak: number;
  longestStreak: number;
  completionPercentage: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  
  // AI Generated
  aiGeneratedPlan?: string;
  aiSuggestedMilestones?: GoalMilestone[];
  aiConfidenceScore?: number;
  
  // Dates
  startDate: Date;
  targetDate: Date;
  completedAt?: Date;
  
  // Metrics
  metrics: GoalMetrics;
  
  // Milestones
  milestones: GoalMilestone[];
  
  // Metadata
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const createEmptyGoal = (userId: string): Partial<Goal> => ({
  userId,
  status: 'DRAFT',
  priority: 'MEDIUM',
  milestones: [],
  tags: [],
  metrics: {
    totalTasks: 0,
    completedTasks: 0,
    currentStreak: 0,
    longestStreak: 0,
    completionPercentage: 0,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const calculateGoalProgress = (goal: Goal): number => {
  if (goal.metrics.totalTasks === 0) return 0;
  return Math.round((goal.metrics.completedTasks / goal.metrics.totalTasks) * 100);
};
