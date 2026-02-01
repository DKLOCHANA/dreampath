# DreamPath - UI/UX Design Specifications

## Design Philosophy

**Principle**: _Clarity, Motivation, and Simplicity_

The app should feel like a personal success coach - encouraging, clear, and focused on action. Every screen should inspire progress while maintaining ease of use.

---

## Design System

### Color Palette

#### Primary Colors

```
Primary Brand:      #4F46E5 (Indigo-600)    - Main actions, CTAs
Primary Light:      #818CF8 (Indigo-400)    - Hover states, accents
Primary Dark:       #3730A3 (Indigo-800)    - Dark mode primary
```

#### Secondary Colors

```
Success/Growth:     #10B981 (Emerald-500)   - Completed tasks, progress
Warning:            #F59E0B (Amber-500)     - Pending items, caution
Error:              #EF4444 (Red-500)       - Errors, overdue tasks
Info:               #3B82F6 (Blue-500)      - Information, tips
```

#### Neutrals

```
Background Light:   #FFFFFF                 - Main background
Background Dark:    #1F2937 (Gray-800)      - Dark mode background
Surface Light:      #F9FAFB (Gray-50)       - Cards, containers
Surface Dark:       #374151 (Gray-700)      - Dark mode surfaces
Text Primary:       #111827 (Gray-900)      - Main text
Text Secondary:     #6B7280 (Gray-500)      - Secondary text
Border:             #E5E7EB (Gray-200)      - Dividers, borders
```

#### Gradient Accents

```
Success Gradient:   linear-gradient(135deg, #10B981 0%, #34D399 100%)
Motivation:         linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)
Achievement:        linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)
```

### Typography

#### Font Family

- **Primary**: SF Pro (iOS native) / Inter (fallback)
- **Headings**: SF Pro Display / Poppins (web)
- **Monospace**: SF Mono / Roboto Mono

#### Type Scale

```
Display Large:   32px / 700 / -0.5px    - Onboarding headers
Heading 1:       28px / 700 / -0.5px    - Page titles
Heading 2:       24px / 600 / -0.3px    - Section headers
Heading 3:       20px / 600 / -0.2px    - Card headers
Body Large:      18px / 400 / 0px       - Important content
Body:            16px / 400 / 0px       - Default text
Body Small:      14px / 400 / 0px       - Secondary text
Caption:         12px / 500 / 0.5px     - Labels, metadata
Button:          16px / 600 / 0.5px     - Button text
```

### Spacing System

```
Space 1:   4px     - Tight spacing
Space 2:   8px     - Small spacing
Space 3:   12px    - Medium-small spacing
Space 4:   16px    - Default spacing
Space 5:   24px    - Large spacing
Space 6:   32px    - Section spacing
Space 8:   48px    - Major section spacing
Space 12:  64px    - Page spacing
```

### Border Radius

```
xs:   4px      - Small elements, badges
sm:   8px      - Buttons, inputs
md:   12px     - Cards, containers
lg:   16px     - Modals, large cards
xl:   24px     - Bottom sheets
full: 9999px   - Pills, avatars
```

### Shadows & Elevation

```
Level 1 (Subtle):
  shadow: 0 1px 3px rgba(0,0,0,0.1)
  Usage: Cards, inputs

Level 2 (Medium):
  shadow: 0 4px 6px rgba(0,0,0,0.1)
  Usage: Floating elements, dropdowns

Level 3 (High):
  shadow: 0 10px 15px rgba(0,0,0,0.1)
  Usage: Modals, bottom sheets

Level 4 (Maximum):
  shadow: 0 20px 25px rgba(0,0,0,0.15)
  Usage: Important overlays
```

---

## Component Library

### Buttons

#### Primary Button

```
Height: 52px
Border Radius: 12px
Background: Primary Brand gradient
Text: White, 16px, 600 weight
States: Default, Pressed (95% scale), Disabled (50% opacity)
Padding: 16px horizontal
```

#### Secondary Button

```
Height: 52px
Border: 2px solid Primary Brand
Background: Transparent
Text: Primary Brand, 16px, 600 weight
States: Default, Pressed (background: Primary Light 10%)
```

#### Text Button

```
Height: 44px
Background: Transparent
Text: Primary Brand, 16px, 600 weight
States: Pressed (underline)
```

### Input Fields

#### Text Input

```
Height: 56px
Border: 1px solid Border color
Border Radius: 12px
Padding: 16px
Font: 16px, regular
States:
  - Default: Border Gray-200
  - Focused: Border Primary, shadow
  - Error: Border Error, helper text in red
  - Disabled: Background Gray-100, text Gray-400
```

#### Multi-line Input (TextArea)

```
Min Height: 120px
Border: 1px solid Border color
Border Radius: 12px
Padding: 16px
Font: 16px, regular
Character counter: Bottom right, Caption size
```

### Cards

#### Goal Card

```
Width: Full width - 32px margin
Padding: 20px
Border Radius: 16px
Background: White with subtle gradient
Shadow: Level 2
Structure:
  - Goal icon (48x48) with category color
  - Goal title (Heading 3)
  - Progress bar (8px height, rounded)
  - Metadata row (days remaining, completion %)
  - Quick action button
```

#### Task Card

```
Width: Full width - 32px margin
Padding: 16px
Border Radius: 12px
Background: Surface Light
Border: 1px solid when incomplete
Structure:
  - Checkbox (28x28, custom styled)
  - Task text (Body)
  - Priority indicator (color dot)
  - Time estimate badge
  - Swipe actions (complete, reschedule, delete)
```

#### Stats Card

```
Width: 48% (in 2-column grid)
Aspect Ratio: 1:1
Padding: 16px
Border Radius: 16px
Background: Gradient based on metric type
Shadow: Level 1
Structure:
  - Icon (32x32)
  - Value (Heading 1)
  - Label (Caption)
  - Trend indicator (+/- with arrow)
```

### Progress Indicators

#### Linear Progress Bar

```
Height: 8px
Border Radius: 4px
Background: Gray-200
Fill: Gradient (Primary -> Success)
Animation: Smooth fill transition (300ms)
```

#### Circular Progress

```
Size: 120px (large), 80px (medium), 60px (small)
Stroke Width: 8px
Background: Gray-200
Fill: Gradient stroke
Center Content: Percentage text
```

#### Milestone Tracker

```
Vertical timeline with:
  - Circle nodes (24px) - filled when complete
  - Connecting lines (2px) - colored when complete
  - Milestone labels
  - Date indicators
```

### Modals & Overlays

#### Bottom Sheet

```
Border Radius: 24px (top corners only)
Background: White
Handle: 32px wide, 4px height, centered, 8px from top
Max Height: 90% of screen
Shadow: Level 4
Animation: Slide up from bottom (400ms ease-out)
```

#### Full Modal

```
Background: White
Safe Area Aware: Yes
Header: Fixed at top with close button
Footer: Optional, fixed at bottom
Body: Scrollable
Animation: Fade in + scale (300ms)
```

---

## Screen Specifications

### 1. Splash Screen

```
Duration: 1.5s
Elements:
  - App logo (centered, 120x120)
  - App name (below logo, Heading 1)
  - Animated gradient background
  - Loading indicator (after 1s if needed)
```

### 2. Onboarding Flow (3 Screens)

#### Onboarding 1: Welcome

```
Layout:
  - Illustration (full width, top 50%)
  - Heading: "Transform Dreams into Reality"
  - Body: Brief value proposition
  - Page indicators (dots)
  - CTA: "Get Started"
  - Skip button (top right)
```

#### Onboarding 2: How It Works

```
Layout:
  - Three-step visual guide
  - Icons with descriptions
  - Heading: "Your Personal Success Coach"
  - CTA: "Continue"
```

#### Onboarding 3: Permissions

```
Layout:
  - Permission cards (Notifications, Analytics)
  - Clear benefit statements
  - CTA: "Enable" and "Maybe Later"
```

### 3. Authentication Screens

#### Sign In

```
Layout:
  - Logo (top, centered)
  - Welcome message
  - Email input
  - Password input
  - "Forgot Password?" link
  - Sign In button (Primary)
  - Divider with "or"
  - Social login buttons (Apple, Google)
  - "Don't have an account? Sign Up" link
Spacing: Comfortable, 24px between sections
```

#### Sign Up

```
Similar to Sign In with:
  - Name input
  - Email input
  - Password input
  - Password confirmation
  - Terms acceptance checkbox
  - Sign Up button
```

### 4. Goal Creation Wizard (5-Step Simplified Form)

**Design Principle**: Keep the wizard short to maximize completion rate. 5 steps is optimal.

#### Step 1: Goal Type & Description

```
Header:
  - Progress indicator (Step 1 of 5)
  - Back button
  - Exit (save draft) button

Content:
  - "What's your big goal?" (Heading 1)
  - Goal category selector (grid of 6 cards):
    * Career & Business
    * Health & Fitness
    * Financial Freedom
    * Personal Growth
    * Creative Projects
    * Other
  - Goal title input
    Placeholder: "E.g., Launch a successful SaaS product"
  - Goal description (TextArea)
    Placeholder: "Describe what success looks like for you..."

Footer:
  - Next button (disabled until valid)
```

#### Step 2: Timeline & Urgency

```
Content:
  - "When do you want to achieve this?" (Heading 2)
  - Target date picker (calendar interface)
  - Urgency level selector (3 options):
    * Flexible - "I'll get there eventually"
    * Moderate - "I have a target date"
    * Urgent - "This is time-sensitive"

Footer:
  - Back button
  - Next button
```

#### Step 3: Your Context (Personal + Financial Combined)

```
Content:
  - "Tell us about yourself" (Heading 2)

  Personal Section:
  - Age range selector (dropdown: 18-24, 25-34, 35-44, 45-54, 55+)
  - Current life situation (multi-select chips):
    * Full-time job
    * Part-time job
    * Student
    * Self-employed
    * Parent/Caregiver
    * Other commitments
  - Weekly time available for this goal (slider: 1-40 hours)

  Financial Section:
  - Budget for this goal (optional, range selector):
    * No budget needed
    * $0 - $500
    * $500 - $2,000
    * $2,000 - $10,000
    * $10,000+

Footer:
  - Back button
  - Next button
```

#### Step 4: Skills & Challenges (Combined)

```
Content:
  - "Your Starting Point" (Heading 2)

  Skills Section:
  - Experience level in this area (slider 1-10 with labels):
    * 1-3: Beginner
    * 4-6: Intermediate
    * 7-10: Advanced
  - Relevant skills you have (optional, text input with chips)

  Challenges Section:
  - "What might hold you back?" (optional multi-select):
    * Limited time
    * Limited budget
    * Lack of knowledge
    * Lack of support
    * Past failures
    * Other (text input)

Footer:
  - Back button
  - Next button
```

#### Step 5: Preferences & Launch

```
Content:
  - "Personalize Your Experience" (Heading 2)

  Task Preferences:
  - Daily task count (selector: 1-3, 3-5, 5-7, 7+)
  - Preferred notification time (time picker with presets):
    * Morning (8:00 AM)
    * Afternoon (1:00 PM)
    * Evening (6:00 PM)
    * Custom

  Motivation Style (card selector):
    * 🌿 Gentle - "Encouraging and patient"
    * ⚖️ Balanced - "Supportive but firm"
    * 🔥 Intense - "Push me hard"

  Summary Preview:
  - Goal title
  - Target date
  - Time commitment per week

Footer:
  - Back button
  - "Generate My Plan" button (Primary, larger, with sparkle icon)
```

### 5. AI Analysis & Plan Generation Screen

```
Layout:
  - Animated illustration (AI thinking visual)
  - "Analyzing your goal..." (Heading 2)
  - Progress steps with checkmarks:
    ✓ Analyzing your timeline
    ✓ Assessing resources
    ✓ Identifying milestones
    → Creating your personalized plan
    - Generating daily tasks
  - "This usually takes 30-60 seconds"
  - Background: Subtle animated gradient

Transitions:
  - Each step checks off with animation
  - Final: Success animation
  - Navigate to Plan Overview
```

### 6. Plan Overview Screen

```
Header:
  - "Your Success Plan" (Heading 1)
  - Goal title below
  - Edit button (top right)

Content (Scrollable):

  Section 1: Plan Summary Card
    - AI-generated overview (2-3 sentences)
    - Key success factors (3 bullet points)
    - Estimated completion timeline
    - Difficulty rating with explanation

  Section 2: Milestones Timeline
    - Vertical timeline component
    - 5-8 major milestones
    - Each milestone shows:
      * Title
      * Target date
      * Key activities
      * Tap to expand details

  Section 3: Resource Requirements
    - Time commitment (per week)
    - Financial investment (if any)
    - Skills to develop
    - Support needed

  Section 4: Risk Assessment
    - Identified challenges
    - Mitigation strategies
    - Alternative approaches

  Section 5: Success Metrics
    - How progress will be measured
    - Key performance indicators
    - Review schedule

Footer:
  - "Start My Journey" button (Primary, sticky)
```

### 7. Dashboard / Home Screen

```
Header:
  - Greeting: "Good morning, [Name]" (Heading 2)
  - Current date
  - Notification bell icon
  - Profile avatar (top right)

Content (Scrollable):

  Section 1: Today's Focus Card
    - "Your Tasks for Today" (Heading 3)
    - Task count badge
    - Next task preview
    - "View All" link
    - Motivational quote (rotates daily)

  Section 2: Active Goals (Horizontal Carousel)
    - Goal cards (swipeable)
    - Each shows:
      * Goal title
      * Progress ring (circular)
      * Days remaining
      * Next milestone
      * Tap to open goal details

  Section 3: This Week's Progress (Stats Grid)
    - 2x2 grid of stat cards:
      * Tasks Completed
      * Current Streak
      * Time Invested
      * Goals on Track

  Section 4: Upcoming Milestones
    - Next 3 milestones across all goals
    - Countdown timers
    - Preparation status

  Section 5: Insights & Recommendations
    - AI-generated weekly insight
    - Adjustment suggestions
    - Celebration of wins

Bottom Navigation:
  - Home (active)
  - Tasks
  - Goals
  - Progress
  - Profile
```

### 8. Daily Tasks Screen

```
Header:
  - Date selector (swipeable calendar strip)
  - Filter icon (All, By Goal, By Priority)
  - Add task button

Content:

  Section 1: Task Groups
    Organized by:
    - Overdue (if any) - red accent
    - High Priority - orange accent
    - Standard - default
    - Completed (collapsible) - green accent

  Each Task Card shows:
    - Checkbox (custom animated)
    - Task title (Body)
    - Associated goal (small badge with color)
    - Time estimate
    - Priority indicator
    - Swipe actions:
      → Swipe right: Complete
      → Swipe left: Options (Reschedule, Delete)

  Section 2: Tomorrow Preview
    - Collapsed by default
    - Shows next day's tasks
    - "Plan Tomorrow" button

Empty State:
  - Illustration
  - "All caught up!"
  - Motivational message
  - "Add a task" button

Bottom Sheet (on task tap):
  - Full task details
  - Description
  - Related milestone
  - Notes section
  - Mark complete button
  - Edit/Delete options
```

### 9. Goal Details Screen

```
Header:
  - Back button
  - Goal title (Heading 1)
  - Edit button
  - More options (3 dots)

Hero Section:
  - Large circular progress indicator
  - Completion percentage
  - Days remaining
  - Visual motivational element

Tabs:
  - Overview (default)
  - Tasks
  - Progress
  - Plan

Tab 1: Overview
  - Goal description
  - Current milestone highlight
  - Next 5 upcoming tasks
  - Recent achievements
  - Quick stats (time spent, completion rate)

Tab 2: Tasks
  - All tasks for this goal
  - Filterable by status
  - Grouped by milestone
  - Add task option

Tab 3: Progress
  - Progress chart (line/bar)
  - Milestone completion timeline
  - Habit tracking grid (if applicable)
  - Historical performance
  - Insights and trends

Tab 4: Plan
  - Full plan view (same as Plan Overview)
  - Adjustable sections
  - "Request Plan Update" button
  - Plan history (previous versions)

Floating Action Button:
  - Quick task add for this goal
```

### 10. Progress & Analytics Screen

```
Header:
  - "Your Progress" (Heading 1)
  - Time range selector (Week, Month, All Time)
  - Export report button

Content:

  Section 1: Overall Stats
    - Large stat cards (2x2 grid)
    - Total goals
    - Completion rate
    - Active streak
    - Total time invested

  Section 2: Detailed Charts
    - Task completion over time (line chart)
    - Goals by category (donut chart)
    - Daily activity heatmap
    - Productivity patterns (bar chart by hour/day)

  Section 3: Achievements
    - Unlocked badges/milestones
    - Visual achievement gallery
    - Next achievement preview

  Section 4: AI Insights
    - Performance analysis
    - Trend identification
    - Recommendations for improvement
    - Celebration of wins

  Section 5: Compare & Reflect
    - Week-over-week comparison
    - Month-over-month
    - Personal bests
```

### 11. Profile & Settings Screen

```
Header:
  - Profile avatar (large, editable)
  - Name
  - Member since date
  - Edit profile button

Content (Grouped Lists):

  Account Section:
    - Personal information
    - Email and password
    - Connected accounts

  Preferences Section:
    - Notification settings
    - Daily task preferences
    - Motivation style
    - Theme (Light/Dark/Auto)
    - Language

  Goals Section:
    - Default goal settings
    - AI preferences
    - Task generation settings

  Data & Privacy:
    - Data export
    - Privacy settings
    - Delete account

  Support Section:
    - Help center
    - Contact support
    - Rate the app
    - Share with friends

  About Section:
    - App version
    - Terms of service
    - Privacy policy
    - Licenses

Footer:
  - Sign out button
```

---

## Interactions & Animations

### Micro-interactions

1. **Button Press**
   - Scale: 0.95
   - Duration: 150ms
   - Haptic feedback: Light

2. **Task Completion**
   - Checkbox: Checkmark draw animation
   - Card: Fade to green tint
   - Confetti burst (for milestone tasks)
   - Haptic: Success pattern

3. **Swipe Actions**
   - Card slides with friction
   - Icons fade in progressively
   - Color changes based on action
   - Snap back or complete based on threshold

4. **Progress Updates**
   - Numbers count up animation
   - Progress bars fill smoothly
   - Circular progress animates clockwise
   - Duration: 800ms

### Screen Transitions

1. **Standard Navigation**
   - Slide from right (iOS native)
   - Duration: 350ms
   - Easing: ease-in-out

2. **Modal Presentation**
   - Slide up from bottom
   - Background dim (overlay)
   - Duration: 400ms

3. **Tab Changes**
   - Crossfade content
   - Slide active indicator
   - Duration: 200ms

### Loading States

1. **Skeleton Screens**
   - Use for initial loads
   - Shimmer animation
   - Match actual content layout

2. **Spinners**
   - Use for quick operations (< 2s)
   - Centered, with optional text
   - Size: 32px

3. **Progress Indicators**
   - Use for long operations
   - Show percentage if possible
   - Cancelable if appropriate

---

## Accessibility Guidelines

### Touch Targets

- Minimum: 44x44 points
- Preferred: 48x48 points
- Spacing between targets: 8px minimum

### Color Contrast

- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### Screen Reader Support

- All interactive elements labeled
- Meaningful hierarchy
- Announce state changes
- Skip navigation options

### Dynamic Type

- Support iOS text size settings
- Test at largest size
- Ensure layouts adapt
- Don't break at any size

### Motion

- Respect "Reduce Motion" setting
- Provide non-animated alternatives
- Avoid excessive animation
- Make critical animations optional

---

## Responsive Design

### Breakpoints

```
Small phones:  < 375px width
Medium phones: 375px - 428px
Large phones:  > 428px
Tablets:       > 768px (support basic layout)
```

### Adaptive Layouts

- Cards: Full width on small, grid on large
- Stats: 2 columns on small, 3-4 on large
- Text: Scale appropriately
- Images: Maintain aspect ratio
- Buttons: Full width < 375px, auto on larger

---

## Empty States

### No Goals Yet

```
- Illustration (inspiring, goal-related)
- Heading: "Ready to achieve something amazing?"
- Body: Brief explanation
- CTA: "Create Your First Goal" (Primary button)
```

### No Tasks Today

```
- Illustration (relaxed character)
- Heading: "All done for today!"
- Body: "Great work! Check tomorrow's tasks or create a new goal."
- CTA: "View Tomorrow" or "Create Goal"
```

### No Data Yet

```
- Illustration (chart/graph)
- Heading: "Your progress will appear here"
- Body: "Complete tasks to see your analytics"
```

---

## Error States

### Network Error

```
- Icon: Cloud with X
- Heading: "Connection Lost"
- Body: "Check your internet and try again"
- CTA: "Retry" button
```

### AI Generation Failed

```
- Icon: Alert symbol
- Heading: "Couldn't Generate Plan"
- Body: Specific error message
- CTA: "Try Again" button
- Secondary: "Contact Support" link
```

### Form Validation Error

```
- Inline: Red border on field
- Icon: Exclamation mark
- Message: Clear, specific error
- Position: Below field
```

---

## Platform-Specific Guidelines

### iOS Design Considerations

1. **Navigation**
   - Use native navigation bar
   - Back button always present
   - Title centered or large title

2. **Safe Areas**
   - Respect notch and home indicator
   - Content should not overlap
   - Use SafeAreaView component

3. **Haptic Feedback**
   - Use for significant actions
   - Different patterns for different actions
   - Don't overuse

4. **Native Patterns**
   - Pull to refresh
   - Swipe gestures
   - Bottom sheets for actions
   - Action sheets for destructive actions

5. **Status Bar**
   - Style matches screen theme
   - Dark content on light backgrounds
   - Light content on dark backgrounds

---

## Design Deliverables Checklist

For AI code agent implementation:

- [ ] All color values in hex format
- [ ] All spacing values in pixels
- [ ] All font sizes and weights specified
- [ ] Component dimensions clearly stated
- [ ] Border radius values provided
- [ ] Shadow/elevation specifications
- [ ] Animation durations and easing
- [ ] Touch target sizes
- [ ] Accessibility requirements
- [ ] Platform-specific notes
- [ ] Empty and error state designs
- [ ] Loading state specifications
- [ ] All screen layouts described
- [ ] Navigation flow documented
- [ ] Interaction patterns defined

---

## Tools for Development

### Design Tools

- Figma: For detailed mockups (optional but recommended)
- Sketch: Alternative design tool
- Adobe XD: Another alternative

### Prototyping

- Figma prototyping
- React Native Paper for quick UI
- Expo for fast iteration

### Asset Export

- SVG for icons (react-native-svg)
- PNG for complex illustrations (multiple sizes)
- Webp for photos (optimized)

---

## Next Steps for Implementation

1. Set up design tokens in code (colors, spacing, typography)
2. Create reusable component library based on specs
3. Implement theme system (light/dark mode)
4. Build navigation structure
5. Create screen layouts with placeholder content
6. Add interactions and animations
7. Implement accessibility features
8. Test on various device sizes
9. Polish and refine

---

**This specification should serve as the single source of truth for all UI/UX decisions during development.**
