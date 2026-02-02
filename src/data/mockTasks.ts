// src/data/mockTasks.ts
// Hardcoded tasks for local testing - Remove when using Firebase/OpenAI

import { Task, TaskStatus, TaskPriority } from '@/domain/entities/Task';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

export const getMockTasksForGoal = (goalId: string, goalCategory: string): Task[] => {
    const baseTasks: Record<string, Partial<Task>[]> = {
        CAREER: [
            {
                title: 'Update your resume with recent achievements',
                description: 'Add your latest projects, skills, and accomplishments to your resume',
                priority: 'HIGH' as TaskPriority,
                estimatedMinutes: 60,
            },
            {
                title: 'Research 5 companies in your target industry',
                description: 'Look up company culture, job openings, and growth opportunities',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 45,
            },
            {
                title: 'Connect with 3 professionals on LinkedIn',
                description: 'Send personalized connection requests to people in your field',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 20,
            },
            {
                title: 'Complete an online course module',
                description: 'Dedicate time to learning new skills relevant to your career goal',
                priority: 'HIGH' as TaskPriority,
                estimatedMinutes: 30,
            },
            {
                title: 'Practice interview questions',
                description: 'Rehearse common behavioral and technical interview questions',
                priority: 'LOW' as TaskPriority,
                estimatedMinutes: 25,
            },
        ],
        FINANCIAL: [
            {
                title: 'Review your monthly expenses',
                description: 'Go through last month\'s spending and categorize expenses',
                priority: 'HIGH' as TaskPriority,
                estimatedMinutes: 30,
            },
            {
                title: 'Set up automatic savings transfer',
                description: 'Configure auto-transfer to your savings account',
                priority: 'HIGH' as TaskPriority,
                estimatedMinutes: 15,
            },
            {
                title: 'Cancel unused subscriptions',
                description: 'Review and cancel services you no longer use',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 20,
            },
            {
                title: 'Research investment options',
                description: 'Learn about index funds, ETFs, or other investment vehicles',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 45,
            },
            {
                title: 'Create a weekly budget tracker',
                description: 'Set up a simple spreadsheet or app to track daily spending',
                priority: 'LOW' as TaskPriority,
                estimatedMinutes: 25,
            },
        ],
        HEALTH: [
            {
                title: 'Complete a 30-minute workout',
                description: 'Do cardio, strength training, or yoga session',
                priority: 'HIGH' as TaskPriority,
                estimatedMinutes: 30,
            },
            {
                title: 'Prepare healthy meals for tomorrow',
                description: 'Plan and prep nutritious meals to avoid unhealthy choices',
                priority: 'HIGH' as TaskPriority,
                estimatedMinutes: 45,
            },
            {
                title: 'Drink 8 glasses of water today',
                description: 'Stay hydrated throughout the day',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 5,
            },
            {
                title: 'Take a 15-minute walk',
                description: 'Get some fresh air and light exercise',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 15,
            },
            {
                title: 'Practice 10 minutes of meditation',
                description: 'Use a guided meditation app or sit in silence',
                priority: 'LOW' as TaskPriority,
                estimatedMinutes: 10,
            },
        ],
        EDUCATION: [
            {
                title: 'Study for 1 hour',
                description: 'Focus on your current learning topic without distractions',
                priority: 'HIGH' as TaskPriority,
                estimatedMinutes: 60,
            },
            {
                title: 'Watch an educational video',
                description: 'Find a tutorial or lecture related to your learning goal',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 30,
            },
            {
                title: 'Practice with exercises or quizzes',
                description: 'Apply what you\'ve learned through hands-on practice',
                priority: 'HIGH' as TaskPriority,
                estimatedMinutes: 45,
            },
            {
                title: 'Read a chapter from your textbook',
                description: 'Make notes and highlight key concepts',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 40,
            },
            {
                title: 'Review yesterday\'s notes',
                description: 'Reinforce learning by revisiting previous material',
                priority: 'LOW' as TaskPriority,
                estimatedMinutes: 15,
            },
        ],
        PERSONAL: [
            {
                title: 'Journal for 10 minutes',
                description: 'Write about your thoughts, goals, or gratitude',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 10,
            },
            {
                title: 'Read for 30 minutes',
                description: 'Read a book that inspires or educates you',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 30,
            },
            {
                title: 'Practice a hobby',
                description: 'Spend time on something you enjoy',
                priority: 'LOW' as TaskPriority,
                estimatedMinutes: 45,
            },
            {
                title: 'Declutter one area of your space',
                description: 'Organize a drawer, shelf, or corner of your room',
                priority: 'LOW' as TaskPriority,
                estimatedMinutes: 20,
            },
            {
                title: 'Set 3 priorities for tomorrow',
                description: 'Plan your most important tasks for the next day',
                priority: 'HIGH' as TaskPriority,
                estimatedMinutes: 10,
            },
        ],
        RELATIONSHIP: [
            {
                title: 'Call or message a friend or family member',
                description: 'Reach out to someone you haven\'t talked to recently',
                priority: 'HIGH' as TaskPriority,
                estimatedMinutes: 15,
            },
            {
                title: 'Plan a social activity',
                description: 'Schedule a coffee, dinner, or outing with someone',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 10,
            },
            {
                title: 'Write a thank you note',
                description: 'Express gratitude to someone who helped you',
                priority: 'LOW' as TaskPriority,
                estimatedMinutes: 10,
            },
            {
                title: 'Practice active listening today',
                description: 'Focus fully on conversations without distractions',
                priority: 'MEDIUM' as TaskPriority,
                estimatedMinutes: 30,
            },
            {
                title: 'Do something kind for someone',
                description: 'A small act of kindness can strengthen relationships',
                priority: 'LOW' as TaskPriority,
                estimatedMinutes: 15,
            },
        ],
    };

    const categoryTasks = baseTasks[goalCategory] || baseTasks.PERSONAL;

    return categoryTasks.map((task, index): Task => ({
        id: `task-${goalId}-${index + 1}`,
        userId: 'local-user',
        goalId: goalId,
        title: task.title || '',
        description: task.description || '',
        status: 'PENDING' as TaskStatus,
        priority: task.priority || 'MEDIUM',
        difficulty: 'MEDIUM',
        scheduledDate: index < 2 ? today : index < 4 ? tomorrow : nextWeek,
        estimatedMinutes: task.estimatedMinutes || 30,
        isAiGenerated: true,
        isRecurring: false,
        order: index,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));
};

export const getAllMockTasks = (): Task[] => {
    // Return some default tasks if no goal is set
    return getMockTasksForGoal('default-goal', 'PERSONAL');
};
