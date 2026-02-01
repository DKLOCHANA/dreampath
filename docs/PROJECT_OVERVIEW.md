# DreamPath - AI-Powered Goal Achievement Platform

## Project Overview

DreamPath is an iOS mobile application built with React Native that helps users achieve their biggest life goals through AI-powered personalized planning and daily task management.

### Core Value Proposition

Transform ambitious goals into achievable daily actions through intelligent analysis of user's life circumstances, creating fully personalized roadmaps to success.

---

## Technical Stack

### Frontend

- **Framework**: Expo SDK 52 (React Native 0.76)
- **Language**: TypeScript 5.3+
- **State Management**: Zustand 5.0 (simpler than Redux)
- **Navigation**: React Navigation v7 (@react-navigation/native 7.x)
- **UI Components**: Custom component library with React Native Paper 5.x
- **Forms**: React Hook Form 7.x + Zod validation (type-safe)
- **Animations**: React Native Reanimated 3.x
- **Charts**: react-native-chart-kit 6.x (lightweight)

### Backend & Services

- **Backend**: Firebase (Firestore, Functions, Auth)
- **Database**: Firebase Firestore (NoSQL) with offline persistence
- **AI Integration**: OpenAI GPT-4 API (via Firebase Cloud Functions)
- **Authentication**: Firebase Authentication (Email + Apple Sign In)
- **File Storage**: Firebase Storage
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Analytics**: Firebase Analytics (built-in, free)

### Development Tools

- **Package Manager**: npm (most stable with React Native)
- **Development Platform**: Expo Go (development) + EAS Build (production)
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Native Testing Library
- **CI/CD**: GitHub Actions + EAS Build

---

## Architecture Overview

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│  (UI Components, Screens, View Models)              │
├─────────────────────────────────────────────────────┤
│                  Application Layer                   │
│  (Use Cases, Business Logic, Services)              │
├─────────────────────────────────────────────────────┤
│                    Domain Layer                      │
│  (Entities, Domain Models, Interfaces)              │
├─────────────────────────────────────────────────────┤
│                Infrastructure Layer                  │
│  (Firebase SDK, Firestore, Cloud Functions)         │
└─────────────────────────────────────────────────────┘
```

### SOLID Principles Application

1. **Single Responsibility Principle**: Each module handles one concern
2. **Open/Closed Principle**: Extend functionality without modifying existing code
3. **Liskov Substitution Principle**: Interfaces are substitutable
4. **Interface Segregation Principle**: Small, focused interfaces
5. **Dependency Inversion Principle**: Depend on abstractions, not concretions

---

## Project Structure

```
dreampath/
├── src/
│   ├── domain/                    # Domain Layer
│   │   ├── entities/             # Core business entities
│   │   │   ├── User.ts
│   │   │   ├── Goal.ts
│   │   │   ├── Task.ts
│   │   │   ├── Plan.ts
│   │   │   └── Progress.ts
│   │   ├── repositories/         # Repository interfaces
│   │   │   ├── IUserRepository.ts
│   │   │   ├── IGoalRepository.ts
│   │   │   └── ITaskRepository.ts
│   │   └── usecases/            # Business use cases
│   │       ├── goal/
│   │       ├── task/
│   │       └── analytics/
│   │
│   ├── application/              # Application Layer
│   │   ├── services/            # Application services
│   │   │   ├── AIAnalysisService.ts
│   │   │   ├── NotificationService.ts
│   │   │   └── ProgressTrackingService.ts
│   │   ├── dtos/                # Data Transfer Objects
│   │   └── mappers/             # Entity <-> DTO mappers
│   │
│   ├── infrastructure/           # Infrastructure Layer
│   │   ├── firebase/            # Firebase SDK integration
│   │   │   ├── firestore/
│   │   │   ├── auth/
│   │   │   ├── storage/
│   │   │   └── functions/
│   │   ├── openai/              # OpenAI integration
│   │   └── repositories/        # Repository implementations
│   │
│   ├── presentation/             # Presentation Layer
│   │   ├── screens/             # Screen components
│   │   │   ├── auth/
│   │   │   ├── onboarding/
│   │   │   ├── goal/
│   │   │   ├── dashboard/
│   │   │   └── profile/
│   │   ├── components/          # Reusable components
│   │   │   ├── common/
│   │   │   ├── goal/
│   │   │   └── task/
│   │   ├── navigation/          # Navigation configuration
│   │   ├── hooks/               # Custom React hooks
│   │   ├── viewmodels/          # Screen view models
│   │   └── theme/               # Theme & styling
│   │
│   ├── shared/                   # Shared utilities
│   │   ├── constants/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── types/
│   │
│   └── config/                   # App configuration
│       ├── env.ts
│       ├── api.config.ts
│       └── app.config.ts
│
├── __tests__/                    # Test files
├── ios/                          # iOS native code
├── android/                      # Android native code
├── assets/                       # Static assets
└── docs/                         # Documentation
```

---

## Core Features & Modules

### 1. User Authentication & Profile

- Email/Social login
- User profile management
- Preferences and settings

### 2. Goal Definition & Data Collection

- Multi-step goal creation wizard
- Comprehensive data collection:
  - Goal details (type, timeline, success metrics)
  - Personal context (age, responsibilities, commitments)
  - Financial information (budget, resources)
  - Time availability
  - Skills and experience
  - Constraints and blockers

### 3. AI Analysis & Plan Generation

- Integration with OpenAI GPT-4
- Intelligent analysis of user data
- Generation of personalized action plans
- Milestone creation
- Risk assessment and mitigation strategies

### 4. Daily Task Management

- AI-generated daily tasks
- Task prioritization
- Task completion tracking
- Adaptive scheduling based on progress

### 5. Progress Tracking & Analytics

- Visual progress dashboards
- Milestone tracking
- Habit formation metrics
- Completion statistics
- Insights and recommendations

### 6. Notifications & Reminders

- Smart daily task reminders
- Progress check-ins
- Motivational messages
- Achievement celebrations

### 7. Plan Adaptation

- Re-analysis based on progress
- Dynamic plan adjustments
- Obstacle handling
- Timeline modifications

---

## Development Phases

### Phase 1: Foundation (Weeks 1-2)

- Project setup and configuration
- Architecture implementation
- Core domain models
- Authentication flow

### Phase 2: Data Collection (Weeks 3-4)

- Goal creation wizard
- Data collection forms
- Validation and storage
- Basic UI components

### Phase 3: AI Integration (Weeks 5-6)

- OpenAI API integration
- Prompt engineering
- Plan generation logic
- Data parsing and structuring

### Phase 4: Task Management (Weeks 7-8)

- Daily task interface
- Task completion flows
- Progress tracking
- Local notifications

### Phase 5: Analytics & Insights (Weeks 9-10)

- Dashboard implementation
- Charts and visualizations
- Progress calculations
- Insight generation

### Phase 6: Polish & Optimization (Weeks 11-12)

- Performance optimization
- UI/UX refinement
- Testing and bug fixes
- App Store preparation

---

## Key Technical Decisions

### State Management Strategy

- **Global State**: Zustand for app-wide state (user, goals, tasks) - simple and performant
- **Server State**: React Query (TanStack Query) for Firebase data caching
- **Local State**: React hooks for component-specific state
- **Persistent State**: AsyncStorage with Zustand persist middleware
- **Form State**: React Hook Form for form handling

### Data Flow Pattern

1. User interacts with UI (Presentation Layer)
2. ViewModel/Hook calls Use Case (Application Layer)
3. Use Case orchestrates business logic (Domain Layer)
4. Repository handles data operations (Infrastructure Layer)
5. Data flows back up through layers

### Error Handling Strategy

- Centralized error handling service
- User-friendly error messages
- Automatic retry logic for network failures
- Offline queue for critical operations
- Firebase Crashlytics for crash reporting (post-MVP)

### Security Considerations

- Secure token storage (Keychain/Keystore)
- API request signing
- Data encryption at rest
- HTTPS only communication
- Input sanitization and validation

---

## Performance Targets

- **App Launch**: < 2 seconds
- **Screen Transitions**: < 300ms
- **List Rendering**: 60 FPS
- **Memory Usage**: < 150MB average

---

## Accessibility Requirements

- VoiceOver/TalkBack support
- Dynamic text sizing
- High contrast mode
- Keyboard navigation
- Color-blind friendly palette

---

## Next Steps

Refer to the following detailed documentation files:

1. `UI_UX_SPECIFICATIONS.md` - Complete UI/UX design guide
2. `TECHNICAL_ARCHITECTURE.md` - Detailed technical architecture
3. `DEVELOPMENT_GUIDE.md` - Step-by-step development instructions
4. `API_INTEGRATION.md` - OpenAI and backend API integration
5. `TESTING_STRATEGY.md` - Comprehensive testing approach
