// src/services/aiPlanService.ts
// Service to call the DreamPath AI API for generating personalized plans

import { Goal, GoalCategory } from '@/domain/entities/Goal';
import { Task, TaskStatus, TaskPriority } from '@/domain/entities/Task';
import { GoalWizardData } from '@/presentation/components/goal/GoalWizard';

// ═══════════════════════════════════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════════════════════════════════

// Vercel deployment URL - Update this after deploying
const API_BASE_URL = 'https://dreampath-api.vercel.app';

// ═══════════════════════════════════════════════════════════════
// REQUEST/RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

interface PlanGenerationRequest {
    goal: {
        title: string;
        description?: string;
        category: GoalCategory;
        priority: 'LOW' | 'MEDIUM' | 'HIGH';
        startDate: string;
        targetDate: string;
    };
    user: {
        id?: string;
        displayName?: string;
        profile?: {
            age?: number;
            occupation?: string;
        };
        finances?: {
            monthlyBudget?: number;
        };
        timeAvailability: {
            dailyAvailableHours: number;
        };
        skills: {
            experienceLevel: 'beginner' | 'intermediate' | 'advanced';
        };
        challenges?: {
            selected: string[];
            custom?: string;
        };
    };
}

interface GeneratedTask {
    title: string;
    description: string;
    estimatedMinutes: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    category: string;
    dayOfWeek: number;
    weekNumber: number;
    tips?: string;
}

interface GeneratedMilestone {
    order: number;
    title: string;
    description: string;
    targetDate: string;
    weekNumber: number;
    keyActivities: string[];
    tasks: GeneratedTask[];
}

interface GeneratedPlan {
    planSummary: string;
    goalTitle: string;
    goalDescription: string;
    difficultyScore: number;
    difficultyExplanation: string;
    totalWeeks: number;
    weeklyHoursRequired: number;
    successProbability: number;
    keySuccessFactors: string[];
    milestones: GeneratedMilestone[];
    risks: Array<{
        risk: string;
        likelihood: string;
        mitigation: string;
    }>;
    quickWins: string[];
    motivationalMessage: string;
}

interface APIResponse {
    success: boolean;
    plan: GeneratedPlan;
    metadata: {
        generatedAt: string;
        daysUntilTarget: number;
        weeksUntilTarget: number;
    };
    usage: {
        totalTokens: number;
        estimatedCost: string;
    };
}

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTION - Generate Plan from ChatGPT
// ═══════════════════════════════════════════════════════════════

export async function generatePlanWithAI(
    goal: Goal,
    wizardData: GoalWizardData,
    userId?: string,
    displayName?: string
): Promise<{ tasks: Task[]; plan: GeneratedPlan }> {
    console.log('[AIService] Generating plan for:', goal.title);

    // Build request body
    const requestBody: PlanGenerationRequest = {
        goal: {
            title: goal.title,
            description: goal.description,
            category: goal.category,
            priority: goal.priority,
            startDate: goal.startDate.toISOString(),
            targetDate: goal.targetDate.toISOString(),
        },
        user: {
            id: userId,
            displayName,
            profile: {
                age: wizardData.age ? parseInt(wizardData.age) : undefined,
                occupation: wizardData.occupation || undefined,
            },
            finances: {
                monthlyBudget: wizardData.monthlyBudget ? parseInt(wizardData.monthlyBudget) : undefined,
            },
            timeAvailability: {
                dailyAvailableHours: parseInt(wizardData.dailyHours) || 2,
            },
            skills: {
                experienceLevel: (wizardData.experienceLevel as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
            },
            challenges: wizardData.challenges.length > 0 ? {
                selected: wizardData.challenges,
                custom: wizardData.customChallenge || undefined,
            } : undefined,
        },
    };

    try {
        console.log('[AIService] Sending request to API...');
        
        // Call the API
        const response = await fetch(`${API_BASE_URL}/api/generate-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AIService] API error response:', errorText);
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || `API error: ${response.status}`);
            } catch {
                throw new Error(`API error: ${response.status}`);
            }
        }

        // Get raw text first to handle JSON parsing errors
        const rawText = await response.text();
        console.log('[AIService] Response received, length:', rawText.length);
        
        let data: APIResponse;
        try {
            data = JSON.parse(rawText);
        } catch (parseError: any) {
            console.error('[AIService] JSON parse error at position:', parseError.message);
            console.error('[AIService] Raw response (first 500 chars):', rawText.substring(0, 500));
            console.error('[AIService] Raw response (last 500 chars):', rawText.substring(rawText.length - 500));
            
            // Try to fix common JSON issues
            const fixedJson = tryFixJson(rawText);
            if (fixedJson) {
                data = fixedJson;
                console.log('[AIService] JSON fixed successfully');
            } else {
                throw new Error('AI response was malformed. Please try again.');
            }
        }

        if (!data.success || !data.plan) {
            throw new Error('Invalid response from AI service');
        }

        console.log('[AIService] Plan generated successfully');
        console.log('[AIService] Milestones:', data.plan.milestones.length);
        
        // Convert generated plan to Task entities
        const tasks = convertPlanToTasks(data.plan, goal.id);
        console.log('[AIService] Tasks created:', tasks.length);

        return { tasks, plan: data.plan };

    } catch (error: any) {
        console.error('[AIService] Error generating plan:', error);
        throw error;
    }
}

// Try to fix common JSON parsing issues
function tryFixJson(rawText: string): APIResponse | null {
    try {
        // Try to find and fix truncated JSON
        let fixed = rawText;
        
        // If JSON is cut off, try to close it properly
        const openBraces = (fixed.match(/{/g) || []).length;
        const closeBraces = (fixed.match(/}/g) || []).length;
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/]/g) || []).length;
        
        // Add missing closing brackets/braces
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
            fixed += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
            fixed += '}';
        }
        
        // Remove trailing comma before closing bracket/brace
        fixed = fixed.replace(/,\s*\]/g, ']');
        fixed = fixed.replace(/,\s*\}/g, '}');
        
        return JSON.parse(fixed);
    } catch {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// CONVERT API RESPONSE TO TASK ENTITIES
// ═══════════════════════════════════════════════════════════════

function convertPlanToTasks(plan: GeneratedPlan, goalId: string): Task[] {
    const tasks: Task[] = [];
    const now = new Date();

    plan.milestones.forEach((milestone, milestoneIndex) => {
        milestone.tasks.forEach((genTask, taskIndex) => {
            // Calculate scheduled date based on week number and day of week
            const scheduledDate = new Date(now);
            scheduledDate.setDate(scheduledDate.getDate() + ((milestone.weekNumber - 1) * 7) + (genTask.dayOfWeek - 1));

            const task: Task = {
                id: `task_${Date.now()}_${milestoneIndex}_${taskIndex}`,
                goalId,
                userId: 'local_user',
                milestoneId: `milestone_${milestone.order}`,
                title: genTask.title,
                description: genTask.description,
                status: 'PENDING' as TaskStatus,
                priority: genTask.priority as TaskPriority,
                difficulty: (genTask.difficulty || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD',
                estimatedMinutes: genTask.estimatedMinutes,
                scheduledDate,
                isAiGenerated: true,
                aiReasoning: genTask.tips,
                isRecurring: false,
                order: (milestoneIndex * 100) + taskIndex,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            tasks.push(task);
        });
    });

    return tasks;
}

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

export async function checkAPIHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();
        return data.status === 'ok';
    } catch (error) {
        console.error('[AIService] Health check failed:', error);
        return false;
    }
}

export default {
    generatePlanWithAI,
    checkAPIHealth,
};
