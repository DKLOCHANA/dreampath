# DreamPath - Technical Architecture Documentation

## Architecture Overview

This document details the implementation of **Simplified Clean Architecture** for the DreamPath Expo React Native application. The focus is on **simplicity, scalability, and maintainability** while avoiding over-engineering.

### Core Principles

1. **Keep It Simple**: Avoid unnecessary abstractions until complexity demands them
2. **Firebase-First**: Leverage Firebase's built-in features (caching, real-time sync, offline)
3. **Type Safety**: Full TypeScript with strict mode
4. **Testability**: Structure code for easy unit testing
5. **Performance**: Optimize from the start with caching and lazy loading

---

## Clean Architecture Implementation

### Layer Separation

```
┌──────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                    │
│  • React Components (Screens, UI Components)         │
│  • View Models / Presenters                          │
│  • React Hooks for UI Logic                          │
│  • Navigation Configuration                          │
│  • Dependency: Application Layer Only                │
├──────────────────────────────────────────────────────┤
│                 APPLICATION LAYER                     │
│  • Use Cases (Business Logic Orchestration)          │
│  • Application Services                              │
│  • DTOs (Data Transfer Objects)                      │
│  • Mappers (Entity ↔ DTO)                           │
│  • Dependency: Domain Layer Only                     │
├──────────────────────────────────────────────────────┤
│                   DOMAIN LAYER                        │
│  • Entities (Core Business Objects)                  │
│  • Value Objects                                      │
│  • Domain Events                                      │
│  • Repository Interfaces                             │
│  • Service Interfaces                                │
│  • Business Rules & Validations                      │
│  • Dependency: NONE (Pure Business Logic)            │
├──────────────────────────────────────────────────────┤
│               INFRASTRUCTURE LAYER                    │
│  • Repository Implementations                        │
│  • API Clients (OpenAI, Backend)                    │
│  • Database Implementation                           │
│  • External Service Integrations                     │
│  • Framework-Specific Code                          │
│  • Dependency: Domain Layer Only                     │
└──────────────────────────────────────────────────────┘
```

### Dependency Rule

**Critical**: Dependencies only point inward. Inner layers know nothing about outer layers.

```
Infrastructure ──→ Domain ←── Application ←── Presentation
                     ↑
                  Core Business Logic
                  (No Dependencies)
```

---

## State Management with Zustand

We use **Zustand** for state management because it's simple, performant, and TypeScript-friendly.

### Auth Store

```typescript
// src/infrastructure/stores/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@domain/entities/User";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }), // Only persist user
    },
  ),
);
```

### Goals Store

```typescript
// src/infrastructure/stores/goalsStore.ts
import { create } from "zustand";
import { Goal } from "@domain/entities/Goal";

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
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  activeGoal: null,
  isLoading: false,
  error: null,

  setGoals: (goals) => set({ goals, isLoading: false }),

  addGoal: (goal) =>
    set((state) => ({
      goals: [goal, ...state.goals],
    })),

  updateGoal: (updatedGoal) =>
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === updatedGoal.id ? updatedGoal : g,
      ),
      activeGoal:
        state.activeGoal?.id === updatedGoal.id
          ? updatedGoal
          : state.activeGoal,
    })),

  removeGoal: (goalId) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== goalId),
      activeGoal: state.activeGoal?.id === goalId ? null : state.activeGoal,
    })),

  setActiveGoal: (goal) => set({ activeGoal: goal }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// Selector hooks for optimized re-renders
export const useActiveGoals = () =>
  useGoalsStore((state) => state.goals.filter((g) => g.status === "ACTIVE"));

export const useGoalById = (id: string) =>
  useGoalsStore((state) => state.goals.find((g) => g.id === id));
```

### Tasks Store

```typescript
// src/infrastructure/stores/tasksStore.ts
import { create } from "zustand";
import { Task } from "@domain/entities/Task";

interface TasksState {
  todayTasks: Task[];
  selectedDate: Date;
  isLoading: boolean;

  // Actions
  setTodayTasks: (tasks: Task[]) => void;
  completeTask: (taskId: string) => void;
  setSelectedDate: (date: Date) => void;
  setLoading: (loading: boolean) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  todayTasks: [],
  selectedDate: new Date(),
  isLoading: false,

  setTodayTasks: (tasks) => set({ todayTasks: tasks, isLoading: false }),

  completeTask: (taskId) =>
    set((state) => ({
      todayTasks: state.todayTasks.map((t) =>
        t.id === taskId
          ? { ...t, status: "COMPLETED", completedAt: new Date() }
          : t,
      ),
    })),

  setSelectedDate: (date) => set({ selectedDate: date }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Computed selectors
export const usePendingTasks = () =>
  useTasksStore((state) =>
    state.todayTasks.filter((t) => t.status === "PENDING"),
  );

export const useCompletedTasks = () =>
  useTasksStore((state) =>
    state.todayTasks.filter((t) => t.status === "COMPLETED"),
  );

export const useTaskProgress = () =>
  useTasksStore((state) => {
    const total = state.todayTasks.length;
    const completed = state.todayTasks.filter(
      (t) => t.status === "COMPLETED",
    ).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });
```

### Using Stores in Components

```typescript
// Simple usage example in a component
import { useAuthStore } from '@infrastructure/stores/authStore';
import { useGoalsStore, useActiveGoals } from '@infrastructure/stores/goalsStore';

export const DashboardScreen = () => {
  const user = useAuthStore((state) => state.user);
  const activeGoals = useActiveGoals();
  const { setActiveGoal } = useGoalsStore();

  return (
    <View>
      <Text>Welcome, {user?.name}!</Text>
      <Text>You have {activeGoals.length} active goals</Text>
      {activeGoals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onPress={() => setActiveGoal(goal)}
        />
      ))}
    </View>
  );
};
```

---

## React Query for Server State

Use **TanStack Query** (React Query) for Firebase data fetching with caching:

```typescript
// src/application/hooks/useGoalsQuery.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FirebaseGoalRepository } from "@infrastructure/firebase/repositories/FirebaseGoalRepository";
import { useAuthStore } from "@infrastructure/stores/authStore";

const goalRepository = new FirebaseGoalRepository();

// Query keys factory
export const goalKeys = {
  all: ["goals"] as const,
  lists: () => [...goalKeys.all, "list"] as const,
  list: (userId: string) => [...goalKeys.lists(), userId] as const,
  details: () => [...goalKeys.all, "detail"] as const,
  detail: (id: string) => [...goalKeys.details(), id] as const,
};

// Fetch user's goals with caching
export const useGoals = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: goalKeys.list(userId!),
    queryFn: () => goalRepository.findByUserId(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
};

// Fetch single goal
export const useGoal = (goalId: string) => {
  return useQuery({
    queryKey: goalKeys.detail(goalId),
    queryFn: () => goalRepository.findById(goalId),
    enabled: !!goalId,
  });
};

// Create goal mutation
export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (data: CreateGoalDTO) => goalRepository.save(Goal.create(data)),
    onSuccess: (newGoal) => {
      // Optimistically update the cache
      queryClient.setQueryData(goalKeys.list(userId!), (old: Goal[] = []) => [
        newGoal,
        ...old,
      ]);
      // Also cache the individual goal
      queryClient.setQueryData(goalKeys.detail(newGoal.id), newGoal);
    },
  });
};

// Update goal mutation
export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goal: Goal) => goalRepository.update(goal),
    onSuccess: (updatedGoal) => {
      // Update cache
      queryClient.setQueryData(goalKeys.detail(updatedGoal.id), updatedGoal);
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
    },
  });
};
```

---

## SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

Each class/module should have only one reason to change.

#### Example: Goal Creation

**❌ BAD (Multiple Responsibilities)**

```typescript
// DON'T DO THIS
class GoalService {
  async createGoal(data: any) {
    // Validates data
    // Calls API
    // Updates local storage
    // Sends analytics
    // Shows notification
    // Updates UI state
  }
}
```

**✅ GOOD (Single Responsibility)**

```typescript
// Domain Layer - Business Entity
export class Goal {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly category: GoalCategory,
    public readonly targetDate: Date,
    public readonly userId: string,
    private _status: GoalStatus
  ) {}

  isOverdue(): boolean {
    return this._status !== GoalStatus.COMPLETED &&
           new Date() > this.targetDate;
  }

  markAsCompleted(): void {
    this._status = GoalStatus.COMPLETED;
  }
}

// Application Layer - Use Case
export class CreateGoalUseCase {
  constructor(
    private goalRepository: IGoalRepository,
    private aiService: IAIAnalysisService,
    private notificationService: INotificationService
  ) {}

  async execute(dto: CreateGoalDTO): Promise<Goal> {
    // 1. Validate
    this.validateGoalData(dto);

    // 2. Create entity
    const goal = this.createGoalEntity(dto);

    // 3. Save
    const savedGoal = await this.goalRepository.save(goal);

    // 4. Trigger AI analysis (async)
    this.aiService.analyzeGoal(savedGoal.id);

    // 5. Notify user
    await this.notificationService.sendGoalCreatedNotification(savedGoal);

    return savedGoal;
  }

  private validateGoalData(dto: CreateGoalDTO): void {
    // Validation logic only
  }

  private createGoalEntity(dto: CreateGoalDTO): Goal {
    // Entity creation logic only
  }
}

// Infrastructure Layer - Repository Implementation
export class GoalRepository implements IGoalRepository {
  async save(goal: Goal): Promise<Goal> {
    // Only handles data persistence
    const dto = GoalMapper.toDTO(goal);
    const response = await api.post('/goals', dto);
    return GoalMapper.toDomain(response.data);
  }
}

// Presentation Layer - Screen
export const CreateGoalScreen = () => {
  const createGoalUseCase = useCreateGoalUseCase();

  const handleSubmit = async (formData: GoalFormData) => {
    // Only handles UI interactions
    try {
      await createGoalUseCase.execute(formData);
      navigation.navigate('Dashboard');
    } catch (error) {
      showError(error.message);
    }
  };

  return <GoalForm onSubmit={handleSubmit} />;
};
```

### 2. Open/Closed Principle (OCP)

Open for extension, closed for modification.

#### Example: Task Prioritization

```typescript
// Domain Layer - Strategy Interface
export interface ITaskPrioritizationStrategy {
  calculatePriority(task: Task, context: PriorityContext): number;
}

// Domain Layer - Concrete Strategies
export class DeadlineBasedPriority implements ITaskPrioritizationStrategy {
  calculatePriority(task: Task, context: PriorityContext): number {
    const daysUntilDue = this.getDaysUntilDue(task.dueDate);
    if (daysUntilDue <= 1) return 10;
    if (daysUntilDue <= 3) return 8;
    if (daysUntilDue <= 7) return 6;
    return 4;
  }
}

export class ImportanceBasedPriority implements ITaskPrioritizationStrategy {
  calculatePriority(task: Task, context: PriorityContext): number {
    return task.importance * 2;
  }
}

export class EisenhowerMatrixPriority implements ITaskPrioritizationStrategy {
  calculatePriority(task: Task, context: PriorityContext): number {
    if (task.isUrgent && task.isImportant) return 10;
    if (!task.isUrgent && task.isImportant) return 8;
    if (task.isUrgent && !task.isImportant) return 6;
    return 4;
  }
}

// Application Layer - Service
export class TaskPrioritizationService {
  constructor(private strategies: ITaskPrioritizationStrategy[]) {}

  prioritizeTasks(tasks: Task[], context: PriorityContext): Task[] {
    return tasks
      .map((task) => ({
        task,
        priority: this.calculateCombinedPriority(task, context),
      }))
      .sort((a, b) => b.priority - a.priority)
      .map((item) => item.task);
  }

  private calculateCombinedPriority(
    task: Task,
    context: PriorityContext,
  ): number {
    // Combine multiple strategies
    return (
      this.strategies.reduce((sum, strategy) => {
        return sum + strategy.calculatePriority(task, context);
      }, 0) / this.strategies.length
    );
  }
}

// Easy to add new strategies without modifying existing code
export class MomentumBasedPriority implements ITaskPrioritizationStrategy {
  calculatePriority(task: Task, context: PriorityContext): number {
    // New strategy implementation
    const recentCompletions = context.recentCompletions;
    return recentCompletions > 5 ? 9 : 5;
  }
}
```

### 3. Liskov Substitution Principle (LSP)

Subtypes must be substitutable for their base types.

#### Example: Data Storage

```typescript
// Domain Layer - Repository Interface
export interface IGoalRepository {
  findById(id: string): Promise<Goal | null>;
  save(goal: Goal): Promise<Goal>;
  delete(id: string): Promise<void>;
  findByUserId(userId: string): Promise<Goal[]>;
}

// Infrastructure Layer - Remote Repository
export class RemoteGoalRepository implements IGoalRepository {
  constructor(private apiClient: ApiClient) {}

  async findById(id: string): Promise<Goal | null> {
    const response = await this.apiClient.get(`/goals/${id}`);
    return response.data ? GoalMapper.toDomain(response.data) : null;
  }

  async save(goal: Goal): Promise<Goal> {
    const dto = GoalMapper.toDTO(goal);
    const response = await this.apiClient.post("/goals", dto);
    return GoalMapper.toDomain(response.data);
  }

  async delete(id: string): Promise<void> {
    await this.apiClient.delete(`/goals/${id}`);
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    const response = await this.apiClient.get(`/users/${userId}/goals`);
    return response.data.map(GoalMapper.toDomain);
  }
}

// Infrastructure Layer - Local Repository (Offline Support)
export class LocalGoalRepository implements IGoalRepository {
  constructor(private database: Database) {}

  async findById(id: string): Promise<Goal | null> {
    const record = await this.database.goals.findOne({ id });
    return record ? GoalMapper.toDomain(record) : null;
  }

  async save(goal: Goal): Promise<Goal> {
    const dto = GoalMapper.toDTO(goal);
    const saved = await this.database.goals.upsert(dto);
    return GoalMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.database.goals.delete({ id });
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    const records = await this.database.goals.find({ userId });
    return records.map(GoalMapper.toDomain);
  }
}

// Infrastructure Layer - Cached Repository (Decorator Pattern)
export class CachedGoalRepository implements IGoalRepository {
  private cache: Map<string, Goal> = new Map();

  constructor(
    private remoteRepository: IGoalRepository,
    private cacheTimeout: number = 5 * 60 * 1000, // 5 minutes
  ) {}

  async findById(id: string): Promise<Goal | null> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const goal = await this.remoteRepository.findById(id);
    if (goal) {
      this.cache.set(id, goal);
      this.scheduleEviction(id);
    }
    return goal;
  }

  async save(goal: Goal): Promise<Goal> {
    const saved = await this.remoteRepository.save(goal);
    this.cache.set(saved.id, saved);
    this.scheduleEviction(saved.id);
    return saved;
  }

  async delete(id: string): Promise<void> {
    await this.remoteRepository.delete(id);
    this.cache.delete(id);
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    // Cache entire user's goals
    return await this.remoteRepository.findByUserId(userId);
  }

  private scheduleEviction(id: string): void {
    setTimeout(() => this.cache.delete(id), this.cacheTimeout);
  }
}

// Application Layer - Use Case (works with any implementation)
export class GetGoalByIdUseCase {
  constructor(
    private goalRepository: IGoalRepository, // Can be Remote, Local, or Cached
  ) {}

  async execute(goalId: string): Promise<Goal> {
    const goal = await this.goalRepository.findById(goalId);

    if (!goal) {
      throw new GoalNotFoundException(goalId);
    }

    return goal;
  }
}
```

### 4. Interface Segregation Principle (ISP)

Clients shouldn't depend on interfaces they don't use.

#### Example: User Profile Management

**❌ BAD (Fat Interface)**

```typescript
// DON'T DO THIS
interface IUserService {
  // Authentication
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;

  // Profile
  updateProfile(data: ProfileData): Promise<User>;
  uploadAvatar(file: File): Promise<string>;

  // Goals
  getUserGoals(userId: string): Promise<Goal[]>;
  createGoal(data: GoalData): Promise<Goal>;

  // Analytics
  getUserAnalytics(userId: string): Promise<Analytics>;
  exportData(): Promise<Blob>;

  // Notifications
  getNotifications(): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
}
```

**✅ GOOD (Segregated Interfaces)**

```typescript
// Domain Layer - Segregated Interfaces

export interface IAuthenticationService {
  login(credentials: LoginCredentials): Promise<AuthToken>;
  logout(): Promise<void>;
  refreshToken(token: string): Promise<AuthToken>;
  validateToken(token: string): Promise<boolean>;
}

export interface IUserProfileService {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, data: UpdateProfileDTO): Promise<UserProfile>;
  updateAvatar(userId: string, imageData: ImageData): Promise<string>;
}

export interface IUserPreferencesService {
  getPreferences(userId: string): Promise<UserPreferences>;
  updatePreferences(userId: string, prefs: UserPreferences): Promise<void>;
  resetToDefaults(userId: string): Promise<UserPreferences>;
}

export interface IUserAnalyticsService {
  getAnalytics(userId: string, dateRange: DateRange): Promise<UserAnalytics>;
  exportUserData(userId: string): Promise<ExportData>;
}

// Application Layer - Specific Use Cases

export class UpdateUserProfileUseCase {
  constructor(
    private userProfileService: IUserProfileService, // Only what's needed
    private eventBus: IEventBus,
  ) {}

  async execute(userId: string, data: UpdateProfileDTO): Promise<UserProfile> {
    const updatedProfile = await this.userProfileService.updateProfile(
      userId,
      data,
    );

    await this.eventBus.publish(
      new UserProfileUpdatedEvent(userId, updatedProfile),
    );

    return updatedProfile;
  }
}

export class LoginUserUseCase {
  constructor(
    private authService: IAuthenticationService, // Only what's needed
    private sessionManager: ISessionManager,
  ) {}

  async execute(credentials: LoginCredentials): Promise<Session> {
    const token = await this.authService.login(credentials);
    return await this.sessionManager.createSession(token);
  }
}
```

### 5. Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions.

#### Example: AI Analysis Service

```typescript
// Domain Layer - Abstraction (Interface)
export interface IAIAnalysisService {
  analyzeGoal(goalData: GoalAnalysisInput): Promise<GoalPlan>;
  generateDailyTasks(goalId: string, date: Date): Promise<Task[]>;
  adjustPlan(goalId: string, feedback: PlanFeedback): Promise<GoalPlan>;
}

export interface IPromptBuilder {
  buildGoalAnalysisPrompt(data: GoalAnalysisInput): string;
  buildTaskGenerationPrompt(context: TaskGenerationContext): string;
}

// Infrastructure Layer - Concrete Implementation
export class OpenAIAnalysisService implements IAIAnalysisService {
  constructor(
    private openAIClient: OpenAIClient,
    private promptBuilder: IPromptBuilder, // Depends on abstraction
    private resultParser: IResultParser    // Depends on abstraction
  ) {}

  async analyzeGoal(goalData: GoalAnalysisInput): Promise<GoalPlan> {
    const prompt = this.promptBuilder.buildGoalAnalysisPrompt(goalData);

    const response = await this.openAIClient.createCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    return this.resultParser.parseGoalPlan(response.choices[0].message.content);
  }

  async generateDailyTasks(goalId: string, date: Date): Promise<Task[]> {
    const context = await this.buildTaskContext(goalId, date);
    const prompt = this.promptBuilder.buildTaskGenerationPrompt(context);

    const response = await this.openAIClient.createCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    });

    return this.resultParser.parseTasks(response.choices[0].message.content);
  }

  async adjustPlan(goalId: string, feedback: PlanFeedback): Promise<GoalPlan> {
    // Implementation
  }

  private async buildTaskContext(goalId: string, date: Date): Promise<TaskGenerationContext> {
    // Build context
  }
}

// Alternative implementation (e.g., Claude, custom ML model)
export class ClaudeAnalysisService implements IAIAnalysisService {
  constructor(
    private claudeClient: ClaudeClient,
    private promptBuilder: IPromptBuilder,
    private resultParser: IResultParser
  ) {}

  async analyzeGoal(goalData: GoalAnalysisInput): Promise<GoalPlan> {
    // Different implementation, same interface
  }

  async generateDailyTasks(goalId: string, date: Date): Promise<Task[]> {
    // Different implementation, same interface
  }

  async adjustPlan(goalId: string, feedback: PlanFeedback): Promise<GoalPlan> {
    // Different implementation, same interface
  }
}

// Application Layer - Use Case (doesn't care about implementation)
export class GenerateDailyTasksUseCase {
  constructor(
    private aiService: IAIAnalysisService, // Depends on abstraction
    private taskRepository: ITaskRepository,
    private goalRepository: IGoalRepository
  ) {}

  async execute(userId: string, date: Date): Promise<Task[]> {
    const activeGoals = await this.goalRepository.findActiveByUserId(userId);

    const allTasks: Task[] = [];

    for (const goal of activeGoals) {
      const tasks = await this.aiService.generateDailyTasks(goal.id, date);
      allTasks.push(...tasks);
    }

    // Save tasks
    for (const task of allTasks) {
      await this.taskRepository.save(task);
    }

    return allTasks;
  }
}

// Dependency Injection - Simple React Context Pattern
// No complex DI container needed - use React Context + custom hooks

// src/contexts/ServiceContext.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { FirebaseGoalRepository } from '@infrastructure/firebase/repositories/FirebaseGoalRepository';
import { FirebaseTaskRepository } from '@infrastructure/firebase/repositories/FirebaseTaskRepository';

interface Services {
  goalRepository: FirebaseGoalRepository;
  taskRepository: FirebaseTaskRepository;
}

const ServiceContext = createContext<Services | null>(null);

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const services = useMemo(() => ({
    goalRepository: new FirebaseGoalRepository(),
    taskRepository: new FirebaseTaskRepository(),
  }), []);

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServiceContext);
  if (!context) throw new Error('useServices must be used within ServiceProvider');
  return context;
};

// Usage in components - simple and clean
export const useGoals = (userId: string) => {
  const { goalRepository } = useServices();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = goalRepository.subscribeToUserGoals(userId, (updatedGoals) => {
      setGoals(updatedGoals);
      setLoading(false);
    });
    return unsubscribe;
  }, [userId]);

  return { goals, loading, error };
};
```

---

## Detailed Layer Implementations

### Domain Layer

#### Entities

```typescript
// src/domain/entities/Goal.ts
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

  // Business Logic Methods
  get status(): GoalStatus {
    return this._status;
  }

  get progress(): number {
    return this._progress;
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
      throw new InvalidProgressError("Progress must be between 0 and 100");
    }

    this._progress = newProgress;

    if (newProgress === 100 && this._status !== GoalStatus.COMPLETED) {
      this._status = GoalStatus.COMPLETED;
    }
  }

  activate(): void {
    if (this._status === GoalStatus.DRAFT) {
      this._status = GoalStatus.ACTIVE;
    } else {
      throw new InvalidStatusTransitionError(
        `Cannot activate goal from ${this._status}`,
      );
    }
  }

  pause(): void {
    if (this._status === GoalStatus.ACTIVE) {
      this._status = GoalStatus.ON_HOLD;
    }
  }

  resume(): void {
    if (this._status === GoalStatus.ON_HOLD) {
      this._status = GoalStatus.ACTIVE;
    }
  }

  cancel(): void {
    if (!this.isCompleted()) {
      this._status = GoalStatus.CANCELLED;
    }
  }

  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new ValidationError("Goal title cannot be empty");
    }

    if (this.targetDate <= new Date()) {
      throw new ValidationError("Target date must be in the future");
    }
  }
}

// src/domain/entities/Task.ts
export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  SKIPPED = "SKIPPED",
  RESCHEDULED = "RESCHEDULED",
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
    public readonly milestoneId: string | null,
    public readonly title: string,
    public readonly description: string,
    public readonly scheduledDate: Date,
    public readonly estimatedDuration: number, // in minutes
    public readonly priority: TaskPriority,
    private _status: TaskStatus,
    private _completedAt: Date | null = null,
    public readonly dependencies: string[] = [],
  ) {}

  get status(): TaskStatus {
    return this._status;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  isCompleted(): boolean {
    return this._status === TaskStatus.COMPLETED;
  }

  isOverdue(): boolean {
    return !this.isCompleted() && new Date() > this.scheduledDate;
  }

  canBeStarted(): boolean {
    return this._status === TaskStatus.PENDING;
  }

  complete(): void {
    if (this.isCompleted()) {
      throw new TaskAlreadyCompletedError(this.id);
    }

    this._status = TaskStatus.COMPLETED;
    this._completedAt = new Date();
  }

  skip(reason?: string): void {
    if (this.isCompleted()) {
      throw new TaskAlreadyCompletedError(this.id);
    }

    this._status = TaskStatus.SKIPPED;
  }

  reschedule(newDate: Date): void {
    if (this.isCompleted()) {
      throw new TaskAlreadyCompletedError(this.id);
    }

    this._status = TaskStatus.RESCHEDULED;
  }

  start(): void {
    if (!this.canBeStarted()) {
      throw new InvalidTaskStateError(
        `Cannot start task in ${this._status} status`,
      );
    }

    this._status = TaskStatus.IN_PROGRESS;
  }
}

// src/domain/entities/Milestone.ts
export class Milestone {
  constructor(
    public readonly id: string,
    public readonly goalId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly targetDate: Date,
    public readonly order: number,
    private _isCompleted: boolean = false,
    private _completedAt: Date | null = null,
  ) {}

  get isCompleted(): boolean {
    return this._isCompleted;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  complete(): void {
    if (this._isCompleted) {
      throw new MilestoneAlreadyCompletedError(this.id);
    }

    this._isCompleted = true;
    this._completedAt = new Date();
  }

  isOverdue(): boolean {
    return !this._isCompleted && new Date() > this.targetDate;
  }
}

// src/domain/entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly profile: UserProfile,
    public readonly preferences: UserPreferences,
    public readonly createdAt: Date,
  ) {}

  updateProfile(updates: Partial<UserProfile>): User {
    return new User(
      this.id,
      this.email,
      updates.name || this.name,
      { ...this.profile, ...updates },
      this.preferences,
      this.createdAt,
    );
  }

  updatePreferences(updates: Partial<UserPreferences>): User {
    return new User(
      this.id,
      this.email,
      this.name,
      this.profile,
      { ...this.preferences, ...updates },
      this.createdAt,
    );
  }
}
```

#### Value Objects

```typescript
// src/domain/value-objects/DateRange.ts
export class DateRange {
  constructor(
    public readonly start: Date,
    public readonly end: Date,
  ) {
    if (start >= end) {
      throw new ValidationError("Start date must be before end date");
    }
  }

  contains(date: Date): boolean {
    return date >= this.start && date <= this.end;
  }

  getDays(): number {
    const diff = this.end.getTime() - this.start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  overlaps(other: DateRange): boolean {
    return this.start <= other.end && this.end >= other.start;
  }

  static fromDays(days: number): DateRange {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    return new DateRange(start, end);
  }
}

// src/domain/value-objects/TimeSlot.ts
export class TimeSlot {
  constructor(
    public readonly startTime: string, // HH:MM format
    public readonly endTime: string,
    public readonly dayOfWeek?: number, // 0-6
  ) {
    this.validate();
  }

  getDuration(): number {
    const [startHour, startMin] = this.startTime.split(":").map(Number);
    const [endHour, endMin] = this.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return endMinutes - startMinutes;
  }

  private validate(): void {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timeRegex.test(this.startTime) || !timeRegex.test(this.endTime)) {
      throw new ValidationError("Invalid time format. Use HH:MM");
    }

    if (this.getDuration() <= 0) {
      throw new ValidationError("End time must be after start time");
    }
  }
}
```

#### Repository Interfaces

```typescript
// src/domain/repositories/IGoalRepository.ts
export interface IGoalRepository {
  findById(id: string): Promise<Goal | null>;
  findByUserId(userId: string): Promise<Goal[]>;
  findActiveByUserId(userId: string): Promise<Goal[]>;
  save(goal: Goal): Promise<Goal>;
  update(goal: Goal): Promise<Goal>;
  delete(id: string): Promise<void>;
  findByCategory(userId: string, category: GoalCategory): Promise<Goal[]>;
  findByDateRange(userId: string, dateRange: DateRange): Promise<Goal[]>;
}

// src/domain/repositories/ITaskRepository.ts
export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByGoalId(goalId: string): Promise<Task[]>;
  findByDate(userId: string, date: Date): Promise<Task[]>;
  findByDateRange(userId: string, dateRange: DateRange): Promise<Task[]>;
  findPendingByUserId(userId: string): Promise<Task[]>;
  findOverdue(userId: string): Promise<Task[]>;
  save(task: Task): Promise<Task>;
  saveMany(tasks: Task[]): Promise<Task[]>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
}

// src/domain/repositories/IUserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
```

---

### Application Layer

#### DTOs (Data Transfer Objects)

```typescript
// src/application/dtos/GoalDTO.ts
export interface CreateGoalDTO {
  userId: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: Date;

  // User context
  personalContext: {
    age: number;
    responsibilities: string[];
    weeklyAvailableHours: number;
  };

  financialContext: {
    budget: {
      min: number;
      max: number;
    };
    flexibility: number; // 1-10
  };

  skillsContext: {
    relevantSkills: string[];
    experienceLevel: number; // 1-10
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

export interface UpdateGoalDTO {
  title?: string;
  description?: string;
  targetDate?: Date;
  status?: GoalStatus;
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
  createdAt: string;
  metadata: GoalMetadataDTO;
}

// src/application/dtos/TaskDTO.ts
export interface CreateTaskDTO {
  goalId: string;
  milestoneId?: string;
  title: string;
  description: string;
  scheduledDate: Date;
  estimatedDuration: number;
  priority: TaskPriority;
}

export interface TaskResponseDTO {
  id: string;
  goalId: string;
  milestoneId: string | null;
  title: string;
  description: string;
  scheduledDate: string;
  estimatedDuration: number;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt: string | null;
}
```

#### Mappers

```typescript
// src/application/mappers/GoalMapper.ts
export class GoalMapper {
  static toDomain(dto: any): Goal {
    return new Goal(
      dto.id,
      dto.userId,
      dto.title,
      dto.description,
      dto.category as GoalCategory,
      new Date(dto.targetDate),
      new Date(dto.createdAt),
      dto.status as GoalStatus,
      dto.progress,
      dto.metadata,
    );
  }

  static toDTO(goal: Goal): GoalResponseDTO {
    return {
      id: goal.id,
      userId: goal.userId,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      status: goal.status,
      progress: goal.progress,
      targetDate: goal.targetDate.toISOString(),
      createdAt: goal.createdAt.toISOString(),
      metadata: goal.metadata,
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
      raw.category,
      new Date(raw.target_date),
      new Date(raw.created_at),
      raw.status,
      raw.progress,
      JSON.parse(raw.metadata),
    );
  }
}
```

#### Use Cases

```typescript
// src/application/usecases/goal/CreateGoalUseCase.ts
export class CreateGoalUseCase {
  constructor(
    private goalRepository: IGoalRepository,
    private userRepository: IUserRepository,
    private aiAnalysisService: IAIAnalysisService,
    private notificationService: INotificationService,
    private eventBus: IEventBus,
  ) {}

  async execute(dto: CreateGoalDTO): Promise<Goal> {
    // 1. Validate user exists
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new UserNotFoundException(dto.userId);
    }

    // 2. Validate goal data
    await this.validateGoalData(dto);

    // 3. Create goal entity
    const goal = this.createGoalFromDTO(dto);

    // 4. Save goal
    const savedGoal = await this.goalRepository.save(goal);

    // 5. Trigger AI analysis (async, don't wait)
    this.triggerAIAnalysis(savedGoal, dto);

    // 6. Send notification
    await this.notificationService.sendGoalCreatedNotification(savedGoal);

    // 7. Publish event
    await this.eventBus.publish(new GoalCreatedEvent(savedGoal));

    return savedGoal;
  }

  private async validateGoalData(dto: CreateGoalDTO): Promise<void> {
    if (!dto.title || dto.title.trim().length === 0) {
      throw new ValidationError("Goal title is required");
    }

    if (dto.targetDate <= new Date()) {
      throw new ValidationError("Target date must be in the future");
    }

    // Additional validations...
  }

  private createGoalFromDTO(dto: CreateGoalDTO): Goal {
    return new Goal(
      generateId(),
      dto.userId,
      dto.title,
      dto.description,
      dto.category,
      dto.targetDate,
      new Date(),
      GoalStatus.PLANNING,
      0,
      {
        personalContext: dto.personalContext,
        financialContext: dto.financialContext,
        skillsContext: dto.skillsContext,
        constraints: dto.constraints,
        preferences: dto.preferences,
      },
    );
  }

  private async triggerAIAnalysis(
    goal: Goal,
    dto: CreateGoalDTO,
  ): Promise<void> {
    try {
      const analysisInput: GoalAnalysisInput = {
        goal,
        userContext: dto.personalContext,
        financialContext: dto.financialContext,
        skillsContext: dto.skillsContext,
        constraints: dto.constraints,
      };

      const plan = await this.aiAnalysisService.analyzeGoal(analysisInput);

      await this.eventBus.publish(new GoalPlanGeneratedEvent(goal.id, plan));
    } catch (error) {
      // Log error but don't fail the goal creation
      console.error("AI analysis failed:", error);
      await this.eventBus.publish(
        new GoalPlanGenerationFailedEvent(goal.id, error),
      );
    }
  }
}

// src/application/usecases/task/CompleteTaskUseCase.ts
export class CompleteTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private goalRepository: IGoalRepository,
    private progressCalculator: IProgressCalculator,
    private eventBus: IEventBus,
  ) {}

  async execute(taskId: string): Promise<Task> {
    // 1. Get task
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new TaskNotFoundException(taskId);
    }

    // 2. Complete task
    task.complete();

    // 3. Save updated task
    const updatedTask = await this.taskRepository.update(task);

    // 4. Update goal progress
    await this.updateGoalProgress(task.goalId);

    // 5. Publish event
    await this.eventBus.publish(new TaskCompletedEvent(updatedTask));

    // 6. Check for milestone completion
    await this.checkMilestoneCompletion(task);

    return updatedTask;
  }

  private async updateGoalProgress(goalId: string): Promise<void> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) return;

    const tasks = await this.taskRepository.findByGoalId(goalId);
    const newProgress = this.progressCalculator.calculateProgress(tasks);

    goal.updateProgress(newProgress);
    await this.goalRepository.update(goal);

    if (goal.isCompleted()) {
      await this.eventBus.publish(new GoalCompletedEvent(goal));
    }
  }

  private async checkMilestoneCompletion(task: Task): Promise<void> {
    if (!task.milestoneId) return;

    // Check if all tasks for this milestone are completed
    // If so, mark milestone as completed
    // This would involve milestone repository and logic
  }
}
```

#### Services

```typescript
// src/application/services/AIAnalysisService.ts
export class AIAnalysisService implements IAIAnalysisService {
  constructor(
    private aiClient: IOpenAIClient,
    private promptBuilder: IPromptBuilder,
    private planParser: IPlanParser,
    private taskGenerator: ITaskGenerator,
  ) {}

  async analyzeGoal(input: GoalAnalysisInput): Promise<GoalPlan> {
    const prompt = this.promptBuilder.buildGoalAnalysisPrompt(input);

    const response = await this.aiClient.createCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: this.getSystemPrompt(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 4000,
    });

    const content = response.choices[0].message.content;
    return this.planParser.parse(content, input.goal);
  }

  async generateDailyTasks(goalId: string, date: Date): Promise<Task[]> {
    // Implementation
  }

  async adjustPlan(goalId: string, feedback: PlanFeedback): Promise<GoalPlan> {
    // Implementation
  }

  private getSystemPrompt(): string {
    return `You are an expert life coach and strategic planner. 
    Your role is to analyze user goals and create detailed, actionable plans 
    that are realistic, motivating, and personalized to the user's circumstances.
    
    Consider:
    - User's time availability and constraints
    - Financial resources and limitations
    - Existing skills and experience level
    - Personal responsibilities and commitments
    - Potential obstacles and challenges
    
    Provide:
    - Clear, achievable milestones
    - Specific action items
    - Risk assessment and mitigation strategies
    - Resource requirements
    - Timeline with flexibility built in`;
  }
}

// src/application/services/NotificationService.ts
export class NotificationService implements INotificationService {
  constructor(
    private pushNotificationClient: IPushNotificationClient,
    private userPreferencesService: IUserPreferencesService,
    private notificationRepository: INotificationRepository,
  ) {}

  async sendDailyTaskReminder(userId: string, tasks: Task[]): Promise<void> {
    const preferences =
      await this.userPreferencesService.getPreferences(userId);

    if (!preferences.notificationsEnabled) return;

    const notification: PushNotification = {
      title: "Your Daily Tasks",
      body: `You have ${tasks.length} tasks to complete today`,
      data: {
        type: "DAILY_TASKS",
        taskIds: tasks.map((t) => t.id),
      },
    };

    await this.pushNotificationClient.send(userId, notification);
    await this.saveNotificationRecord(userId, notification);
  }

  async sendGoalCreatedNotification(goal: Goal): Promise<void> {
    const notification: PushNotification = {
      title: "Goal Created!",
      body: `Your goal "${goal.title}" is being analyzed. We'll notify you when your plan is ready.`,
      data: {
        type: "GOAL_CREATED",
        goalId: goal.id,
      },
    };

    await this.pushNotificationClient.send(goal.userId, notification);
  }

  async sendMilestoneAchievement(
    userId: string,
    milestone: Milestone,
  ): Promise<void> {
    const notification: PushNotification = {
      title: "🎉 Milestone Achieved!",
      body: `Congratulations! You completed: ${milestone.title}`,
      data: {
        type: "MILESTONE_COMPLETED",
        milestoneId: milestone.id,
      },
    };

    await this.pushNotificationClient.send(userId, notification);
  }

  private async saveNotificationRecord(
    userId: string,
    notification: PushNotification,
  ): Promise<void> {
    await this.notificationRepository.save({
      userId,
      type: notification.data?.type || "GENERAL",
      title: notification.title,
      body: notification.body,
      sentAt: new Date(),
      read: false,
    });
  }
}
```

---

_This is part 1 of the Technical Architecture document. Continue reading in the next section..._
