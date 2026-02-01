# DreamPath - App Store Submission Guide

## Complete iOS App Store Submission Checklist

This guide covers everything needed to successfully submit DreamPath to the iOS App Store.

---

## Pre-Submission Requirements

### Apple Developer Account

- [ ] Active Apple Developer Program membership ($99/year)
- [ ] Account in good standing
- [ ] App Store Connect access enabled

### App Store Connect Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: DreamPath
   - Primary Language: English (U.S.)
   - Bundle ID: Select from dropdown (must match EAS config)
   - SKU: dreampath-ios-v1 (unique identifier for your records)
   - User Access: Full Access

---

## App Information

### Basic Information

| Field                   | Value                                |
| ----------------------- | ------------------------------------ |
| **Name**                | DreamPath - AI Goal Planner          |
| **Subtitle** (30 chars) | Turn Dreams Into Daily Actions       |
| **Primary Category**    | Productivity                         |
| **Secondary Category**  | Lifestyle                            |
| **Content Rights**      | Does not contain third-party content |

### App Description (4000 chars max)

```
Transform your biggest dreams into achievable daily actions with DreamPath, your AI-powered personal success coach.

🎯 SET AMBITIOUS GOALS
Whether you're launching a business, getting fit, building wealth, or pursuing any life-changing goal, DreamPath helps you define exactly what you want to achieve.

🤖 AI-POWERED PERSONALIZATION
Our intelligent AI analyzes your unique situation—your time, resources, skills, and constraints—to create a plan that actually works for YOUR life. No generic advice, just strategies tailored to you.

📋 DAILY TASKS THAT MATTER
Receive personalized daily tasks designed to move you forward. Each task is sized to fit your available time and energy, making consistent progress inevitable.

📊 TRACK YOUR JOURNEY
Watch your progress with beautiful visualizations. Celebrate milestones, maintain streaks, and see how far you've come.

🔄 ADAPTIVE PLANS
Life changes, and so does your plan. DreamPath adjusts your roadmap based on your progress, helping you stay on track even when obstacles arise.

✨ KEY FEATURES:
• Smart goal creation wizard
• AI-generated personalized action plans
• Daily task management with priorities
• Progress tracking and analytics
• Milestone celebrations
• Customizable notifications
• Offline support
• Dark mode

💡 PERFECT FOR:
• Entrepreneurs building their dream business
• Professionals advancing their careers
• Fitness enthusiasts on transformation journeys
• Creatives working on passion projects
• Anyone with big goals and the determination to achieve them

Your dreams deserve more than wishful thinking. With DreamPath, you get a strategic partner that turns ambition into action, one day at a time.

Download now and take the first step toward your extraordinary future.

---
Questions or feedback? Contact us at support@dreampath.app
```

### Keywords (100 chars max)

```
goals,planner,ai,productivity,habits,tasks,motivation,success,achievement,personal growth,todo
```

### What's New (Version Release Notes)

```
Welcome to DreamPath! 🚀

This is our first release, packed with features to help you achieve your biggest goals:

• Create and manage ambitious goals
• Get AI-powered personalized plans
• Receive daily tasks tailored to your life
• Track progress with beautiful charts
• Celebrate milestone achievements

We're just getting started. More features coming soon!

Questions? Reach out at support@dreampath.app
```

---

## App Privacy

### Privacy Policy

**Required**: Host your privacy policy at a public URL.

Example URL: `https://dreampath.app/privacy`

Key points to include:

1. What data you collect
2. How you use the data
3. Third-party services (Firebase, OpenAI)
4. Data retention and deletion
5. User rights

### App Privacy Questionnaire

Complete in App Store Connect → App Privacy:

#### Data Collection Details

| Data Type                    | Collected | Usage                                   |
| ---------------------------- | --------- | --------------------------------------- |
| **Contact Info - Email**     | Yes       | Account creation, communications        |
| **Contact Info - Name**      | Yes       | Profile personalization                 |
| **User Content**             | Yes       | Goals, tasks, notes (core app function) |
| **Identifiers - User ID**    | Yes       | Account management                      |
| **Usage Data**               | Yes       | Analytics, app improvement              |
| **Diagnostics - Crash Data** | No (MVP)  | Will add post-MVP                       |

#### Data Linked to User

- Email Address
- Name
- User ID
- User Content (goals, tasks)
- Usage Data

#### Data NOT Linked to User

- Diagnostics (if added later)

#### Tracking

Select: **No** - We do not track users across apps/websites for advertising.

---

## Visual Assets

### App Icon

**Specifications:**

- Size: 1024x1024 pixels
- Format: PNG (no transparency, no rounded corners - Apple adds these)
- Color space: sRGB or P3
- No alpha channel

**Design Guidelines:**

- Simple, recognizable at small sizes
- Avoid text (doesn't scale well)
- Use bold colors that stand out
- Follow iOS design language

### Screenshots

**Required Sizes:**

| Device         | Size (pixels) | Required                |
| -------------- | ------------- | ----------------------- |
| iPhone 6.7"    | 1290 x 2796   | Yes (iPhone 15 Pro Max) |
| iPhone 6.5"    | 1284 x 2778   | Yes (iPhone 14 Pro Max) |
| iPhone 5.5"    | 1242 x 2208   | Yes (iPhone 8 Plus)     |
| iPad Pro 12.9" | 2048 x 2732   | Only if supporting iPad |

**Screenshot Requirements:**

- Minimum: 3 screenshots per size
- Maximum: 10 screenshots per size
- Format: PNG or JPEG
- No alpha/transparency

**Screenshot Content Suggestions:**

1. **Hero Shot**: Dashboard with progress overview
   - Headline: "Turn Dreams Into Daily Actions"
2. **Goal Creation**: Wizard showing goal setup
   - Headline: "Set Ambitious Goals"
3. **AI Plan**: Generated plan with milestones
   - Headline: "AI-Powered Personal Plans"
4. **Daily Tasks**: Task list view
   - Headline: "Know Exactly What To Do Each Day"
5. **Progress**: Analytics and charts
   - Headline: "Track Your Journey"
6. **Achievement**: Milestone celebration
   - Headline: "Celebrate Every Win"

### App Preview Video (Optional but Recommended)

**Specifications:**

- Duration: 15-30 seconds
- Resolution: Same as screenshot sizes
- Format: H.264, M4V, MP4, or MOV
- Frame rate: 30 fps

**Content Tips:**

- Show the app in action
- Start with a hook (first 3 seconds matter)
- No hands/fingers (use auto-advance)
- Include captions (many watch muted)

---

## App Review Preparation

### Demo Account

Provide test credentials for App Review team:

```
Email: demo@dreampath.app
Password: DreamPathDemo2024!
```

**Important**: Create this account with:

- Pre-populated goals and tasks
- Some completed tasks (shows progress features)
- Active milestone progress
- Works without needing real AI calls (use cached responses)

### Review Notes

```
Thank you for reviewing DreamPath!

DEMO ACCOUNT:
Email: demo@dreampath.app
Password: DreamPathDemo2024!

TESTING NOTES:
1. The app uses AI to generate personalized plans. For the demo account, plans are pre-generated to avoid API delays during review.

2. To test goal creation:
   - Tap "Create New Goal"
   - Follow the 5-step wizard
   - AI will generate a plan (may take 30-60 seconds)

3. To test task completion:
   - Go to "Today's Tasks"
   - Swipe right on a task to complete it
   - View progress update in Dashboard

4. Push notifications require device registration. They work on physical devices but not in Simulator.

5. Sign in with Apple is fully functional and can be tested with any Apple ID.

CONTACT:
If you have any questions, please contact: review@dreampath.app
We typically respond within 2 hours during business hours (9am-6pm PST).
```

---

## Common Rejection Reasons & Prevention

### 1. Incomplete Information (Guideline 2.1)

**Prevention:**

- [ ] All app metadata is complete
- [ ] Screenshots show actual app (not mockups)
- [ ] Description matches app functionality
- [ ] Demo account works and is documented

### 2. Crashes and Bugs (Guideline 2.1)

**Prevention:**

- [ ] Test all user flows before submission
- [ ] Test on oldest supported iOS version (iOS 14)
- [ ] Test offline behavior
- [ ] Test with poor network conditions
- [ ] No console errors/warnings in production build

### 3. Placeholder Content (Guideline 2.3.3)

**Prevention:**

- [ ] Remove all "lorem ipsum" text
- [ ] Remove "test" or "TODO" labels
- [ ] Replace placeholder images
- [ ] Remove debug features from production

### 4. Privacy Issues (Guideline 5.1)

**Prevention:**

- [ ] Request only necessary permissions
- [ ] Explain each permission request clearly
- [ ] Privacy policy URL is valid and loads
- [ ] App Privacy questionnaire is accurate
- [ ] No hidden data collection

### 5. Login/Account Issues (Guideline 4.8)

**Prevention:**

- [ ] Sign in with Apple is implemented (if social login exists)
- [ ] Guest mode available OR clear value for account
- [ ] Account deletion option available
- [ ] Login errors are handled gracefully

### 6. Performance Issues (Guideline 4.2)

**Prevention:**

- [ ] App launches in < 5 seconds
- [ ] No ANR (App Not Responding)
- [ ] Memory usage is reasonable
- [ ] Works on older devices (iPhone 8+)

---

## EAS Build & Submit

### Build for App Store

```bash
# Ensure you're logged in
eas login

# Create production build
eas build --platform ios --profile production

# This will:
# 1. Build the app
# 2. Sign with your certificates (EAS manages this)
# 3. Upload to Expo's servers
# 4. Return a build URL

# Wait for build to complete (10-30 minutes)
```

### Submit to App Store

```bash
# Submit the build to App Store Connect
eas submit --platform ios

# OR specify a specific build
eas submit --platform ios --latest

# You'll need:
# - Apple ID
# - App-specific password (generate at appleid.apple.com)
# - App Store Connect App ID (from App Store Connect)
```

### Alternative: Manual Upload

1. Download the .ipa from EAS dashboard
2. Open **Transporter** app (free on Mac App Store)
3. Sign in with Apple ID
4. Drag & drop .ipa file
5. Click "Deliver"

---

## Post-Submission

### Waiting for Review

- Initial review: 24-48 hours typically
- First submission may take longer
- You'll receive email updates

### If Rejected

1. Read rejection reason carefully
2. Check Resolution Center in App Store Connect
3. Fix the issues
4. Reply in Resolution Center or submit new build
5. Re-submit for review

### If Approved

1. Set release date (manual or automatic)
2. Prepare marketing materials
3. Monitor crash reports and reviews
4. Respond to user feedback quickly

---

## Release Checklist

### Before Release

- [ ] Final QA on production build
- [ ] Test demo account still works
- [ ] Privacy policy is live
- [ ] Support email is monitored
- [ ] Analytics is tracking correctly
- [ ] Social media accounts ready

### Release Day

- [ ] Release app (manual) or verify auto-release
- [ ] Announce on social media
- [ ] Send email to waiting list (if any)
- [ ] Monitor for crashes
- [ ] Monitor reviews

### Post-Release

- [ ] Respond to reviews within 24 hours
- [ ] Track key metrics (downloads, retention)
- [ ] Collect user feedback
- [ ] Plan next update based on feedback
- [ ] Celebrate! 🎉

---

## Pricing & Availability

### Initial Launch Strategy

**Recommended**: Launch as **Free** app initially

**Reasoning:**

1. Reduce barrier to downloads
2. Gather user feedback quickly
3. Build initial user base
4. Add premium features later

### Future Monetization Options

1. **Freemium**: Basic features free, premium for power users
2. **Subscription**: Monthly/yearly for AI features
3. **One-time Purchase**: Lifetime access

### Availability

- [ ] All countries (recommended for launch)
- [ ] Or select specific countries if region-restricted

---

## Support Infrastructure

### Required Before Launch

1. **Support Email**: support@dreampath.app
2. **Privacy Policy**: https://dreampath.app/privacy
3. **Terms of Service**: https://dreampath.app/terms
4. **Marketing Website**: https://dreampath.app (optional but recommended)

### Response Time Goals

- App Store Reviews: Within 24 hours
- Support Emails: Within 48 hours
- Critical Issues: Within 4 hours

---

## App Store Optimization (ASO)

### Keywords Strategy

**Primary Keywords** (in title/subtitle):

- AI
- Goal
- Planner

**Secondary Keywords** (in keyword field):

- productivity, habits, tasks, motivation, success, achievement, personal growth, todo

### Localization (Future)

Consider localizing for:

- Spanish (large market)
- German (high paying users)
- Japanese (app-friendly market)
- Portuguese (Brazil)

---

## Timeline Estimate

| Phase                       | Duration      |
| --------------------------- | ------------- |
| Prepare metadata & assets   | 1-2 days      |
| Build production app        | 1 day         |
| Submit to App Store         | 1 day         |
| App Review                  | 1-3 days      |
| Address rejections (if any) | 1-5 days      |
| **Total**                   | **4-12 days** |

---

**Good luck with your submission! 🚀🍎**
