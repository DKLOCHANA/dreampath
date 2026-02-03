// src/presentation/screens/onboarding/onboardingData.ts

export interface Answer {
    answerId: string;
    text: string;
    icon: string;
    userProfile: string;
    report: {
        headline: string;
        painPoint: string;
        solution: string;
        benefits: string[];
        transformation: string;
        emotionalHook: string;
        socialProof: string;
        urgency?: string;
    };
}

export interface Question {
    questionId: number;
    question: string;
    psychologyNote: string;
    answers: Answer[];
}

export interface OnboardingData {
    welcomeScreen: {
        logo: string;
        slogan: string;
        subtitle: string;
        ctaButton: string;
    };
    questions: Question[];
    finalWelcomeScreen: {
        headline: string;
        subheadline: string;
        personalizedMessage: string;
        commitmentStatement: string;
        features: string[];
        urgencyMessage: string;
        ctaPrimary: string;
        ctaSecondary: string;
        trustElements: string[];
    };
}

export const onboardingData: OnboardingData = {
    welcomeScreen: {
        logo: "DreamPath",
        slogan: "Transform Dreams into Reality",
        subtitle: "Your AI-powered success coach that turns big goals into daily wins",
        ctaButton: "Get Started"
    },
    questions: [
        {
            questionId: 1,
            question: "What's the biggest obstacle preventing you from achieving your most important goal?",
            psychologyNote: "Targets core pain point - identifies primary blocker",
            answers: [
                {
                    answerId: "1a",
                    text: "I don't know where to start or what steps to take",
                    icon: "compass-outline",
                    userProfile: "The Overwhelmed Dreamer",
                    report: {
                        headline: "You're Not Alone in Feeling Lost",
                        painPoint: "67% of people with big goals fail because they lack a clear roadmap. Without knowing the first step, even the most motivated people stay stuck.",
                        solution: "DreamPath's AI Success Coach Creates Your Custom Roadmap",
                        benefits: [
                            "Get a personalized, step-by-step plan tailored to YOUR specific situation",
                            "AI analyzes your timeline, resources, and constraints to create realistic milestones",
                            "Never wonder 'what's next?' - receive clear daily tasks that build momentum",
                            "See exactly how each action connects to your ultimate goal"
                        ],
                        transformation: "From confused and stuck → Clear direction with confidence",
                        emotionalHook: "Imagine waking up each day knowing exactly what to do to get closer to your dream.",
                        socialProof: "Join 10,000+ users who went from 'I don't know how' to 'I'm making real progress'"
                    }
                },
                {
                    answerId: "1b",
                    text: "I start strong but lose motivation after a few weeks",
                    icon: "trending-down-outline",
                    userProfile: "The Enthusiastic Starter",
                    report: {
                        headline: "The Motivation Trap: Why Willpower Fails",
                        painPoint: "92% of New Year's resolutions fail by February. Relying on motivation alone is like driving with an empty gas tank - you won't get far.",
                        solution: "DreamPath Builds Sustainable Systems, Not Temporary Motivation",
                        benefits: [
                            "Daily AI-generated tasks keep you engaged with fresh, achievable challenges",
                            "Smart progress tracking shows you're winning even on 'bad' days",
                            "Adaptive planning adjusts when life gets in the way - no more guilt or giving up",
                            "Milestone celebrations trigger dopamine hits that rewire your motivation system"
                        ],
                        transformation: "From boom-and-bust cycles → Steady, sustainable progress",
                        emotionalHook: "What if you could maintain that Week 1 energy all the way to the finish line?",
                        socialProof: "Users report 4.5x longer goal pursuit compared to traditional methods"
                    }
                },
                {
                    answerId: "1c",
                    text: "I'm too busy with daily responsibilities and work",
                    icon: "time-outline",
                    userProfile: "The Time-Starved Achiever",
                    report: {
                        headline: "You Don't Need More Time - You Need Smarter Time",
                        painPoint: "The average person wastes 2+ hours daily on unproductive activities while claiming 'no time' for their dreams. It's not about having time - it's about using it strategically.",
                        solution: "DreamPath Maximizes Your Available Time, No Matter How Busy",
                        benefits: [
                            "AI considers YOUR actual schedule, responsibilities, and energy levels",
                            "Micro-tasks designed for your available time slots (even 15-minute windows)",
                            "Intelligent scheduling fits goal work into your real life, not fantasy time",
                            "Track time invested vs. wasted - see where your dream really ranks"
                        ],
                        transformation: "From 'someday when I have time' → Making progress in the time you already have",
                        emotionalHook: "Your future self is counting on the decisions you make today with your 24 hours.",
                        socialProof: "Busy professionals achieve goals 3x faster by working smarter, not longer"
                    }
                },
                {
                    answerId: "1d",
                    text: "I doubt whether my goal is realistic or achievable",
                    icon: "help-circle-outline",
                    userProfile: "The Self-Doubter",
                    report: {
                        headline: "Self-Doubt is a Liar - Let Data Tell the Truth",
                        painPoint: "Impostor syndrome and self-doubt kill more dreams than actual failure ever could. Your brain is wired to protect you from risk, not help you grow.",
                        solution: "DreamPath Gives You Objective, AI-Powered Feasibility Analysis",
                        benefits: [
                            "AI assesses your goal against your actual resources, skills, and timeline",
                            "Get honest feedback with alternative approaches if needed - no false hope",
                            "See success patterns from similar goals achieved by others",
                            "Risk mitigation strategies address your specific concerns before they derail you"
                        ],
                        transformation: "From paralyzing doubt → Evidence-based confidence",
                        emotionalHook: "What if the only thing standing between you and your goal is the story you're telling yourself?",
                        socialProof: "78% of 'doubters' discover their goals were more achievable than they thought"
                    }
                }
            ]
        },
        {
            questionId: 2,
            question: "How do you typically track progress on important goals?",
            psychologyNote: "Reveals organizational habits and need for structure",
            answers: [
                {
                    answerId: "2a",
                    text: "I keep everything in my head",
                    icon: "bulb-outline",
                    userProfile: "The Mental Juggler",
                    report: {
                        headline: "Your Brain is Not a Filing Cabinet",
                        painPoint: "Your brain has limited working memory - only 4-7 items. When you try to 'remember' your goals, tasks, and progress, you're using mental energy that should go toward ACHIEVING, not REMEMBERING.",
                        solution: "DreamPath Becomes Your External Goal Management Brain",
                        benefits: [
                            "Offload 100% of goal tracking to free up mental energy for execution",
                            "Never lose track of important tasks buried in your mental to-do list",
                            "Visual progress tracking shows momentum you can't 'feel' mentally",
                            "AI remembers patterns and insights you'd never catch on your own"
                        ],
                        transformation: "From mental exhaustion → Cognitive freedom and clarity",
                        emotionalHook: "Imagine the relief of never having that 3 AM panic about 'what am I forgetting?'",
                        socialProof: "Users report 63% reduction in goal-related stress and anxiety"
                    }
                },
                {
                    answerId: "2b",
                    text: "I use journals, notebooks, or spreadsheets",
                    icon: "book-outline",
                    userProfile: "The Analog Organizer",
                    report: {
                        headline: "Static Tools Can't Keep Pace with Dynamic Life",
                        painPoint: "Life doesn't follow your perfect spreadsheet. When things change (and they always do), static tools become outdated burdens instead of helpful guides. You spend more time updating systems than making progress.",
                        solution: "DreamPath Automatically Adapts to Your Changing Reality",
                        benefits: [
                            "AI adjusts your plan when life throws curveballs - no manual replanning needed",
                            "Instant insights and analytics that would take hours to calculate manually",
                            "All your goals, tasks, and progress in one place - accessible anywhere",
                            "Real-time updates mean your plan is always current, never stale"
                        ],
                        transformation: "From rigid planning → Flexible, living strategy",
                        emotionalHook: "Your goals deserve a system as dynamic and resilient as you are.",
                        socialProof: "Former spreadsheet users save 5+ hours monthly on planning and tracking"
                    }
                },
                {
                    answerId: "2c",
                    text: "I don't really track - I just try to remember to work on it",
                    icon: "eye-off-outline",
                    userProfile: "The Flying Blind Doer",
                    report: {
                        headline: "You Can't Improve What You Don't Measure",
                        painPoint: "Without tracking, you have no idea if you're making progress or just staying busy. Most people vastly overestimate how much they're doing and underestimate how long things take. This leads to frustration and quitting.",
                        solution: "DreamPath Shows You Exactly Where You Stand, Every Day",
                        benefits: [
                            "See real progress metrics - no more guessing if you're getting closer",
                            "Identify what's actually working vs. what's wasting time",
                            "Celebrate micro-wins you didn't even know you had",
                            "Predictive insights show when you'll reach milestones at your current pace"
                        ],
                        transformation: "From wandering aimlessly → Moving with purpose and precision",
                        emotionalHook: "What gets measured gets improved. What gets improved changes your life.",
                        socialProof: "Non-trackers see 5.7x improvement when they start measuring progress"
                    }
                },
                {
                    answerId: "2d",
                    text: "I've tried various apps but nothing stuck",
                    icon: "apps-outline",
                    userProfile: "The App Hopper",
                    report: {
                        headline: "Generic Apps Fail Because They're Not Built for YOUR Goals",
                        painPoint: "To-do apps are for tasks. Habit trackers are for routines. Project managers are for teams. None of these were designed for BIG PERSONAL GOALS that require strategy, adaptation, and long-term commitment.",
                        solution: "DreamPath is Purpose-Built for Ambitious Personal Achievement",
                        benefits: [
                            "Not just tracking - full AI-powered strategic planning and daily guidance",
                            "Adapts to your goal type (career, business, fitness, financial, creative)",
                            "Combines planning + execution + motivation + analytics in one unified system",
                            "Designed for the long game - months and years, not just weeks"
                        ],
                        transformation: "From tool frustration → The last goal app you'll ever need",
                        emotionalHook: "Stop collecting productivity apps. Start collecting achievements.",
                        socialProof: "94% of users say DreamPath is the first goal app that 'gets it'"
                    }
                }
            ]
        },
        {
            questionId: 3,
            question: "When working toward a big goal, what usually derails you?",
            psychologyNote: "Identifies specific failure patterns and triggers urgency",
            answers: [
                {
                    answerId: "3a",
                    text: "Unexpected obstacles or setbacks discourage me",
                    icon: "alert-circle-outline",
                    userProfile: "The Fragile Planner",
                    report: {
                        headline: "Obstacles Are Inevitable - Your Response Isn't",
                        painPoint: "The difference between people who achieve goals and those who don't isn't fewer obstacles - it's better obstacle management. One setback shouldn't mean total derailment, but without a resilient system, it often does.",
                        solution: "DreamPath Builds Resilience Into Your Plan From Day One",
                        benefits: [
                            "AI identifies potential obstacles before they hit and creates mitigation plans",
                            "When setbacks happen, get instant alternative strategies instead of giving up",
                            "Progress isn't lost - AI adjusts timeline and approach while keeping momentum",
                            "Learn from obstacles through AI analysis of what went wrong and why"
                        ],
                        transformation: "From brittle and breakable → Antifragile and unstoppable",
                        emotionalHook: "The path to your dream isn't a straight line - it's a resilient system that bends but doesn't break.",
                        socialProof: "Users face 40% fewer total derailments and recover 3x faster from setbacks"
                    }
                },
                {
                    answerId: "3b",
                    text: "I get distracted by new opportunities or ideas",
                    icon: "flash-outline",
                    userProfile: "The Shiny Object Chaser",
                    report: {
                        headline: "Opportunity Without Focus is Just Expensive Distraction",
                        painPoint: "Your brain loves novelty and dopamine hits from 'new.' But goal achievement requires sustained focus. The person who chases two rabbits catches neither. Every pivot means starting over.",
                        solution: "DreamPath Keeps You Locked On Target While Honoring Your Nature",
                        benefits: [
                            "Daily reminders of WHY this goal matters - reconnect to your deeper purpose",
                            "Visualize the cost of switching - see exactly how much progress you'd lose",
                            "Capture new ideas in a 'someday' vault without derailing current focus",
                            "Structured evaluation periods to assess opportunities without impulsive pivots"
                        ],
                        transformation: "From scattered energy → Laser-focused execution",
                        emotionalHook: "The graveyard of dreams is full of people who were 'just about to start.'",
                        socialProof: "Serial starters complete their first major goal 6x more often with focus tools"
                    }
                },
                {
                    answerId: "3c",
                    text: "Progress feels too slow and I get impatient",
                    icon: "speedometer-outline",
                    userProfile: "The Impatient Achiever",
                    report: {
                        headline: "You Overestimate What You Can Do in a Week, Underestimate a Year",
                        painPoint: "We live in an instant gratification world, but meaningful goals take time. When you can't SEE progress daily, your brain thinks nothing is happening - even when it is. This perception gap kills persistence.",
                        solution: "DreamPath Makes Invisible Progress Visible and Meaningful",
                        benefits: [
                            "Micro-progress tracking shows daily wins even when the big goal is months away",
                            "Growth graphs prove you're moving faster than it 'feels'",
                            "Predictive analytics show when you'll hit milestones at current pace",
                            "Comparative data shows you're on track with successful goal achievers"
                        ],
                        transformation: "From frustrating impatience → Patient confidence backed by data",
                        emotionalHook: "Overnight success takes years. But every day counts, and we'll prove it to you.",
                        socialProof: "Impatient users stick with goals 4.2x longer when they see granular progress"
                    }
                },
                {
                    answerId: "3d",
                    text: "Life gets busy and the goal becomes less priority",
                    icon: "calendar-outline",
                    userProfile: "The Distracted Drifter",
                    report: {
                        headline: "Urgency Always Beats Importance Without a System",
                        painPoint: "Your inbox will always have emails. Your calendar will always have meetings. Daily urgencies will ALWAYS try to crowd out your important goals. Without protection, your dreams become 'someday' projects that never happen.",
                        solution: "DreamPath Protects Your Goal Time Like a Personal Bodyguard",
                        benefits: [
                            "Daily task notifications ensure your goal gets attention even on crazy days",
                            "AI schedules goal work based on YOUR real available time slots",
                            "Accountability tracking shows when you're slipping - gentle course correction",
                            "Weekly reviews keep the big picture in focus despite daily chaos"
                        ],
                        transformation: "From reactive living → Intentional goal-directed action",
                        emotionalHook: "One year from now, you'll wish you had started today. Don't let busy-ness steal your dreams.",
                        socialProof: "Busy professionals maintain goal consistency 5x better with automated systems"
                    }
                }
            ]
        },
        {
            questionId: 4,
            question: "What would achieving your biggest goal mean to you?",
            psychologyNote: "Connects to emotional drivers and future self-visualization",
            answers: [
                {
                    answerId: "4a",
                    text: "Financial freedom and security for my family",
                    icon: "shield-checkmark-outline",
                    userProfile: "The Family Provider",
                    report: {
                        headline: "Your Family's Future Depends on Decisions You Make Today",
                        painPoint: "Every month without progress toward financial freedom is another month of stress, another month of 'what ifs,' another month your family depends on a system that might not be there for them. Time is the one resource you can't get back.",
                        solution: "DreamPath Turns Financial Goals Into Systematic Wealth Building",
                        benefits: [
                            "Break down big financial targets into achievable daily money actions",
                            "Track multiple income streams, investments, and wealth-building activities",
                            "AI creates realistic timelines based on your actual financial starting point",
                            "See the compound effect of small consistent actions on your family's future"
                        ],
                        transformation: "From financial anxiety → Systematic wealth building and peace of mind",
                        emotionalHook: "Imagine the moment you tell your family 'we're financially secure.' That moment starts with today's decision.",
                        socialProof: "Users pursuing financial goals report 45% faster progress with structured planning",
                        urgency: "Every day of inaction is a day further from the security your family deserves. Start building their future today."
                    }
                },
                {
                    answerId: "4b",
                    text: "Proving to myself (and others) that I can do it",
                    icon: "trophy-outline",
                    userProfile: "The Self-Prover",
                    report: {
                        headline: "Your Self-Worth is Waiting for You to Claim It",
                        painPoint: "Every unfinished goal is a voice in your head saying 'you can't do hard things.' That voice gets louder with every quit, every 'someday,' every 'I tried.' The only way to silence it is to FINISH what you start.",
                        solution: "DreamPath Helps You Become the Person Who Finishes What They Start",
                        benefits: [
                            "Finally complete something significant - end the cycle of starting and stopping",
                            "Build unshakeable confidence through documented progress and achievement",
                            "Create a success pattern your brain can replicate for future goals",
                            "Have concrete proof of your capability when doubt whispers 'you can't'"
                        ],
                        transformation: "From self-doubt → Earned confidence and self-respect",
                        emotionalHook: "The person you want to become is on the other side of this goal. Will you go meet them?",
                        socialProof: "First-time goal completers report transformative shifts in self-identity and confidence",
                        urgency: "Another year of 'I'll start Monday' means another year carrying the weight of unfulfilled potential. Choose different."
                    }
                },
                {
                    answerId: "4c",
                    text: "Living my passion and purpose",
                    icon: "heart-outline",
                    userProfile: "The Purpose Seeker",
                    report: {
                        headline: "Life is Too Short to Spend it Wishing You'd Tried",
                        painPoint: "You have ONE life. Right now, you're spending it on someone else's dream, someone else's schedule, someone else's definition of success. Every year that passes with your passion on hold is a year you'll never get back.",
                        solution: "DreamPath Helps You Build the Life You Actually Want to Live",
                        benefits: [
                            "Transform vague passion into concrete, achievable steps",
                            "Balance practical reality with purpose-driven goals (you need both)",
                            "Track progress toward the life that lights you up, not just pays bills",
                            "AI helps bridge the gap between 'current reality' and 'dream life'"
                        ],
                        transformation: "From deferred dreams → Active pursuit of meaningful purpose",
                        emotionalHook: "At the end of your life, you won't regret the risks you took on your passion. You'll regret the ones you didn't.",
                        socialProof: "Purpose-driven goal setters report 82% higher life satisfaction during pursuit",
                        urgency: "Your passion doesn't have an expiration date, but your time does. Start honoring what matters most to you."
                    }
                },
                {
                    answerId: "4d",
                    text: "Creating a better version of myself",
                    icon: "trending-up-outline",
                    userProfile: "The Self-Optimizer",
                    report: {
                        headline: "Growth is Not Automatic - It's Intentional",
                        painPoint: "You won't accidentally become the person you want to be. Without deliberate action, you'll be the same person next year, with the same limitations, same frustrations, same unrealized potential. Growth requires a system.",
                        solution: "DreamPath Creates a Personal Evolution System Designed for You",
                        benefits: [
                            "Set and track goals across multiple life dimensions (health, wealth, relationships, skills)",
                            "See your actual growth trajectory - not just how you 'feel' about progress",
                            "Build compound improvements that stack and multiply over time",
                            "Become 1% better every day through structured, intentional development"
                        ],
                        transformation: "From stagnation → Continuous personal evolution",
                        emotionalHook: "The gap between who you are and who you could be is filled with intentional action. Start closing that gap today.",
                        socialProof: "Self-improvement focused users report achieving 3.4 major personal transformations per year",
                        urgency: "You're either growing or dying - there is no standing still. Choose growth, choose today."
                    }
                }
            ]
        }
    ],
    finalWelcomeScreen: {
        headline: "Welcome to Your Transformation",
        subheadline: "You've taken the first step. Now let's make it count.",
        personalizedMessage: "Based on your answers, you're ready to overcome your obstacles and achieve your biggest goals.",
        commitmentStatement: "DreamPath is your AI success partner that never sleeps, never judges, and never gives up on your goals.",
        features: [
            "Personalized AI Planning",
            "Daily Task Generation",
            "Real-time Progress Tracking",
            "Adaptive Goal Adjustment",
            "Unlimited Goals & Projects"
        ],
        urgencyMessage: "Every day matters. Your future self is counting on the decision you make right now.",
        ctaPrimary: "Start My Journey",
        ctaSecondary: "Learn More",
        trustElements: [
            "10,000+ goals achieved by our users",
            
        ]
    }
};
