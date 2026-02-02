// src/presentation/navigation/MainNavigator.tsx
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, MainStackParamList } from './types';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { getGoalsLocally } from '@/data';
import { LoadingScreen } from '@/presentation/components/common';

// Screens
import HomeScreen from '@/presentation/screens/main/HomeScreen';
import GoalsScreen from '@/presentation/screens/main/GoalsScreen';
import TasksScreen from '@/presentation/screens/main/TasksScreen';
import ProfileScreen from '@/presentation/screens/main/ProfileScreen';
import FirstGoalScreen from '@/presentation/screens/main/FirstGoalScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

// Tab Navigator Component
const TabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary.main,
                tabBarInactiveTintColor: colors.text.tertiary,
                tabBarStyle: {
                    backgroundColor: colors.background.primary,
                    borderTopColor: colors.border.light,
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 70,
                },
                tabBarLabelStyle: {
                    ...typography.variants.labelSmall,
                    marginTop: 2,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Goals"
                component={GoalsScreen}
                options={{
                    tabBarLabel: 'Goals',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? 'flag' : 'flag-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Tasks"
                component={TasksScreen}
                options={{
                    tabBarLabel: 'Tasks',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

// Main Navigator with goal check
export const MainNavigator: React.FC = () => {
    const [hasGoals, setHasGoals] = useState<boolean | null>(null);

    useEffect(() => {
        const checkGoals = async () => {
            try {
                const goals = await getGoalsLocally();
                setHasGoals(goals.length > 0);
            } catch (error) {
                console.error('[MainNavigator] Error checking goals:', error);
                setHasGoals(false);
            }
        };
        checkGoals();
    }, []);

    // Show loading while checking goals
    if (hasGoals === null) {
        return <LoadingScreen message="Loading your goals..." />;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!hasGoals ? (
                // No goals - show FirstGoal wizard first
                <>
                    <Stack.Screen name="FirstGoal" component={FirstGoalScreen} />
                    <Stack.Screen name="Tabs" component={TabNavigator} />
                </>
            ) : (
                // Has goals - go directly to tabs
                <>
                    <Stack.Screen name="Tabs" component={TabNavigator} />
                    <Stack.Screen name="FirstGoal" component={FirstGoalScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default MainNavigator;
