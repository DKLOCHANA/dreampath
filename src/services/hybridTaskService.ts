// src/services/hybridTaskService.ts
// Hybrid task generation service - combines AI weekly patterns with programmatic expansion
// This approach minimizes API calls while ensuring at least 1 task per day

import { Goal, GoalCategory } from '@/domain/entities/Goal';
import { Task, TaskStatus, TaskPriority, TaskDifficulty } from '@/domain/entities/Task';
import { GoalWizardData } from '@/presentation/components/goal/GoalWizard';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface WeeklyPattern {
    weekNumber: number;
    theme: string;
    phase: 'foundation' | 'building' | 'mastery';
    weekdayTasks: TaskTemplate[];
    weekendTasks: TaskTemplate[];
    difficultyLevel: number; // 1-10, increases over time
}

export interface TaskTemplate {
    title: string;
    description: string;
    duration: number; // minutes
    priority: TaskPriority;
    difficulty: TaskDifficulty;
    category: string;
    tips?: string;
}

export interface GeneratedWeeklyPatterns {
    patterns: WeeklyPattern[];
    planSummary: string;
    motivationalMessage: string;
    successProbability: number;
    totalWeeks: number;
}

export interface BatchMetadata {
    goalId: string;
    totalDays: number;
    generatedUpToDay: number;
    lastGenerationDate: Date;
    patternsUsed: number;
    nextBatchTriggerDay: number;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

// Maximum weeks to generate patterns for in a single API call
const MAX_PATTERN_WEEKS = 12;

// Days per batch when generating tasks
const BATCH_SIZE_DAYS = 14;

// Trigger next batch generation when this % of current batch is complete
const BATCH_COMPLETION_THRESHOLD = 0.7;

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate tasks using the hybrid approach:
 * 1. Get AI-generated weekly patterns (single API call)
 * 2. Expand patterns to daily tasks programmatically
 * 
 * This ensures at least 1 task per day while staying within API quotas
 */
export async function generateHybridTasks(
    goal: Goal,
    wizardData: GoalWizardData,
    weeklyPatterns: GeneratedWeeklyPatterns,
    startDay: number = 0,
    daysToGenerate?: number
): Promise<{ tasks: Task[]; batchMetadata: BatchMetadata }> {
    const totalDays = calculateDaysBetween(goal.startDate, goal.targetDate);
    const actualDaysToGenerate = daysToGenerate || Math.min(totalDays - startDay, BATCH_SIZE_DAYS);
    
    console.log('[HybridTaskService] Generating tasks:', {
        totalDays,
        startDay,
        daysToGenerate: actualDaysToGenerate,
        patterns: weeklyPatterns.patterns.length,
    });

    const tasks: Task[] = [];
    const dailyHours = parseInt(wizardData.dailyHours) || 2;
    const dailyMinutes = dailyHours * 60;

    for (let dayOffset = 0; dayOffset < actualDaysToGenerate; dayOffset++) {
        const absoluteDay = startDay + dayOffset;
        if (absoluteDay >= totalDays) break;

        const date = addDays(goal.startDate, absoluteDay);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const weekIndex = Math.floor(absoluteDay / 7);
        
        // Select the appropriate weekly pattern (cycle through available patterns)
        const patternIndex = weekIndex % weeklyPatterns.patterns.length;
        const pattern = weeklyPatterns.patterns[patternIndex];
        
        // Get task templates for this day type
        const templates = isWeekend ? pattern.weekendTasks : pattern.weekdayTasks;
        
        // Calculate progression multiplier (tasks get slightly more intense over time)
        const progressRatio = absoluteDay / totalDays;
        const intensityMultiplier = 1 + (progressRatio * 0.3);
        
        // Generate tasks for this day
        let dailyMinutesUsed = 0;
        
        templates.forEach((template, taskIndex) => {
            // Adjust duration based on progression
            const adjustedDuration = Math.min(
                Math.round(template.duration * intensityMultiplier),
                dailyMinutes - dailyMinutesUsed
            );
            
            if (adjustedDuration <= 0) return;
            
            const task = createTaskFromTemplate(
                template,
                goal,
                date,
                absoluteDay,
                taskIndex,
                pattern,
                adjustedDuration
            );
            
            tasks.push(task);
            dailyMinutesUsed += adjustedDuration;
        });
        
        // Ensure at least one task per day
        if (tasks.filter(t => isSameDay(t.scheduledDate, date)).length === 0) {
            const fallbackTask = createFallbackTask(goal, date, absoluteDay, pattern);
            tasks.push(fallbackTask);
        }
    }

    const batchMetadata: BatchMetadata = {
        goalId: goal.id,
        totalDays,
        generatedUpToDay: startDay + actualDaysToGenerate,
        lastGenerationDate: new Date(),
        patternsUsed: weeklyPatterns.patterns.length,
        nextBatchTriggerDay: Math.floor((startDay + actualDaysToGenerate) * BATCH_COMPLETION_THRESHOLD),
    };

    console.log('[HybridTaskService] Generated', tasks.length, 'tasks for', actualDaysToGenerate, 'days');
    
    return { tasks, batchMetadata };
}

/**
 * Check if we need to generate more tasks for a goal
 */
export function shouldGenerateMoreTasks(
    batchMetadata: BatchMetadata,
    completedTaskCount: number,
    totalTasksInBatch: number
): boolean {
    const completionRatio = completedTaskCount / Math.max(totalTasksInBatch, 1);
    const hasMoreDays = batchMetadata.generatedUpToDay < batchMetadata.totalDays;
    
    return completionRatio >= BATCH_COMPLETION_THRESHOLD && hasMoreDays;
}

/**
 * Generate the next batch of tasks when user is making progress
 */
export async function generateNextBatch(
    goal: Goal,
    wizardData: GoalWizardData,
    weeklyPatterns: GeneratedWeeklyPatterns,
    currentMetadata: BatchMetadata
): Promise<{ tasks: Task[]; batchMetadata: BatchMetadata }> {
    console.log('[HybridTaskService] Generating next batch from day', currentMetadata.generatedUpToDay);
    
    return generateHybridTasks(
        goal,
        wizardData,
        weeklyPatterns,
        currentMetadata.generatedUpToDay,
        BATCH_SIZE_DAYS
    );
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE GENERATION FALLBACK
// ═══════════════════════════════════════════════════════════════

/**
 * Generate default weekly patterns when AI is unavailable
 * Uses goal category and user preferences to create reasonable patterns
 */
export function generateDefaultPatterns(
    goal: Goal,
    wizardData: GoalWizardData,
    totalWeeks: number
): GeneratedWeeklyPatterns {
    const patterns: WeeklyPattern[] = [];
    const categoryTemplates = getCategoryTemplates(goal.category);
    const dailyHours = parseInt(wizardData.dailyHours) || 2;
    
    // Generate patterns for each phase
    const phaseDuration = Math.ceil(totalWeeks / 3);
    
    for (let week = 1; week <= Math.min(totalWeeks, MAX_PATTERN_WEEKS); week++) {
        const phase = week <= phaseDuration 
            ? 'foundation' 
            : week <= phaseDuration * 2 
                ? 'building' 
                : 'mastery';
        
        patterns.push({
            weekNumber: week,
            theme: getWeekTheme(goal.category, phase, week),
            phase,
            weekdayTasks: generateDayTemplates(categoryTemplates, phase, dailyHours, false),
            weekendTasks: generateDayTemplates(categoryTemplates, phase, dailyHours, true),
            difficultyLevel: Math.min(Math.ceil(week / phaseDuration) * 3, 10),
        });
    }

    return {
        patterns,
        planSummary: `${totalWeeks}-week plan to achieve: ${goal.title}`,
        motivationalMessage: getMotivationalMessage(goal.category),
        successProbability: 0.75,
        totalWeeks,
    };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function createTaskFromTemplate(
    template: TaskTemplate,
    goal: Goal,
    date: Date,
    dayIndex: number,
    taskIndex: number,
    pattern: WeeklyPattern,
    adjustedDuration: number
): Task {
    // Add variation to task titles to avoid repetition
    const variationPrefix = getVariationPrefix(dayIndex, pattern.phase);
    const title = taskIndex === 0 
        ? template.title 
        : `${variationPrefix}: ${template.title}`;

    return {
        id: `task_${goal.id}_d${dayIndex}_t${taskIndex}_${Date.now()}`,
        goalId: goal.id,
        userId: goal.userId,
        milestoneId: `phase_${pattern.phase}`,
        title,
        description: template.description,
        status: 'PENDING' as TaskStatus,
        priority: template.priority,
        difficulty: template.difficulty,
        estimatedMinutes: adjustedDuration,
        scheduledDate: date,
        isAiGenerated: true,
        aiReasoning: template.tips || `Part of ${pattern.theme} (Week ${pattern.weekNumber})`,
        isRecurring: false,
        order: dayIndex * 10 + taskIndex,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

function createFallbackTask(
    goal: Goal,
    date: Date,
    dayIndex: number,
    pattern: WeeklyPattern
): Task {
    const fallbackTitles = [
        'Review progress and plan',
        'Quick practice session',
        'Reflect on learnings',
        'Plan for tomorrow',
        'Mini milestone check',
    ];

    return {
        id: `task_${goal.id}_d${dayIndex}_fallback_${Date.now()}`,
        goalId: goal.id,
        userId: goal.userId,
        milestoneId: `phase_${pattern.phase}`,
        title: fallbackTitles[dayIndex % fallbackTitles.length],
        description: `Stay on track with your ${goal.title} goal`,
        status: 'PENDING' as TaskStatus,
        priority: 'MEDIUM',
        difficulty: 'EASY',
        estimatedMinutes: 15,
        scheduledDate: date,
        isAiGenerated: true,
        aiReasoning: 'Daily check-in to maintain momentum',
        isRecurring: false,
        order: dayIndex * 10,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

function getVariationPrefix(dayIndex: number, phase: string): string {
    const foundationPrefixes = ['Learn', 'Explore', 'Start', 'Understand', 'Practice basics of'];
    const buildingPrefixes = ['Practice', 'Apply', 'Develop', 'Work on', 'Strengthen'];
    const masteryPrefixes = ['Master', 'Perfect', 'Refine', 'Complete', 'Finalize'];

    const prefixes = phase === 'foundation' 
        ? foundationPrefixes 
        : phase === 'building' 
            ? buildingPrefixes 
            : masteryPrefixes;

    return prefixes[dayIndex % prefixes.length];
}

function getCategoryTemplates(category: GoalCategory): TaskTemplate[] {
    const templates: Record<GoalCategory, TaskTemplate[]> = {
        CAREER: [
            { title: 'Skill development session', description: 'Focus on key professional skills', duration: 45, priority: 'HIGH', difficulty: 'MEDIUM', category: 'learning' },
            { title: 'Network and connect', description: 'Reach out to professional contacts', duration: 20, priority: 'MEDIUM', difficulty: 'EASY', category: 'networking' },
            { title: 'Industry research', description: 'Stay updated with industry trends', duration: 30, priority: 'MEDIUM', difficulty: 'EASY', category: 'research' },
        ],
        FINANCIAL: [
            { title: 'Budget review', description: 'Track and analyze spending', duration: 20, priority: 'HIGH', difficulty: 'EASY', category: 'tracking' },
            { title: 'Savings action', description: 'Transfer or allocate funds', duration: 15, priority: 'HIGH', difficulty: 'EASY', category: 'action' },
            { title: 'Financial education', description: 'Learn about investments/savings', duration: 30, priority: 'MEDIUM', difficulty: 'MEDIUM', category: 'learning' },
        ],
        HEALTH: [
            { title: 'Workout session', description: 'Complete your fitness routine', duration: 45, priority: 'HIGH', difficulty: 'MEDIUM', category: 'exercise' },
            { title: 'Meal planning', description: 'Plan healthy meals', duration: 20, priority: 'MEDIUM', difficulty: 'EASY', category: 'nutrition' },
            { title: 'Wellness check', description: 'Track health metrics and habits', duration: 10, priority: 'MEDIUM', difficulty: 'EASY', category: 'tracking' },
        ],
        EDUCATION: [
            { title: 'Study session', description: 'Deep focus learning time', duration: 60, priority: 'HIGH', difficulty: 'MEDIUM', category: 'learning' },
            { title: 'Practice exercises', description: 'Apply what you learned', duration: 30, priority: 'HIGH', difficulty: 'MEDIUM', category: 'practice' },
            { title: 'Review and note-taking', description: 'Consolidate knowledge', duration: 20, priority: 'MEDIUM', difficulty: 'EASY', category: 'review' },
        ],
        PERSONAL: [
            { title: 'Personal development', description: 'Work on self-improvement', duration: 30, priority: 'MEDIUM', difficulty: 'MEDIUM', category: 'growth' },
            { title: 'Mindfulness practice', description: 'Meditation or reflection', duration: 15, priority: 'MEDIUM', difficulty: 'EASY', category: 'wellness' },
            { title: 'Creative time', description: 'Pursue hobbies and interests', duration: 45, priority: 'LOW', difficulty: 'EASY', category: 'hobby' },
        ],
        RELATIONSHIP: [
            { title: 'Quality time', description: 'Connect with loved ones', duration: 30, priority: 'HIGH', difficulty: 'EASY', category: 'connection' },
            { title: 'Communication practice', description: 'Reach out and check in', duration: 15, priority: 'MEDIUM', difficulty: 'EASY', category: 'communication' },
            { title: 'Plan activities', description: 'Organize social events', duration: 20, priority: 'MEDIUM', difficulty: 'EASY', category: 'planning' },
        ],
        OTHER: [
            { title: 'Focus session', description: 'Work on your main objective', duration: 45, priority: 'HIGH', difficulty: 'MEDIUM', category: 'main' },
            { title: 'Review progress', description: 'Check milestones and adjust', duration: 15, priority: 'MEDIUM', difficulty: 'EASY', category: 'review' },
            { title: 'Research and learn', description: 'Gather information and insights', duration: 30, priority: 'MEDIUM', difficulty: 'EASY', category: 'research' },
        ],
    };

    return templates[category] || templates.OTHER;
}

function generateDayTemplates(
    categoryTemplates: TaskTemplate[],
    phase: string,
    dailyHours: number,
    isWeekend: boolean
): TaskTemplate[] {
    // Weekends have fewer/lighter tasks
    const maxTasksPerDay = isWeekend ? 2 : 3;
    const availableMinutes = dailyHours * 60 * (isWeekend ? 0.6 : 1);
    
    const templates: TaskTemplate[] = [];
    let usedMinutes = 0;
    
    for (let i = 0; i < Math.min(maxTasksPerDay, categoryTemplates.length); i++) {
        const template = categoryTemplates[i];
        if (usedMinutes + template.duration <= availableMinutes) {
            templates.push({
                ...template,
                // Adjust difficulty based on phase
                difficulty: adjustDifficultyForPhase(template.difficulty, phase),
            });
            usedMinutes += template.duration;
        }
    }
    
    return templates;
}

function adjustDifficultyForPhase(baseDifficulty: TaskDifficulty, phase: string): TaskDifficulty {
    if (phase === 'foundation') return 'EASY';
    if (phase === 'building') return baseDifficulty;
    return baseDifficulty === 'EASY' ? 'MEDIUM' : baseDifficulty;
}

function getWeekTheme(category: GoalCategory, phase: string, weekNumber: number): string {
    const phaseThemes: Record<string, string[]> = {
        foundation: ['Building Foundation', 'Getting Started', 'Learning Basics', 'Setting Up'],
        building: ['Making Progress', 'Building Momentum', 'Developing Skills', 'Growing Stronger'],
        mastery: ['Reaching Excellence', 'Mastering Skills', 'Final Push', 'Achievement Phase'],
    };
    
    const themes = phaseThemes[phase] || phaseThemes.foundation;
    return `${themes[weekNumber % themes.length]} - Week ${weekNumber}`;
}

function getMotivationalMessage(category: GoalCategory): string {
    const messages: Record<GoalCategory, string> = {
        CAREER: "Your career journey is mapped out! Take it one step at a time.",
        FINANCIAL: "Financial freedom awaits! Every small action builds wealth.",
        HEALTH: "Your health transformation begins now! Consistency is key.",
        EDUCATION: "Knowledge is power! Your learning journey is ready.",
        PERSONAL: "Personal growth is a daily practice. You've got this!",
        RELATIONSHIP: "Strong relationships are built one moment at a time.",
        OTHER: "Your goal is achievable! Follow your personalized plan.",
    };
    
    return messages[category] || messages.OTHER;
}

// ═══════════════════════════════════════════════════════════════
// DATE UTILITIES
// ═══════════════════════════════════════════════════════════════

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function calculateDaysBetween(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

export default {
    generateHybridTasks,
    generateNextBatch,
    generateDefaultPatterns,
    shouldGenerateMoreTasks,
    BATCH_SIZE_DAYS,
    MAX_PATTERN_WEEKS,
};
