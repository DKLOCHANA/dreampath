// src/presentation/navigation/MainNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '@/presentation/screens/main/HomeScreen';
import GoalsScreen from '@/presentation/screens/main/GoalsScreen';
import TasksScreen from '@/presentation/screens/main/TasksScreen';
import ProfileScreen from '@/presentation/screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
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

export default MainNavigator;
