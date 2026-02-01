# DreamPath - Testing Strategy

## Testing Documentation for MVP

This document outlines a **practical, MVP-focused testing strategy** that balances quality with development speed.

---

## Testing Pyramid (Simplified for MVP)

```
          /\
         /  \
        /    \
       / E2E  \        <- 5% (Critical flows only)
      /________\
     /          \
    / Integration \    <- 15% (API & Firebase)
   /______________\
  /                \
 /   Unit Tests     \  <- 80% (Business logic)
/____________________\
```

### MVP Testing Goals

- **Unit Tests**: 60% coverage on domain/application layers (not 70%+ initially)
- **Integration Tests**: Core Firebase operations work correctly
- **E2E Tests**: Manual testing for MVP, automated later
- **Focus**: Test business logic, not UI components initially

---

## Setup & Configuration (Expo Compatible)

### Install Testing Dependencies

```bash
# Core testing (comes with Expo)
npm install -D jest @types/jest

# React Native testing
npm install -D @testing-library/react-native @testing-library/jest-native
npm install -D react-test-renderer

# Mocking
npm install -D jest-expo

# Firebase mocking
npm install -D firebase-mock
```

### Jest Configuration (Expo)

File: `jest.config.js`

```javascript
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: [
    "@testing-library/jest-native/extend-expect",
    "./jest.setup.js",
  ],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
  moduleNameMapper: {
    "^@domain/(.*)$": "<rootDir>/src/domain/$1",
    "^@application/(.*)$": "<rootDir>/src/application/$1",
    "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
    "^@presentation/(.*)$": "<rootDir>/src/presentation/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
  },
  collectCoverageFrom: [
    "src/domain/**/*.{ts,tsx}",
    "src/application/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 60,
      statements: 60,
    },
  },
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
};
```

File: `jest.setup.js`

```javascript
import "react-native-gesture-handler/jestSetup";

// Mock Firebase
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  initializeAuth: jest.fn(),
  getReactNativePersistence: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  initializeFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock Expo modules
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      firebaseApiKey: "test-key",
      firebaseProjectId: "test-project",
    },
  },
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
```

---

## Unit Tests

### Domain Layer Tests

#### Testing Entities

File: `__tests__/unit/domain/entities/Goal.test.ts`

```typescript
import { Goal, GoalCategory, GoalStatus } from "@domain/entities/Goal";

describe("Goal Entity", () => {
  const mockMetadata = {
    personalContext: {
      age: 30,
      responsibilities: ["work", "family"],
      weeklyAvailableHours: 20,
    },
    financialContext: {
      budget: { min: 1000, max: 5000 },
      flexibility: 7,
    },
    skillsContext: {
      relevantSkills: ["coding", "design"],
      experienceLevel: 6,
    },
    constraints: {
      timeConstraints: ["weekends only"],
      knownObstacles: ["limited budget"],
    },
    preferences: {
      dailyTaskCount: 3,
      notificationTime: "09:00",
      motivationStyle: "BALANCED" as const,
    },
  };

  describe("Creation", () => {
    it("should create a valid goal", () => {
      const goal = Goal.create({
        userId: "user-1",
        title: "Launch SaaS Product",
        description: "Build and launch my first SaaS",
        category: GoalCategory.BUSINESS,
        targetDate: new Date("2024-12-31"),
        metadata: mockMetadata,
      });

      expect(goal).toBeDefined();
      expect(goal.title).toBe("Launch SaaS Product");
      expect(goal.status).toBe(GoalStatus.DRAFT);
      expect(goal.progress).toBe(0);
    });

    it("should throw error for empty title", () => {
      expect(() => {
        Goal.create({
          userId: "user-1",
          title: "",
          description: "Test",
          category: GoalCategory.BUSINESS,
          targetDate: new Date("2024-12-31"),
          metadata: mockMetadata,
        });
      }).toThrow("Goal title cannot be empty");
    });

    it("should throw error for past target date", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      expect(() => {
        Goal.create({
          userId: "user-1",
          title: "Test Goal",
          description: "Test",
          category: GoalCategory.BUSINESS,
          targetDate: pastDate,
          metadata: mockMetadata,
        });
      }).toThrow("Target date must be in the future");
    });
  });

  describe("Status Management", () => {
    let goal: Goal;

    beforeEach(() => {
      goal = Goal.create({
        userId: "user-1",
        title: "Test Goal",
        description: "Test",
        category: GoalCategory.BUSINESS,
        targetDate: new Date("2024-12-31"),
        metadata: mockMetadata,
      });
    });

    it("should activate draft goal", () => {
      goal.activate();
      expect(goal.status).toBe(GoalStatus.ACTIVE);
      expect(goal.isActive()).toBe(true);
    });

    it("should pause active goal", () => {
      goal.activate();
      goal.pause();
      expect(goal.status).toBe(GoalStatus.ON_HOLD);
    });

    it("should resume paused goal", () => {
      goal.activate();
      goal.pause();
      goal.resume();
      expect(goal.status).toBe(GoalStatus.ACTIVE);
    });

    it("should not activate already active goal", () => {
      goal.activate();
      expect(() => goal.activate()).toThrow();
    });
  });

  describe("Progress Tracking", () => {
    let goal: Goal;

    beforeEach(() => {
      goal = Goal.create({
        userId: "user-1",
        title: "Test Goal",
        description: "Test",
        category: GoalCategory.BUSINESS,
        targetDate: new Date("2024-12-31"),
        metadata: mockMetadata,
      });
    });

    it("should update progress", () => {
      goal.updateProgress(50);
      expect(goal.progress).toBe(50);
    });

    it("should complete goal when progress reaches 100", () => {
      goal.updateProgress(100);
      expect(goal.progress).toBe(100);
      expect(goal.isCompleted()).toBe(true);
    });

    it("should throw error for invalid progress", () => {
      expect(() => goal.updateProgress(-10)).toThrow();
      expect(() => goal.updateProgress(150)).toThrow();
    });
  });

  describe("Business Logic", () => {
    it("should calculate days remaining correctly", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const goal = Goal.create({
        userId: "user-1",
        title: "Test Goal",
        description: "Test",
        category: GoalCategory.BUSINESS,
        targetDate: futureDate,
        metadata: mockMetadata,
      });

      expect(goal.daysRemaining()).toBeGreaterThan(0);
      expect(goal.daysRemaining()).toBeLessThanOrEqual(31);
    });

    it("should identify overdue goals", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const goal = new Goal(
        "goal-1",
        "user-1",
        "Test Goal",
        "Test",
        GoalCategory.BUSINESS,
        pastDate,
        new Date(),
        GoalStatus.ACTIVE,
        50,
        mockMetadata,
      );

      expect(goal.isOverdue()).toBe(true);
    });

    it("should not mark completed goal as overdue", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const goal = new Goal(
        "goal-1",
        "user-1",
        "Test Goal",
        "Test",
        GoalCategory.BUSINESS,
        pastDate,
        new Date(),
        GoalStatus.COMPLETED,
        100,
        mockMetadata,
      );

      expect(goal.isOverdue()).toBe(false);
    });
  });
});
```

#### Testing Value Objects

File: `__tests__/unit/domain/value-objects/DateRange.test.ts`

```typescript
import { DateRange } from "@domain/value-objects/DateRange";

describe("DateRange Value Object", () => {
  describe("Creation", () => {
    it("should create valid date range", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-12-31");
      const range = new DateRange(start, end);

      expect(range.start).toEqual(start);
      expect(range.end).toEqual(end);
    });

    it("should throw error if start is after end", () => {
      const start = new Date("2024-12-31");
      const end = new Date("2024-01-01");

      expect(() => new DateRange(start, end)).toThrow(
        "Start date must be before end date",
      );
    });
  });

  describe("contains", () => {
    it("should return true for date within range", () => {
      const range = new DateRange(
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );
      const date = new Date("2024-06-15");

      expect(range.contains(date)).toBe(true);
    });

    it("should return false for date outside range", () => {
      const range = new DateRange(
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );
      const date = new Date("2025-01-01");

      expect(range.contains(date)).toBe(false);
    });
  });

  describe("getDays", () => {
    it("should calculate days correctly", () => {
      const range = new DateRange(
        new Date("2024-01-01"),
        new Date("2024-01-31"),
      );

      expect(range.getDays()).toBe(31);
    });
  });

  describe("overlaps", () => {
    it("should detect overlapping ranges", () => {
      const range1 = new DateRange(
        new Date("2024-01-01"),
        new Date("2024-06-30"),
      );
      const range2 = new DateRange(
        new Date("2024-03-01"),
        new Date("2024-12-31"),
      );

      expect(range1.overlaps(range2)).toBe(true);
      expect(range2.overlaps(range1)).toBe(true);
    });

    it("should detect non-overlapping ranges", () => {
      const range1 = new DateRange(
        new Date("2024-01-01"),
        new Date("2024-06-30"),
      );
      const range2 = new DateRange(
        new Date("2024-07-01"),
        new Date("2024-12-31"),
      );

      expect(range1.overlaps(range2)).toBe(false);
    });
  });
});
```

### Application Layer Tests

#### Testing Use Cases

File: `__tests__/unit/application/usecases/CreateGoalUseCase.test.ts`

```typescript
import { CreateGoalUseCase } from "@application/usecases/goal/CreateGoalUseCase";
import { IGoalRepository } from "@domain/repositories/IGoalRepository";
import { Goal, GoalCategory } from "@domain/entities/Goal";
import { CreateGoalDTO } from "@application/dtos/GoalDTO";

describe("CreateGoalUseCase", () => {
  let useCase: CreateGoalUseCase;
  let mockRepository: jest.Mocked<IGoalRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findActiveByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new CreateGoalUseCase(mockRepository);
  });

  const validDTO: CreateGoalDTO = {
    userId: "user-1",
    title: "Launch SaaS Product",
    description: "Build and launch my first SaaS",
    category: GoalCategory.BUSINESS,
    targetDate: new Date("2024-12-31"),
    personalContext: {
      age: 30,
      responsibilities: ["work"],
      weeklyAvailableHours: 20,
    },
    financialContext: {
      budget: { min: 1000, max: 5000 },
      flexibility: 7,
    },
    skillsContext: {
      relevantSkills: ["coding"],
      experienceLevel: 6,
    },
    constraints: {
      timeConstraints: [],
      knownObstacles: [],
    },
    preferences: {
      dailyTaskCount: 3,
      notificationTime: "09:00",
      motivationStyle: "BALANCED",
    },
  };

  it("should create goal successfully", async () => {
    const mockGoal = Goal.create(validDTO);
    mockRepository.save.mockResolvedValue(mockGoal);

    const result = await useCase.execute(validDTO);

    expect(result).toBeDefined();
    expect(result.title).toBe(validDTO.title);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it("should throw error for empty title", async () => {
    const invalidDTO = { ...validDTO, title: "" };

    await expect(useCase.execute(invalidDTO)).rejects.toThrow(
      "Title is required",
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it("should throw error for past target date", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const invalidDTO = { ...validDTO, targetDate: pastDate };

    await expect(useCase.execute(invalidDTO)).rejects.toThrow(
      "Target date must be in the future",
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    mockRepository.save.mockRejectedValue(new Error("Database error"));

    await expect(useCase.execute(validDTO)).rejects.toThrow("Database error");
  });
});
```

#### Testing Services

File: `__tests__/unit/application/services/ProgressCalculator.test.ts`

```typescript
import { ProgressCalculator } from "@application/services/ProgressCalculator";
import { Task, TaskStatus } from "@domain/entities/Task";

describe("ProgressCalculator", () => {
  let calculator: ProgressCalculator;

  beforeEach(() => {
    calculator = new ProgressCalculator();
  });

  const createMockTask = (status: TaskStatus): Task => {
    return {
      id: `task-${Math.random()}`,
      goalId: "goal-1",
      title: "Test Task",
      description: "",
      scheduledDate: new Date(),
      estimatedDuration: 30,
      priority: 2,
      status,
      completedAt: status === TaskStatus.COMPLETED ? new Date() : null,
      isCompleted: () => status === TaskStatus.COMPLETED,
      isOverdue: () => false,
      complete: jest.fn(),
      start: jest.fn(),
      skip: jest.fn(),
    } as unknown as Task;
  };

  it("should calculate 0% for no tasks", () => {
    const progress = calculator.calculateProgress([]);
    expect(progress).toBe(0);
  });

  it("should calculate 100% for all completed tasks", () => {
    const tasks = [
      createMockTask(TaskStatus.COMPLETED),
      createMockTask(TaskStatus.COMPLETED),
      createMockTask(TaskStatus.COMPLETED),
    ];

    const progress = calculator.calculateProgress(tasks);
    expect(progress).toBe(100);
  });

  it("should calculate correct percentage for mixed status", () => {
    const tasks = [
      createMockTask(TaskStatus.COMPLETED),
      createMockTask(TaskStatus.COMPLETED),
      createMockTask(TaskStatus.PENDING),
      createMockTask(TaskStatus.PENDING),
    ];

    const progress = calculator.calculateProgress(tasks);
    expect(progress).toBe(50);
  });

  it("should round progress to nearest integer", () => {
    const tasks = [
      createMockTask(TaskStatus.COMPLETED),
      createMockTask(TaskStatus.PENDING),
      createMockTask(TaskStatus.PENDING),
    ];

    const progress = calculator.calculateProgress(tasks);
    expect(progress).toBe(33); // 33.33 rounded down
  });
});
```

### Infrastructure Layer Tests

#### Testing Repositories

File: `__tests__/unit/infrastructure/repositories/GoalRepository.test.ts`

```typescript
import { GoalRepository } from "@infrastructure/persistence/repositories/GoalRepository";
import { ApiClient } from "@infrastructure/api/ApiClient";
import { Goal, GoalCategory, GoalStatus } from "@domain/entities/Goal";

jest.mock("@infrastructure/api/ApiClient");

describe("GoalRepository", () => {
  let repository: GoalRepository;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any;

    repository = new GoalRepository(mockApiClient);
  });

  describe("findById", () => {
    it("should return goal when found", async () => {
      const mockResponse = {
        data: {
          id: "goal-1",
          user_id: "user-1",
          title: "Test Goal",
          description: "Test",
          category: "BUSINESS",
          status: "ACTIVE",
          progress: 50,
          target_date: "2024-12-31",
          created_at: "2024-01-01",
          metadata: JSON.stringify({}),
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const goal = await repository.findById("goal-1");

      expect(goal).toBeDefined();
      expect(goal?.id).toBe("goal-1");
      expect(mockApiClient.get).toHaveBeenCalledWith("/goals/goal-1");
    });

    it("should return null when not found", async () => {
      mockApiClient.get.mockRejectedValue({
        response: { status: 404 },
      });

      const goal = await repository.findById("nonexistent");

      expect(goal).toBeNull();
    });

    it("should throw error for other failures", async () => {
      mockApiClient.get.mockRejectedValue(new Error("Network error"));

      await expect(repository.findById("goal-1")).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("save", () => {
    it("should save goal successfully", async () => {
      const goal = Goal.create({
        userId: "user-1",
        title: "Test Goal",
        description: "Test",
        category: GoalCategory.BUSINESS,
        targetDate: new Date("2024-12-31"),
        metadata: {} as any,
      });

      const mockResponse = {
        data: {
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
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const saved = await repository.save(goal);

      expect(saved).toBeDefined();
      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/goals",
        expect.any(Object),
      );
    });
  });
});
```

---

## Integration Tests

### Testing Layer Integration

File: `__tests__/integration/goal-creation-flow.test.ts`

```typescript
import { CreateGoalUseCase } from "@application/usecases/goal/CreateGoalUseCase";
import { GoalRepository } from "@infrastructure/persistence/repositories/GoalRepository";
import { ApiClient } from "@infrastructure/api/ApiClient";
import { GoalCategory } from "@domain/entities/Goal";

describe("Goal Creation Flow Integration", () => {
  let useCase: CreateGoalUseCase;
  let repository: GoalRepository;
  let apiClient: ApiClient;

  beforeAll(() => {
    // Setup with real implementations but mocked HTTP
    apiClient = new ApiClient("http://test-api.com");
    repository = new GoalRepository(apiClient);
    useCase = new CreateGoalUseCase(repository);
  });

  it("should complete full goal creation flow", async () => {
    // Mock HTTP response
    jest.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        id: "goal-1",
        user_id: "user-1",
        title: "Launch Product",
        // ... other fields
      },
    } as any);

    const dto = {
      userId: "user-1",
      title: "Launch Product",
      description: "Build and launch SaaS",
      category: GoalCategory.BUSINESS,
      targetDate: new Date("2024-12-31"),
      // ... other required fields
    };

    const result = await useCase.execute(dto);

    expect(result).toBeDefined();
    expect(result.title).toBe("Launch Product");
  });
});
```

---

## E2E Tests

### Detox Configuration

File: `.detoxrc.json`

```json
{
  "testRunner": "jest",
  "runnerConfig": "e2e/config.json",
  "configurations": {
    "ios.sim.debug": {
      "device": {
        "type": "iPhone 14"
      },
      "app": "ios.debug"
    },
    "ios.sim.release": {
      "device": {
        "type": "iPhone 14"
      },
      "app": "ios.release"
    }
  },
  "apps": {
    "ios.debug": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/DreamPath.app",
      "build": "xcodebuild -workspace ios/DreamPath.xcworkspace -scheme DreamPath -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
    },
    "ios.release": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/DreamPath.app",
      "build": "xcodebuild -workspace ios/DreamPath.xcworkspace -scheme DreamPath -configuration Release -sdk iphonesimulator -derivedDataPath ios/build"
    }
  }
}
```

### E2E Test Example

File: `e2e/goal-creation.e2e.ts`

```typescript
describe("Goal Creation Flow", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should create a new goal successfully", async () => {
    // Navigate to goals screen
    await element(by.id("bottom-tab-goals")).tap();

    // Tap create goal button
    await element(by.id("create-goal-button")).tap();

    // Fill in goal details
    await element(by.id("goal-title-input")).typeText("Launch my startup");
    await element(by.id("goal-description-input")).typeText(
      "Build and launch a successful SaaS product",
    );

    // Select category
    await element(by.id("category-BUSINESS")).tap();

    // Set target date
    await element(by.id("target-date-picker")).tap();
    // ... date selection

    // Navigate through wizard
    await element(by.id("next-button")).tap();

    // Fill personal context
    await element(by.id("age-input")).typeText("30");
    await element(by.id("next-button")).tap();

    // Continue through remaining steps...

    // Submit
    await element(by.id("submit-goal-button")).tap();

    // Verify success
    await expect(element(by.id("goal-created-success"))).toBeVisible();
    await expect(element(by.text("Launch my startup"))).toBeVisible();
  });

  it("should validate required fields", async () => {
    await element(by.id("bottom-tab-goals")).tap();
    await element(by.id("create-goal-button")).tap();

    // Try to proceed without filling fields
    await element(by.id("next-button")).tap();

    // Should show validation error
    await expect(element(by.text("Title is required"))).toBeVisible();
  });
});
```

---

## Test Coverage

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test Goal.test.ts

# Run in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run E2E on specific platform
detox test --configuration ios.sim.debug
```

### Coverage Reports

Generate and view coverage:

```bash
pnpm test:coverage
open coverage/lcov-report/index.html
```

---

## Testing Best Practices

### 1. Test Naming Convention

```typescript
describe("ComponentName or FeatureName", () => {
  describe("method or scenario", () => {
    it("should do something specific when condition", () => {
      // Test implementation
    });
  });
});
```

### 2. AAA Pattern

```typescript
it("should calculate progress correctly", () => {
  // Arrange
  const tasks = [
    createMockTask(TaskStatus.COMPLETED),
    createMockTask(TaskStatus.PENDING),
  ];
  const calculator = new ProgressCalculator();

  // Act
  const progress = calculator.calculateProgress(tasks);

  // Assert
  expect(progress).toBe(50);
});
```

### 3. Test Isolation

```typescript
describe("GoalRepository", () => {
  let repository: GoalRepository;
  let mockClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    // Fresh instances for each test
    mockClient = createMockApiClient();
    repository = new GoalRepository(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

### 4. Mock External Dependencies

```typescript
// Mock entire module
jest.mock("@infrastructure/api/ApiClient");

// Mock specific function
jest.spyOn(apiClient, "post").mockResolvedValue(mockData);

// Mock with implementation
mockRepository.save.mockImplementation(async (goal) => {
  return { ...goal, id: "generated-id" };
});
```

### 5. Test Edge Cases

```typescript
describe("updateProgress", () => {
  it("should handle minimum value", () => {
    goal.updateProgress(0);
    expect(goal.progress).toBe(0);
  });

  it("should handle maximum value", () => {
    goal.updateProgress(100);
    expect(goal.progress).toBe(100);
  });

  it("should reject negative values", () => {
    expect(() => goal.updateProgress(-1)).toThrow();
  });

  it("should reject values over 100", () => {
    expect(() => goal.updateProgress(101)).toThrow();
  });
});
```

---

## Continuous Integration

### GitHub Actions Workflow

File: `.github/workflows/test.yml`

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm lint

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e:
    runs-on: macos-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: pnpm install

      - name: Run E2E tests
        run: pnpm test:e2e
```

---

This comprehensive testing strategy ensures high code quality and reliability throughout the application.
