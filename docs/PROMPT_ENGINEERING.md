# DreamPath - Prompt Engineering Guide

## AI Prompt Templates for OpenAI Integration

This document contains all prompt templates used in DreamPath for goal analysis, task generation, and plan adjustments. These prompts are optimized for GPT-4/GPT-4-Turbo.

---

## Prompt Design Principles

### 1. Be Specific and Structured

- Use clear sections with headers
- Provide context before asking for output
- Specify exact output format (JSON)

### 2. Include Constraints

- Set boundaries for realistic plans
- Consider user's time, budget, and skills
- Avoid over-ambitious suggestions

### 3. Optimize for Tokens

- Remove unnecessary words
- Use abbreviations where clear
- Batch related requests

### 4. Ensure Consistent Output

- Always request JSON format
- Provide schema examples
- Include validation hints

---

## System Prompts

### Main System Prompt

Used for all AI interactions:

```typescript
// functions/src/prompts/systemPrompt.ts

export const SYSTEM_PROMPT = `You are DreamPath AI, an expert life coach and strategic planner with 20+ years of experience helping people achieve ambitious goals.

YOUR ROLE:
- Analyze goals and create realistic, achievable action plans
- Break down large goals into manageable milestones and daily tasks
- Consider user's unique circumstances (time, money, skills, constraints)
- Be motivating but realistic - never overpromise

YOUR STYLE:
- Clear, actionable language
- Supportive but honest
- Practical over theoretical
- Specific over vague

OUTPUT RULES:
- Always return valid JSON (no markdown, no explanations outside JSON)
- Include all required fields as specified
- Use ISO 8601 date format (YYYY-MM-DD)
- Provide 5-8 milestones for goals > 3 months, 3-5 for shorter goals

CONSTRAINTS TO RESPECT:
- Never suggest more hours than user's stated availability
- Consider financial limitations in recommendations
- Account for user's current skill level
- Factor in existing responsibilities`;
```

---

## Goal Analysis Prompt

### Primary Goal Analysis

Used when user creates a new goal:

```typescript
// functions/src/prompts/goalAnalysis.ts

export interface GoalAnalysisInput {
  title: string;
  description: string;
  category: string;
  targetDate: string;
  personalContext: {
    ageRange: string;
    lifeSituation: string[];
    weeklyHoursAvailable: number;
  };
  financialContext: {
    budgetRange: string;
  };
  skillsContext: {
    experienceLevel: number; // 1-10
    relevantSkills: string[];
  };
  challenges: string[];
  preferences: {
    dailyTaskCount: string;
    motivationStyle: "GENTLE" | "BALANCED" | "INTENSE";
  };
}

export const buildGoalAnalysisPrompt = (input: GoalAnalysisInput): string => {
  const daysUntilTarget = Math.ceil(
    (new Date(input.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return `Analyze this goal and create a comprehensive, personalized action plan.

═══════════════════════════════════════════════════════════════
GOAL INFORMATION
═══════════════════════════════════════════════════════════════
Title: ${input.title}
Description: ${input.description}
Category: ${input.category}
Target Date: ${input.targetDate} (${daysUntilTarget} days from now)

═══════════════════════════════════════════════════════════════
USER CONTEXT
═══════════════════════════════════════════════════════════════
Age Range: ${input.personalContext.ageRange}
Life Situation: ${input.personalContext.lifeSituation.join(", ")}
Weekly Hours Available: ${input.personalContext.weeklyHoursAvailable} hours

Budget: ${input.financialContext.budgetRange}

Experience Level: ${input.skillsContext.experienceLevel}/10
Relevant Skills: ${input.skillsContext.relevantSkills.join(", ") || "None specified"}

Known Challenges: ${input.challenges.join(", ") || "None specified"}

═══════════════════════════════════════════════════════════════
PREFERENCES
═══════════════════════════════════════════════════════════════
Daily Tasks Preferred: ${input.preferences.dailyTaskCount}
Motivation Style: ${input.preferences.motivationStyle}

═══════════════════════════════════════════════════════════════
REQUIRED OUTPUT (JSON)
═══════════════════════════════════════════════════════════════
{
  "planSummary": "2-3 sentence overview of the approach",
  "difficultyScore": <1-10>,
  "difficultyExplanation": "Why this difficulty level",
  "estimatedWeeklyCommitment": "<X hours per week>",
  "keySuccessFactors": ["factor1", "factor2", "factor3"],
  "milestones": [
    {
      "order": 1,
      "title": "Milestone title (action-oriented)",
      "description": "What this milestone achieves",
      "targetDate": "YYYY-MM-DD",
      "keyActivities": ["activity1", "activity2", "activity3"]
    }
  ],
  "risks": [
    {
      "risk": "Potential obstacle",
      "likelihood": "LOW|MEDIUM|HIGH",
      "mitigation": "How to prevent or handle it"
    }
  ],
  "resourceRequirements": {
    "timeInvestment": "X hours per week",
    "financialInvestment": "$X - $Y or 'None required'",
    "toolsNeeded": ["tool1", "tool2"],
    "skillsToDevelop": ["skill1", "skill2"]
  },
  "quickWins": [
    "Something achievable in first week",
    "Another quick win"
  ]
}

IMPORTANT:
- Create ${daysUntilTarget > 90 ? "5-8" : "3-5"} milestones
- Ensure milestones fit within the ${daysUntilTarget} day timeline
- Weekly commitment should not exceed ${input.personalContext.weeklyHoursAvailable} hours
- Consider ${input.financialContext.budgetRange} budget in recommendations
- Adjust for ${input.skillsContext.experienceLevel}/10 experience level`;
};
```

---

## Task Generation Prompts

### Daily Task Generation

Used for generating daily tasks for active goals:

```typescript
// functions/src/prompts/taskGeneration.ts

export interface TaskGenerationInput {
  goal: {
    title: string;
    description: string;
    progress: number;
  };
  currentMilestone: {
    title: string;
    description: string;
    daysRemaining: number;
  };
  recentTasks: {
    title: string;
    completed: boolean;
  }[];
  userPreferences: {
    dailyTaskCount: number;
    motivationStyle: "GENTLE" | "BALANCED" | "INTENSE";
    availableMinutes: number;
  };
  dayOfWeek: string;
}

export const buildTaskGenerationPrompt = (
  input: TaskGenerationInput,
): string => {
  const recentTasksSummary = input.recentTasks
    .map(
      (t) => `- ${t.title}: ${t.completed ? "✓ Completed" : "○ Not completed"}`,
    )
    .join("\n");

  return `Generate today's tasks for this goal.

═══════════════════════════════════════════════════════════════
GOAL CONTEXT
═══════════════════════════════════════════════════════════════
Goal: ${input.goal.title}
Overall Progress: ${input.goal.progress}%

Current Milestone: ${input.currentMilestone.title}
Milestone Details: ${input.currentMilestone.description}
Days Until Milestone: ${input.currentMilestone.daysRemaining}

═══════════════════════════════════════════════════════════════
RECENT ACTIVITY (Last 3 Days)
═══════════════════════════════════════════════════════════════
${recentTasksSummary || "No recent tasks"}

═══════════════════════════════════════════════════════════════
TODAY'S CONTEXT
═══════════════════════════════════════════════════════════════
Day: ${input.dayOfWeek}
Available Time: ${input.userPreferences.availableMinutes} minutes
Tasks Requested: ${input.userPreferences.dailyTaskCount}
Motivation Style: ${input.userPreferences.motivationStyle}

═══════════════════════════════════════════════════════════════
REQUIRED OUTPUT (JSON)
═══════════════════════════════════════════════════════════════
{
  "tasks": [
    {
      "title": "Clear, action-oriented task title",
      "description": "Brief explanation of what to do",
      "estimatedMinutes": <15-60>,
      "priority": <1-4>,
      "category": "LEARNING|ACTION|PLANNING|REVIEW",
      "tips": "Optional helpful tip for this task"
    }
  ],
  "motivationalMessage": "Short encouraging message for today",
  "focusAdvice": "What to prioritize if time is limited"
}

RULES:
- Generate exactly ${input.userPreferences.dailyTaskCount} tasks
- Total time should not exceed ${input.userPreferences.availableMinutes} minutes
- Tasks should build toward the current milestone
- Don't repeat recently completed tasks
- Include variety (don't make all tasks the same type)
- Priority: 4=Critical, 3=High, 2=Medium, 1=Low
- ${input.userPreferences.motivationStyle === "INTENSE" ? "Push for challenging tasks" : input.userPreferences.motivationStyle === "GENTLE" ? "Keep tasks approachable and encouraging" : "Balance challenge with achievability"}`;
};
```

### Weekly Task Batch Generation

More efficient - generate a week's worth of tasks at once:

```typescript
// functions/src/prompts/weeklyTaskGeneration.ts

export const buildWeeklyTaskPrompt = (input: WeeklyTaskInput): string => {
  return `Generate a full week of tasks for this goal.

═══════════════════════════════════════════════════════════════
GOAL: ${input.goal.title}
═══════════════════════════════════════════════════════════════
Current Progress: ${input.goal.progress}%
Current Milestone: ${input.currentMilestone.title}
Days Until Milestone: ${input.currentMilestone.daysRemaining}

User's Weekly Availability:
- Monday: ${input.availability.monday} minutes
- Tuesday: ${input.availability.tuesday} minutes  
- Wednesday: ${input.availability.wednesday} minutes
- Thursday: ${input.availability.thursday} minutes
- Friday: ${input.availability.friday} minutes
- Saturday: ${input.availability.saturday} minutes
- Sunday: ${input.availability.sunday} minutes

Tasks per day preference: ${input.preferences.dailyTaskCount}

═══════════════════════════════════════════════════════════════
REQUIRED OUTPUT (JSON)
═══════════════════════════════════════════════════════════════
{
  "weeklyPlan": {
    "theme": "This week's focus area",
    "expectedProgress": "+X% progress expected"
  },
  "days": {
    "monday": {
      "tasks": [
        {
          "title": "Task title",
          "description": "What to do",
          "estimatedMinutes": 30,
          "priority": 3
        }
      ],
      "dailyTip": "Quick motivation for Monday"
    },
    "tuesday": { ... },
    "wednesday": { ... },
    "thursday": { ... },
    "friday": { ... },
    "saturday": { ... },
    "sunday": { ... }
  },
  "weeklyChallenge": "Optional stretch goal for the week"
}

RULES:
- Respect daily time limits
- Build momentum early in week
- Include lighter tasks on weekends if user has less time
- Create logical progression through the week
- Total tasks per day: ${input.preferences.dailyTaskCount}`;
};
```

---

## Plan Adjustment Prompt

When user reports struggles or wants to modify the plan:

```typescript
// functions/src/prompts/planAdjustment.ts

export interface AdjustmentInput {
  goal: {
    title: string;
    originalPlan: any;
    currentProgress: number;
  };
  feedback: {
    type: "TOO_HARD" | "TOO_EASY" | "NO_TIME" | "CHANGE_APPROACH" | "OBSTACLE";
    details: string;
    missedTasksCount: number;
    completionRate: number;
  };
  remainingDays: number;
}

export const buildPlanAdjustmentPrompt = (input: AdjustmentInput): string => {
  return `User needs plan adjustment. Analyze and provide updated recommendations.

═══════════════════════════════════════════════════════════════
CURRENT SITUATION
═══════════════════════════════════════════════════════════════
Goal: ${input.goal.title}
Current Progress: ${input.goal.currentProgress}%
Days Remaining: ${input.remainingDays}
Recent Completion Rate: ${input.feedback.completionRate}%
Missed Tasks (last 7 days): ${input.feedback.missedTasksCount}

═══════════════════════════════════════════════════════════════
USER FEEDBACK
═══════════════════════════════════════════════════════════════
Issue Type: ${input.feedback.type}
Details: ${input.feedback.details}

═══════════════════════════════════════════════════════════════
REQUIRED OUTPUT (JSON)
═══════════════════════════════════════════════════════════════
{
  "analysis": "1-2 sentence analysis of what's happening",
  "recommendations": [
    {
      "type": "REDUCE_LOAD|EXTEND_TIMELINE|CHANGE_APPROACH|ADD_SUPPORT|SIMPLIFY",
      "suggestion": "Specific recommendation",
      "impact": "How this will help"
    }
  ],
  "adjustedMilestones": [
    {
      "order": 1,
      "title": "Updated milestone",
      "targetDate": "YYYY-MM-DD",
      "changes": "What changed and why"
    }
  ],
  "immediateActions": [
    "Quick win to rebuild momentum",
    "Another immediate action"
  ],
  "encouragement": "Supportive message acknowledging the challenge"
}

IMPORTANT:
- Be realistic about what's achievable in ${input.remainingDays} days
- If goal is at risk, be honest but supportive
- Suggest small wins to rebuild confidence
- ${input.feedback.type === "TOO_HARD" ? "Reduce complexity and time requirements" : ""}
- ${input.feedback.type === "NO_TIME" ? "Suggest fewer but higher-impact tasks" : ""}`;
};
```

---

## Response Parsing

### Safe JSON Parser

Handle AI response parsing with fallbacks:

````typescript
// functions/src/utils/responseParser.ts

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rawResponse?: string;
}

export const parseAIResponse = <T>(
  response: string,
  validator?: (data: any) => boolean,
): ParseResult<T> => {
  try {
    // Clean the response
    let cleaned = response.trim();

    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/^```json\s*/i, "");
    cleaned = cleaned.replace(/^```\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/i, "");

    // Try to extract JSON if there's text before/after
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    // Parse JSON
    const parsed = JSON.parse(cleaned);

    // Validate if validator provided
    if (validator && !validator(parsed)) {
      return {
        success: false,
        error: "Response validation failed",
        rawResponse: response,
      };
    }

    return {
      success: true,
      data: parsed as T,
    };
  } catch (error) {
    return {
      success: false,
      error: `JSON parse error: ${error instanceof Error ? error.message : "Unknown"}`,
      rawResponse: response,
    };
  }
};

// Validators for different response types
export const validators = {
  goalPlan: (data: any): boolean => {
    return (
      typeof data.planSummary === "string" &&
      Array.isArray(data.milestones) &&
      data.milestones.length >= 3 &&
      Array.isArray(data.keySuccessFactors)
    );
  },

  dailyTasks: (data: any): boolean => {
    return (
      Array.isArray(data.tasks) &&
      data.tasks.length > 0 &&
      data.tasks.every(
        (t: any) =>
          typeof t.title === "string" && typeof t.estimatedMinutes === "number",
      )
    );
  },

  planAdjustment: (data: any): boolean => {
    return (
      typeof data.analysis === "string" &&
      Array.isArray(data.recommendations) &&
      Array.isArray(data.adjustedMilestones)
    );
  },
};
````

---

## Token Optimization

### Estimate Token Usage

```typescript
// functions/src/utils/tokenEstimator.ts

// Rough estimation: ~4 characters per token for English text
const CHARS_PER_TOKEN = 4;

export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
};

export const estimateCost = (
  inputTokens: number,
  outputTokens: number,
  model: "gpt-4" | "gpt-4-turbo" | "gpt-3.5-turbo",
): number => {
  const pricing = {
    "gpt-4": { input: 0.03, output: 0.06 },
    "gpt-4-turbo": { input: 0.01, output: 0.03 },
    "gpt-3.5-turbo": { input: 0.001, output: 0.002 },
  };

  const rate = pricing[model];
  return (
    (inputTokens / 1000) * rate.input + (outputTokens / 1000) * rate.output
  );
};

// Log usage for monitoring
export const logAIUsage = async (
  userId: string,
  promptType: string,
  inputTokens: number,
  outputTokens: number,
  cost: number,
): Promise<void> => {
  // Store in Firestore for tracking
  await admin.firestore().collection("aiUsage").add({
    userId,
    promptType,
    inputTokens,
    outputTokens,
    cost,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
};
```

---

## Model Selection Guide

| Use Case          | Recommended Model | Reason                            |
| ----------------- | ----------------- | --------------------------------- |
| Goal Analysis     | GPT-4-Turbo       | Best quality for complex planning |
| Daily Tasks       | GPT-3.5-Turbo     | Sufficient quality, much cheaper  |
| Plan Adjustment   | GPT-4-Turbo       | Needs nuanced understanding       |
| Quick Suggestions | GPT-3.5-Turbo     | Speed and cost                    |

---

## Prompt Testing Checklist

Before deploying new prompts:

- [ ] Test with 10+ different goal types
- [ ] Verify JSON output is always valid
- [ ] Check edge cases (very short/long timelines)
- [ ] Confirm constraints are respected
- [ ] Measure average token usage
- [ ] Calculate cost per call
- [ ] Test with minimal user input
- [ ] Test with maximum user input

---

## Example Responses

### Goal Analysis Response Example

```json
{
  "planSummary": "Launch your SaaS product by building an MVP first, then iterating based on user feedback. Focus on core features that solve the main problem.",
  "difficultyScore": 7,
  "difficultyExplanation": "Building a SaaS requires multiple skills and sustained effort, but your coding background helps significantly.",
  "estimatedWeeklyCommitment": "15-20 hours per week",
  "keySuccessFactors": [
    "Consistent daily progress over perfection",
    "Early user validation before full build",
    "Focus on solving one problem well"
  ],
  "milestones": [
    {
      "order": 1,
      "title": "Define MVP and Validate Idea",
      "description": "Clarify exactly what you're building and confirm market need",
      "targetDate": "2026-02-15",
      "keyActivities": [
        "List 5 core features for MVP",
        "Interview 5 potential users",
        "Create landing page to test interest"
      ]
    }
  ],
  "risks": [
    {
      "risk": "Scope creep - adding too many features",
      "likelihood": "HIGH",
      "mitigation": "Strict MVP feature list, say no to extras until launch"
    }
  ],
  "resourceRequirements": {
    "timeInvestment": "15-20 hours per week",
    "financialInvestment": "$500 - $2000 for hosting, domains, tools",
    "toolsNeeded": [
      "Code editor",
      "Hosting (Vercel/Railway)",
      "Database (Supabase/Firebase)"
    ],
    "skillsToDevelop": ["Marketing basics", "User research"]
  },
  "quickWins": [
    "Set up project repository today",
    "Write one-paragraph product description"
  ]
}
```

---

**Remember**: Great prompts = Great results. Test thoroughly before deploying!
