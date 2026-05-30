// src/presentation/screens/onboarding/PlanPreviewScreen.tsx
// Shown right after PlanWizard generates the AI plan. Loads the freshly-cached
// goal + tasks from the guest cache (base AsyncStorage keys) and lays them out
// day-by-day so the user can see exactly what the app will do for them before
// being asked to sign up.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import {
    OnboardingLayout,
    OnboardingButton,
    SectionLabel,
} from '@/presentation/components/onboarding';
import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { typography } from '@/presentation/theme/typography';
import { Goal } from '@/domain/entities/Goal';
import { Task } from '@/domain/entities/Task';
import { getGoalsLocally, getTasksLocally } from '@/data/localDataService';
import { OnboardingStackParamList } from '@/presentation/navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'PlanPreview'>;

// Group tasks by their scheduled date for a day-by-day reading experience.
interface DayGroup {
    date: Date;
    dateKey: string;
    tasks: Task[];
}

const groupTasksByDay = (tasks: Task[]): DayGroup[] => {
    const map = new Map<string, DayGroup>();
    for (const t of tasks) {
        const d = new Date(t.scheduledDate);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        if (!map.has(key)) {
            map.set(key, { date: d, dateKey: key, tasks: [] });
        }
        map.get(key)!.tasks.push(t);
    }
    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
};

const formatDayHeader = (date: Date, index: number): string => {
    const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return `Day ${index + 1} · ${date.toLocaleDateString(undefined, opts)}`;
};

const priorityColor = (p: Task['priority']): string => {
    switch (p) {
        case 'HIGH': return '#ef4444';
        case 'LOW': return '#10b981';
        default: return '#f59e0b';
    }
};

export const PlanPreviewScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [goal, setGoal] = useState<Goal | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [goals, allTasks] = await Promise.all([getGoalsLocally(), getTasksLocally()]);
            if (cancelled) return;

            // The most recently created goal in the guest cache is the one we just made.
            const latest = goals.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0] ?? null;

            setGoal(latest);
            setTasks(latest ? allTasks.filter((t) => t.goalId === latest.id) : []);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const days = useMemo(() => groupTasksByDay(tasks), [tasks]);
    const totalMinutes = useMemo(
        () => tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0),
        [tasks],
    );

    return (
        <OnboardingLayout
            step={24}
            onBack={() => navigation.goBack()}
            scrollable
            footer={
                <OnboardingButton
                    title="My 1st day plan"
                    onPress={() => navigation.navigate('Streak')}
                />
            }
        >
            <SectionLabel variant="pill">✨ YOUR PERSONALIZED PLAN</SectionLabel>

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={colors.primary.main} />
                </View>
            ) : !goal ? (
                <Text style={styles.empty}>Plan not found. Go back and try again.</Text>
            ) : (
                <>
                    <Text style={styles.headline} numberOfLines={2}>
                        {goal.title}
                    </Text>
                    {!!goal.description && (
                        <Text style={styles.description} numberOfLines={3}>
                            {goal.description}
                        </Text>
                    )}

                    {/* Stat strip */}
                    <View style={styles.statRow}>
                        <Stat icon="calendar-outline" label="Days" value={String(days.length)} />
                        <Stat icon="checkmark-done-outline" label="Tasks" value={String(tasks.length)} />
                        <Stat icon="time-outline" label="Minutes" value={String(totalMinutes)} />
                    </View>

                    {/* Day-by-day */}
                    <View style={styles.daysWrap}>
                        {days.map((day, idx) => (
                            <View key={day.dateKey} style={styles.dayCard}>
                                <Text style={styles.dayHeader}>{formatDayHeader(day.date, idx)}</Text>
                                {day.tasks.map((task) => (
                                    <View key={task.id} style={styles.taskRow}>
                                        <View
                                            style={[
                                                styles.priorityDot,
                                                { backgroundColor: priorityColor(task.priority) },
                                            ]}
                                        />
                                        <View style={styles.taskBody}>
                                            <Text style={styles.taskTitle} numberOfLines={2}>
                                                {task.title}
                                            </Text>
                                            {!!task.description && (
                                                <Text style={styles.taskDesc} numberOfLines={2}>
                                                    {task.description}
                                                </Text>
                                            )}
                                            <View style={styles.taskMetaRow}>
                                                <Ionicons
                                                    name="time-outline"
                                                    size={12}
                                                    color={colors.text.tertiary}
                                                />
                                                <Text style={styles.taskMeta}>
                                                    {task.estimatedMinutes} min · {task.difficulty.toLowerCase()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>

                    <View style={styles.footnote}>
                        <Ionicons name="sparkles" size={16} color={colors.primary.main} />
                        <Text style={styles.footnoteText}>
                            This is your real plan. Sign up next to save it and unlock daily streak tracking.
                        </Text>
                    </View>
                </>
            )}
        </OnboardingLayout>
    );
};

interface StatProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
}
const Stat: React.FC<StatProps> = ({ icon, label, value }) => (
    <View style={styles.stat}>
        <Ionicons name={icon} size={18} color={colors.primary.main} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    loading: {
        paddingVertical: spacing.xl * 2,
        alignItems: 'center',
    },
    empty: {
        ...typography.variants.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
    headline: {
        ...typography.variants.h2,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.4,
        marginTop: spacing.sm,
    },
    description: {
        ...typography.variants.bodySmall,
        color: colors.text.secondary,
        marginTop: spacing.xs,
        lineHeight: 20,
    },
    statRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm + 2,
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.lg,
        gap: 2,
    },
    statValue: {
        ...typography.variants.h5,
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
    },
    statLabel: {
        ...typography.variants.caption,
        fontSize: 11,
        color: colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    daysWrap: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    dayCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.borderRadius.lg + 2,
        padding: spacing.md,
        gap: spacing.sm,
    },
    dayHeader: {
        ...typography.variants.labelSmall,
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary.main,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    taskRow: {
        flexDirection: 'row',
        gap: spacing.sm + 2,
        paddingVertical: spacing.xs + 2,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 7,
    },
    taskBody: {
        flex: 1,
    },
    taskTitle: {
        ...typography.variants.label,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    taskDesc: {
        ...typography.variants.caption,
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: 2,
        lineHeight: 17,
    },
    taskMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    taskMeta: {
        ...typography.variants.caption,
        fontSize: 11,
        color: colors.text.tertiary,
        textTransform: 'capitalize',
    },
    footnote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.primary.main + '10',
        borderRadius: spacing.borderRadius.lg,
    },
    footnoteText: {
        flex: 1,
        ...typography.variants.bodySmall,
        fontSize: 13,
        color: colors.primary.main,
        lineHeight: 18,
    },
});

export default PlanPreviewScreen;
