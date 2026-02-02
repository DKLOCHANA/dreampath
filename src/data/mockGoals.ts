// src/data/mockGoals.ts
// Hardcoded goals for local testing - Remove when using Firebase/OpenAI

import { Goal, GoalStatus, GoalCategory, GoalMilestone, GoalPriority } from '@/domain/entities/Goal';

export const createMockGoal = (
    userId: string,
    category: GoalCategory,
    title: string,
    description: string
): Goal => {
    const goalId = `goal-${Date.now()}`;
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setMonth(targetDate.getMonth() + 3); // 3 months from now

    const milestones: GoalMilestone[] = getMilestonesForCategory(category, goalId);

    return {
        id: goalId,
        userId,
        title,
        description,
        category,
        status: 'ACTIVE' as GoalStatus,
        priority: 'MEDIUM' as GoalPriority,
        startDate: today,
        targetDate,
        milestones,
        metrics: {
            totalTasks: 5,
            completedTasks: 0,
            currentStreak: 0,
            longestStreak: 0,
            completionPercentage: 0,
        },
        tags: [category.toLowerCase()],
        createdAt: today,
        updatedAt: today,
    };
};

// Store AI insights separately for display (not part of Goal entity)
export const getAIInsightsForGoal = (category: GoalCategory): string[] => {
    return getAIInsightsForCategory(category);
};

const getMilestonesForCategory = (category: GoalCategory, goalId: string): GoalMilestone[] => {
    const today = new Date();
    
    const milestonesMap: Record<GoalCategory, { title: string; description: string }[]> = {
        CAREER: [
            { title: 'Foundation', description: 'Update resume and LinkedIn profile' },
            { title: 'Research', description: 'Identify target companies and roles' },
            { title: 'Network', description: 'Connect with industry professionals' },
            { title: 'Apply', description: 'Submit applications to target positions' },
        ],
        FINANCIAL: [
            { title: 'Assessment', description: 'Review current financial situation' },
            { title: 'Budget', description: 'Create and stick to a monthly budget' },
            { title: 'Save', description: 'Reach 25% of savings goal' },
            { title: 'Grow', description: 'Start investing or growing wealth' },
        ],
        HEALTH: [
            { title: 'Start', description: 'Establish daily exercise routine' },
            { title: 'Build', description: 'Increase workout intensity/duration' },
            { title: 'Sustain', description: 'Maintain consistency for 30 days' },
            { title: 'Transform', description: 'Achieve measurable health improvement' },
        ],
        EDUCATION: [
            { title: 'Plan', description: 'Outline learning curriculum' },
            { title: 'Learn', description: 'Complete first module/course section' },
            { title: 'Practice', description: 'Apply knowledge through projects' },
            { title: 'Master', description: 'Demonstrate proficiency' },
        ],
        PERSONAL: [
            { title: 'Reflect', description: 'Identify areas for growth' },
            { title: 'Commit', description: 'Establish daily habits' },
            { title: 'Progress', description: 'Track and celebrate small wins' },
            { title: 'Achieve', description: 'Reach personal milestone' },
        ],
        RELATIONSHIP: [
            { title: 'Connect', description: 'Reach out to important people' },
            { title: 'Deepen', description: 'Have meaningful conversations' },
            { title: 'Support', description: 'Be there for others consistently' },
            { title: 'Grow', description: 'Strengthen key relationships' },
        ],
        OTHER: [
            { title: 'Plan', description: 'Define clear objectives' },
            { title: 'Execute', description: 'Take consistent action' },
            { title: 'Review', description: 'Assess progress regularly' },
            { title: 'Complete', description: 'Achieve your goal' },
        ],
    };

    const categoryMilestones = milestonesMap[category] || milestonesMap.PERSONAL;

    return categoryMilestones.map((m, index): GoalMilestone => {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + (index + 1) * 21); // Every 3 weeks

        return {
            id: `milestone-${goalId}-${index + 1}`,
            title: m.title,
            description: m.description,
            targetDate,
            isCompleted: false,
            order: index,
        };
    });
};

const getAIInsightsForCategory = (category: GoalCategory): string[] => {
    const insightsMap: Record<GoalCategory, string[]> = {
        CAREER: [
            'Networking accounts for 70% of job placements. Focus on building connections.',
            'Tailor your resume for each application to increase response rates.',
            'Practice the STAR method for behavioral interview questions.',
        ],
        FINANCIAL: [
            'The 50/30/20 rule: 50% needs, 30% wants, 20% savings.',
            'Automating savings removes decision fatigue and ensures consistency.',
            'Track every expense for one month to identify spending patterns.',
        ],
        HEALTH: [
            'Consistency beats intensity. Start with just 10 minutes daily.',
            'Sleep quality directly impacts workout recovery and motivation.',
            'Prepare meals in advance to avoid unhealthy convenience choices.',
        ],
        EDUCATION: [
            'Spaced repetition helps retain information 50% better than cramming.',
            'Teaching others what you learn reinforces your own understanding.',
            'Take breaks every 25-30 minutes for optimal focus (Pomodoro technique).',
        ],
        PERSONAL: [
            'Small daily habits compound into significant life changes.',
            'Morning routines set the tone for productive days.',
            'Journaling helps clarify thoughts and track personal growth.',
        ],
        RELATIONSHIP: [
            'Quality time matters more than quantity. Be fully present.',
            'Active listening strengthens trust and understanding.',
            'Small gestures of appreciation have lasting impact on relationships.',
        ],
        OTHER: [
            'Break down your goal into smaller, manageable steps.',
            'Track your progress daily to stay motivated.',
            'Celebrate small wins along the way.',
        ],
    };

    return insightsMap[category] || insightsMap.PERSONAL;
};

export default { createMockGoal };
