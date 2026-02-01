# DreamPath - Development Guide

## Complete Step-by-Step Implementation Guide

This guide provides detailed instructions for implementing the DreamPath app using **Expo** and **Firebase**.

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ (comes with Node.js)
- Xcode 15+ (for iOS development)
- Apple Developer Account (for TestFlight/App Store)
- Firebase Account
- OpenAI API Account
- Expo Account (free at expo.dev)

---

## Phase 1: Project Setup & Foundation

### Step 1.1: Initialize Expo Project

```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Create new Expo project with TypeScript
npx create-expo-app@latest DreamPath --template expo-template-blank-typescript

# Navigate to project
cd DreamPath

# Verify setup
npm start
```

### Step 1.2: Install Core Dependencies

```bash
# Navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler

# State Management (Simple & Performant)
npm install zustand
npm install @tanstack/react-query
npx expo install @react-native-async-storage/async-storage

# Firebase (Expo Compatible)
npm install firebase

# Forms & Validation (Type-safe)
npm install react-hook-form zod @hookform/resolvers

# UI Components
npm install react-native-paper
npx expo install react-native-vector-icons
npx expo install react-native-svg
npx expo install expo-linear-gradient

# Animations
npx expo install react-native-reanimated

# Date handling
npm install date-fns

# Charts (Lightweight)
npm install react-native-chart-kit

# Utilities
npm install uuid
npm install lodash

# TypeScript types
npm install -D @types/lodash @types/uuid @types/react

# Environment variables
npm install expo-constants

# Development tools
npm install -D eslint prettier eslint-config-prettier
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Step 1.3: Configure Project Structure

```bash
# Create directory structure (run in project root)
mkdir -p src/{domain,application,infrastructure,presentation,shared,config}
mkdir -p src/domain/{entities,repositories}
mkdir -p src/application/{dtos,mappers,hooks}
mkdir -p src/infrastructure/{firebase,cache}
mkdir -p src/presentation/{screens,components,navigation,theme}
mkdir -p src/presentation/screens/{auth,onboarding,goal,dashboard,profile}
mkdir -p src/presentation/components/{common,goal,task}
mkdir -p src/shared/{constants,utils,types}
mkdir -p __tests__/{unit,integration}
mkdir -p assets/{images,fonts}
```

### Step 1.4: Environment Variables Setup

Create `app.config.ts` (Expo's recommended approach):

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) return "com.yourcompany.dreampath.dev";
  if (IS_PREVIEW) return "com.yourcompany.dreampath.preview";
  return "com.yourcompany.dreampath";
};

const getAppName = () => {
  if (IS_DEV) return "DreamPath (Dev)";
  if (IS_PREVIEW) return "DreamPath (Preview)";
  return "DreamPath";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "dreampath",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#4F46E5",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: getUniqueIdentifier(),
    buildNumber: "1",
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#4F46E5",
    },
    package: getUniqueIdentifier(),
  },
  plugins: [
    "expo-router",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#4F46E5",
      },
    ],
  ],
  extra: {
    // Firebase Config - loaded from environment
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    // OpenAI (only used in Cloud Functions, not in app)
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  owner: "your-expo-username",
});
```

Create `.env` file (DO NOT commit to git):

```bash
# .env
APP_VARIANT=development

# Firebase Configuration
FIREBASE_API_KEY=your-api-key-here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:ios:abcdef

# EAS Build
EAS_PROJECT_ID=your-eas-project-id
```

Create `.env.example` (commit this to git):

```bash
# .env.example - Copy to .env and fill in values
APP_VARIANT=development

# Firebase Configuration (get from Firebase Console)
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# EAS Build (get from Expo dashboard)
EAS_PROJECT_ID=
```

Update `.gitignore`:

```bash
# Environment
.env
.env.local
.env.*.local

# Expo
.expo/
dist/
web-build/

# Dependencies
node_modules/

# Build
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*

# iOS
ios/Pods/
*.xcworkspace
*.xcuserstate

# Testing
coverage/

# IDE
.idea/
.vscode/
*.swp
*.swo

# Firebase
firebase-debug.log
.firebase/

# OS
.DS_Store
Thumbs.db
```

### Step 1.4: Setup TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2017"],
    "allowJs": true,
    "jsx": "react-native",
    "noEmit": true,
    "isolatedModules": true,
    "strict": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": "./src",
    "paths": {
      "@domain/*": ["domain/*"],
      "@application/*": ["application/*"],
      "@infrastructure/*": ["infrastructure/*"],
      "@presentation/*": ["presentation/*"],
      "@shared/*": ["shared/*"],
      "@config/*": ["config/*"]
    }
  },
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js",
    "jest.config.js"
  ]
}
```

### Step 1.5: Setup ESLint and Prettier

`.eslintrc.js`:

```javascript
module.exports = {
  root: true,
  extends: [
    "@react-native-community",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "warn",
  },
};
```

`.prettierrc.js`:

```javascript
module.exports = {
  arrowParens: "avoid",
  bracketSameLine: true,
  bracketSpacing: true,
  singleQuote: true,
  trailingComma: "es5",
  tabWidth: 2,
  semi: true,
  printWidth: 100,
};
```

---

## Phase 2: Domain Layer Implementation

### Step 2.1: Create Base Entities

File: `src/domain/entities/Goal.ts`

```typescript
import { generateId } from "@shared/utils/idGenerator";

export enum GoalCategory {
  CAREER = "CAREER",
  BUSINESS = "BUSINESS",
  FITNESS = "FITNESS",
  FINANCIAL = "FINANCIAL",
  PERSONAL = "PERSONAL",
  CREATIVE = "CREATIVE",
  RELATIONSHIP = "RELATIONSHIP",
  OTHER = "OTHER",
}

export enum GoalStatus {
  DRAFT = "DRAFT",
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface GoalMetadata {
  personalContext: {
    age: number;
    responsibilities: string[];
    weeklyAvailableHours: number;
  };
  financialContext: {
    budget: { min: number; max: number };
    flexibility: number;
  };
  skillsContext: {
    relevantSkills: string[];
    experienceLevel: number;
  };
  constraints: {
    timeConstraints: string[];
    knownObstacles: string[];
  };
  preferences: {
    dailyTaskCount: number;
    notificationTime: string;
    motivationStyle: "GENTLE" | "BALANCED" | "AGGRESSIVE";
  };
}

export class Goal {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly category: GoalCategory,
    public readonly targetDate: Date,
    public readonly createdAt: Date,
    private _status: GoalStatus,
    private _progress: number = 0,
    public readonly metadata: GoalMetadata,
  ) {
    this.validate();
  }

  get status(): GoalStatus {
    return this._status;
  }

  get progress(): number {
    return this._progress;
  }

  static create(data: {
    userId: string;
    title: string;
    description: string;
    category: GoalCategory;
    targetDate: Date;
    metadata: GoalMetadata;
  }): Goal {
    return new Goal(
      generateId(),
      data.userId,
      data.title,
      data.description,
      data.category,
      data.targetDate,
      new Date(),
      GoalStatus.DRAFT,
      0,
      data.metadata,
    );
  }

  isActive(): boolean {
    return this._status === GoalStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this._status === GoalStatus.COMPLETED;
  }

  isOverdue(): boolean {
    return !this.isCompleted() && new Date() > this.targetDate;
  }

  daysRemaining(): number {
    const diff = this.targetDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  updateProgress(newProgress: number): void {
    if (newProgress < 0 || newProgress > 100) {
      throw new Error("Progress must be between 0 and 100");
    }
    this._progress = newProgress;
    if (newProgress === 100) {
      this._status = GoalStatus.COMPLETED;
    }
  }

  activate(): void {
    if (
      this._status !== GoalStatus.DRAFT &&
      this._status !== GoalStatus.ON_HOLD
    ) {
      throw new Error(`Cannot activate goal from ${this._status} status`);
    }
    this._status = GoalStatus.ACTIVE;
  }

  pause(): void {
    if (this._status === GoalStatus.ACTIVE) {
      this._status = GoalStatus.ON_HOLD;
    }
  }

  cancel(): void {
    if (!this.isCompleted()) {
      this._status = GoalStatus.CANCELLED;
    }
  }

  private validate(): void {
    if (!this.title?.trim()) {
      throw new Error("Goal title cannot be empty");
    }
    if (this.targetDate <= new Date()) {
      throw new Error("Target date must be in the future");
    }
  }
}
```

File: `src/domain/entities/Task.ts`

```typescript
import { generateId } from "@shared/utils/idGenerator";

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  SKIPPED = "SKIPPED",
}

export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

export class Task {
  constructor(
    public readonly id: string,
    public readonly goalId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly scheduledDate: Date,
    public readonly estimatedDuration: number,
    public readonly priority: TaskPriority,
    private _status: TaskStatus,
    private _completedAt: Date | null = null,
  ) {}

  get status(): TaskStatus {
    return this._status;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  static create(data: {
    goalId: string;
    title: string;
    description: string;
    scheduledDate: Date;
    estimatedDuration: number;
    priority: TaskPriority;
  }): Task {
    return new Task(
      generateId(),
      data.goalId,
      data.title,
      data.description,
      data.scheduledDate,
      data.estimatedDuration,
      data.priority,
      TaskStatus.PENDING,
    );
  }

  isCompleted(): boolean {
    return this._status === TaskStatus.COMPLETED;
  }

  isOverdue(): boolean {
    return !this.isCompleted() && new Date() > this.scheduledDate;
  }

  complete(): void {
    if (this.isCompleted()) {
      throw new Error("Task is already completed");
    }
    this._status = TaskStatus.COMPLETED;
    this._completedAt = new Date();
  }

  start(): void {
    if (this._status === TaskStatus.PENDING) {
      this._status = TaskStatus.IN_PROGRESS;
    }
  }

  skip(): void {
    if (!this.isCompleted()) {
      this._status = TaskStatus.SKIPPED;
    }
  }
}
```

### Step 2.2: Create Repository Interfaces

File: `src/domain/repositories/IGoalRepository.ts`

```typescript
import { Goal } from "@domain/entities/Goal";

export interface IGoalRepository {
  findById(id: string): Promise<Goal | null>;
  findByUserId(userId: string): Promise<Goal[]>;
  findActiveByUserId(userId: string): Promise<Goal[]>;
  save(goal: Goal): Promise<Goal>;
  update(goal: Goal): Promise<Goal>;
  delete(id: string): Promise<void>;
}
```

File: `src/domain/repositories/ITaskRepository.ts`

```typescript
import { Task } from "@domain/entities/Task";

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByGoalId(goalId: string): Promise<Task[]>;
  findByDate(userId: string, date: Date): Promise<Task[]>;
  save(task: Task): Promise<Task>;
  saveMany(tasks: Task[]): Promise<Task[]>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
}
```

---

## Phase 3: Application Layer Implementation

### Step 3.1: Create DTOs

File: `src/application/dtos/GoalDTO.ts`

```typescript
import { GoalCategory, GoalStatus } from "@domain/entities/Goal";

export interface CreateGoalDTO {
  userId: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: Date;
  personalContext: {
    age: number;
    responsibilities: string[];
    weeklyAvailableHours: number;
  };
  financialContext: {
    budget: { min: number; max: number };
    flexibility: number;
  };
  skillsContext: {
    relevantSkills: string[];
    experienceLevel: number;
  };
  constraints: {
    timeConstraints: string[];
    knownObstacles: string[];
  };
  preferences: {
    dailyTaskCount: number;
    notificationTime: string;
    motivationStyle: "GENTLE" | "BALANCED" | "AGGRESSIVE";
  };
}

export interface GoalResponseDTO {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  progress: number;
  targetDate: string;
  daysRemaining: number;
  isOverdue: boolean;
  createdAt: string;
}
```

### Step 3.2: Create Mappers

File: `src/application/mappers/GoalMapper.ts`

```typescript
import { Goal, GoalCategory, GoalStatus } from "@domain/entities/Goal";
import { GoalResponseDTO } from "@application/dtos/GoalDTO";

export class GoalMapper {
  static toResponseDTO(goal: Goal): GoalResponseDTO {
    return {
      id: goal.id,
      userId: goal.userId,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      status: goal.status,
      progress: goal.progress,
      targetDate: goal.targetDate.toISOString(),
      daysRemaining: goal.daysRemaining(),
      isOverdue: goal.isOverdue(),
      createdAt: goal.createdAt.toISOString(),
    };
  }

  static toPersistence(goal: Goal): any {
    return {
      id: goal.id,
      user_id: goal.userId,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      status: goal.status,
      progress: goal.progress,
      target_date: goal.targetDate.toISOString(),
      created_at: goal.createdAt.toISOString(),
      metadata: JSON.stringify(goal.metadata),
    };
  }

  static fromPersistence(raw: any): Goal {
    return new Goal(
      raw.id,
      raw.user_id,
      raw.title,
      raw.description,
      raw.category as GoalCategory,
      new Date(raw.target_date),
      new Date(raw.created_at),
      raw.status as GoalStatus,
      raw.progress,
      JSON.parse(raw.metadata || "{}"),
    );
  }
}
```

### Step 3.3: Create Use Cases

File: `src/application/usecases/goal/CreateGoalUseCase.ts`

```typescript
import { Goal } from "@domain/entities/Goal";
import { IGoalRepository } from "@domain/repositories/IGoalRepository";
import { CreateGoalDTO } from "@application/dtos/GoalDTO";

export class CreateGoalUseCase {
  constructor(private goalRepository: IGoalRepository) {}

  async execute(dto: CreateGoalDTO): Promise<Goal> {
    // Validate
    this.validate(dto);

    // Create entity
    const goal = Goal.create({
      userId: dto.userId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      targetDate: dto.targetDate,
      metadata: {
        personalContext: dto.personalContext,
        financialContext: dto.financialContext,
        skillsContext: dto.skillsContext,
        constraints: dto.constraints,
        preferences: dto.preferences,
      },
    });

    // Save
    const savedGoal = await this.goalRepository.save(goal);

    return savedGoal;
  }

  private validate(dto: CreateGoalDTO): void {
    if (!dto.title?.trim()) {
      throw new Error("Title is required");
    }
    if (!dto.targetDate) {
      throw new Error("Target date is required");
    }
    if (new Date(dto.targetDate) <= new Date()) {
      throw new Error("Target date must be in the future");
    }
  }
}
```

File: `src/application/usecases/task/CompleteTaskUseCase.ts`

```typescript
import { Task } from "@domain/entities/Task";
import { ITaskRepository } from "@domain/repositories/ITaskRepository";
import { IGoalRepository } from "@domain/repositories/IGoalRepository";

export class CompleteTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private goalRepository: IGoalRepository,
  ) {}

  async execute(taskId: string): Promise<Task> {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    task.complete();

    const updatedTask = await this.taskRepository.update(task);

    // Update goal progress
    await this.updateGoalProgress(task.goalId);

    return updatedTask;
  }

  private async updateGoalProgress(goalId: string): Promise<void> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) return;

    const tasks = await this.taskRepository.findByGoalId(goalId);
    const completedTasks = tasks.filter((t) => t.isCompleted()).length;
    const progress = Math.round((completedTasks / tasks.length) * 100);

    goal.updateProgress(progress);
    await this.goalRepository.update(goal);
  }
}
```

---

## Phase 4: Infrastructure Layer Implementation

### Step 4.1: Setup Firebase

**Important**: Before this step, create a Firebase project at https://console.firebase.google.com

```bash
# iOS Pod installation for Firebase
cd ios && pod install && cd ..

# Add GoogleService-Info.plist to ios/ directory (download from Firebase Console)
```

File: `src/config/firebase.ts`

```typescript
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import messaging from "@react-native-firebase/messaging";
import functions from "@react-native-firebase/functions";

export const firebaseAuth = auth();
export const firebaseFirestore = firestore();
export const firebaseStorage = storage();
export const firebaseMessaging = messaging();
export const firebaseFunctions = functions();

// Enable offline persistence
firebaseFirestore.settings({
  persistence: true,
});
```

### Step 4.2: Implement Firebase Repositories

### Step 4.2: Implement Firebase Repositories

File: `src/infrastructure/firebase/repositories/FirebaseGoalRepository.ts`

```typescript
import { firebaseFirestore } from "@config/firebase";
import { Goal } from "@domain/entities/Goal";
import { IGoalRepository } from "@domain/repositories/IGoalRepository";
import { GoalMapper } from "@application/mappers/GoalMapper";

export class FirebaseGoalRepository implements IGoalRepository {
  private collection = firebaseFirestore.collection("goals");

  async findById(id: string): Promise<Goal | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return GoalMapper.fromFirestore(doc);
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    const snapshot = await this.collection
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => GoalMapper.fromFirestore(doc));
  }

  async findActiveByUserId(userId: string): Promise<Goal[]> {
    const snapshot = await this.collection
      .where("userId", "==", userId)
      .where("status", "==", "ACTIVE")
      .get();

    return snapshot.docs.map((doc) => GoalMapper.fromFirestore(doc));
  }

  async save(goal: Goal): Promise<Goal> {
    const data = GoalMapper.toFirestore(goal);
    await this.collection.doc(goal.id).set(data);
    return goal;
  }

  async update(goal: Goal): Promise<Goal> {
    const data = GoalMapper.toFirestore(goal);
    await this.collection.doc(goal.id).update(data);
    return goal;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
```

### Step 4.3: Setup Firebase Authentication

### Step 4.3: Setup Firebase Authentication

File: `src/infrastructure/firebase/auth/FirebaseAuthService.ts`

```typescript
import { firebaseAuth } from "@config/firebase";

export class FirebaseAuthService {
  async signIn(email: string, password: string) {
    const result = await firebaseAuth.signInWithEmailAndPassword(
      email,
      password,
    );
    return result.user;
  }

  async signUp(email: string, password: string, name: string) {
    const result = await firebaseAuth.createUserWithEmailAndPassword(
      email,
      password,
    );
    await result.user.updateProfile({ displayName: name });
    return result.user;
  }

  async signOut() {
    await firebaseAuth.signOut();
  }

  getCurrentUser() {
    return firebaseAuth.currentUser;
  }

  async getIdToken(): Promise<string | null> {
    const user = firebaseAuth.currentUser;
    return user ? await user.getIdToken() : null;
  }

  onAuthStateChanged(callback: (user: any) => void) {
    return firebaseAuth.onAuthStateChanged(callback);
  }
}
```

### Step 4.4: Setup OpenAI Integration (via Firebase Functions)

### Step 4.4: Setup OpenAI Integration (via Firebase Functions)

File: `src/infrastructure/firebase/functions/AIFunctionsCaller.ts`

```typescript
import { firebaseFunctions } from "@config/firebase";

export class AIFunctionsCaller {
  static async analyzeGoal(goalId: string): Promise<any> {
    try {
      const result = await firebaseFunctions.httpsCallable("analyzeGoal")({
        goalId,
      });
      return result.data;
    } catch (error: any) {
      console.error("Error calling analyzeGoal:", error);
      throw new Error("Failed to analyze goal");
    }
  }

  static async generateDailyTasks(goalId: string, date: Date): Promise<any> {
    try {
      const result = await firebaseFunctions.httpsCallable("generateTasks")({
        goalId,
        date: date.toISOString(),
      });
      return result.data;
    } catch (error: any) {
      console.error("Error generating tasks:", error);
      throw new Error("Failed to generate tasks");
    }
  }
}
```

**Note**: See FIREBASE_BACKEND.md for complete Cloud Functions implementation.

---

```typescript
import { Goal } from "@domain/entities/Goal";

export class PromptBuilder {
  buildGoalAnalysisPrompt(goal: Goal): string {
    const { metadata } = goal;

    return `
You are an expert life coach and strategic planner. Analyze the following goal and create a detailed, personalized action plan.

GOAL INFORMATION:
Title: ${goal.title}
Description: ${goal.description}
Category: ${goal.category}
Target Date: ${goal.targetDate.toISOString()}
Days Available: ${goal.daysRemaining()}

USER CONTEXT:
Age: ${metadata.personalContext.age}
Responsibilities: ${metadata.personalContext.responsibilities.join(", ")}
Weekly Available Hours: ${metadata.personalContext.weeklyAvailableHours}

FINANCIAL CONTEXT:
Budget Range: $${metadata.financialContext.budget.min} - $${metadata.financialContext.budget.max}
Flexibility: ${metadata.financialContext.flexibility}/10

SKILLS & EXPERIENCE:
Relevant Skills: ${metadata.skillsContext.relevantSkills.join(", ")}
Experience Level: ${metadata.skillsContext.experienceLevel}/10

CONSTRAINTS:
Time Constraints: ${metadata.constraints.timeConstraints.join(", ")}
Known Obstacles: ${metadata.constraints.knownObstacles.join(", ")}

PREFERENCES:
Daily Task Count: ${metadata.preferences.dailyTaskCount}
Notification Time: ${metadata.preferences.notificationTime}
Motivation Style: ${metadata.preferences.motivationStyle}

Please provide a comprehensive plan in the following JSON format:
{
  "summary": "Brief overview of the plan",
  "milestones": [
    {
      "title": "Milestone title",
      "description": "What needs to be achieved",
      "targetDate": "ISO date string",
      "order": 1
    }
  ],
  "keySuccessFactors": ["factor1", "factor2", "factor3"],
  "risks": [
    {
      "risk": "Potential obstacle",
      "mitigation": "How to handle it"
    }
  ],
  "resourceRequirements": {
    "timePerWeek": "X hours",
    "financialInvestment": "$X - $Y",
    "skillsToDevelop": ["skill1", "skill2"]
  },
  "weeklySchedule": {
    "monday": ["activity1", "activity2"],
    "tuesday": ["activity1", "activity2"]
    // ... other days
  }
}

Make the plan realistic, achievable, and motivating. Consider the user's constraints and preferences.
`.trim();
  }

  buildDailyTaskPrompt(goal: Goal, date: Date, context: any): string {
    return `
Generate ${goal.metadata.preferences.dailyTaskCount} specific, actionable tasks for ${date.toDateString()} 
to work towards the goal: "${goal.title}".

Consider:
- Available time: ${context.availableHours} hours
- Current milestone: ${context.currentMilestone}
- Recent progress: ${context.recentProgress}
- Preferred motivation style: ${goal.metadata.preferences.motivationStyle}

Provide tasks in JSON format:
[
  {
    "title": "Clear, actionable task title",
    "description": "Detailed description",
    "estimatedDuration": minutes,
    "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  }
]
`.trim();
  }
}
```

---

## Phase 5: Presentation Layer Implementation

### Step 5.1: Setup Navigation

File: `src/presentation/navigation/AppNavigator.tsx`

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SplashScreen from '@presentation/screens/splash/SplashScreen';
import OnboardingScreen from '@presentation/screens/onboarding/OnboardingScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState(false);

  React.useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    // Check authentication and onboarding status
    // Set state accordingly
    setIsLoading(false);
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

File: `src/presentation/navigation/MainNavigator.tsx`

```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import DashboardScreen from '@presentation/screens/dashboard/DashboardScreen';
import TasksScreen from '@presentation/screens/tasks/TasksScreen';
import GoalsScreen from '@presentation/screens/goals/GoalsScreen';
import ProgressScreen from '@presentation/screens/progress/ProgressScreen';
import ProfileScreen from '@presentation/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="checkbox-marked-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="target" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-line" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

### Step 5.2: Setup Redux Store

File: `src/presentation/store/index.ts`

```typescript
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authReducer from "./slices/authSlice";
import goalsReducer from "./slices/goalsSlice";
import tasksReducer from "./slices/tasksSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth"], // Only persist auth
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    goals: goalsReducer,
    tasks: tasksReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

File: `src/presentation/store/slices/goalsSlice.ts`

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Goal } from "@domain/entities/Goal";
import { GoalResponseDTO } from "@application/dtos/GoalDTO";

interface GoalsState {
  goals: GoalResponseDTO[];
  loading: boolean;
  error: string | null;
  selectedGoal: GoalResponseDTO | null;
}

const initialState: GoalsState = {
  goals: [],
  loading: false,
  error: null,
  selectedGoal: null,
};

export const fetchGoals = createAsyncThunk(
  "goals/fetchGoals",
  async (userId: string, { rejectWithValue }) => {
    try {
      // Call use case through dependency injection
      // const goals = await container.resolve('GetUserGoalsUseCase').execute(userId);
      // return goals;
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const goalsSlice = createSlice({
  name: "goals",
  initialState,
  reducers: {
    setSelectedGoal: (state, action: PayloadAction<GoalResponseDTO | null>) => {
      state.selectedGoal = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = action.payload;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedGoal, clearError } = goalsSlice.actions;
export default goalsSlice.reducer;
```

### Step 5.3: Create Custom Hooks

File: `src/presentation/hooks/useGoals.ts`

```typescript
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@presentation/store";
import { fetchGoals } from "@presentation/store/slices/goalsSlice";
import { useCallback } from "react";

export const useGoals = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { goals, loading, error } = useSelector(
    (state: RootState) => state.goals,
  );

  const loadGoals = useCallback(
    (userId: string) => {
      dispatch(fetchGoals(userId));
    },
    [dispatch],
  );

  return {
    goals,
    loading,
    error,
    loadGoals,
  };
};
```

---

_Continued in next section..._

## Phase 6: Building UI Components

See the UI_UX_SPECIFICATIONS.md for detailed component designs.

## Phase 7: Testing Strategy

See the TESTING_STRATEGY.md for comprehensive testing approach.

## Phase 8: Deployment

See deployment documentation for iOS App Store submission process.
