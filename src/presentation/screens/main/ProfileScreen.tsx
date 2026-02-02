// src/presentation/screens/main/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { Card, Button } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { useAuthStore } from '@/infrastructure/stores/authStore';
import { auth } from '@/infrastructure/firebase/config';
import { getGoalsLocally, getTasksLocally, USE_LOCAL_DATA } from '@/data';

const PROFILE_IMAGE_KEY = '@dreampath_profile_image';

export const ProfileScreen: React.FC = () => {
    const { user, logout, updateUserProfile } = useAuthStore();
    const [displayName, setDisplayName] = useState(user?.displayName || 'User');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [goalsCount, setGoalsCount] = useState(0);
    const [tasksCompleted, setTasksCompleted] = useState(0);
    const [dayStreak, setDayStreak] = useState(0);

    // Load stats and profile image
    useEffect(() => {
        const loadData = async () => {
            // Load profile image from AsyncStorage
            try {
                const savedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
                if (savedImage) {
                    setProfileImage(savedImage);
                }
            } catch (error) {
                console.error('Error loading profile image:', error);
            }

            if (USE_LOCAL_DATA) {
                try {
                    const goals = await getGoalsLocally();
                    const tasks = await getTasksLocally();
                    setGoalsCount(goals.length);
                    setTasksCompleted(tasks.filter(t => t.status === 'COMPLETED').length);
                    // Calculate streak (simplified - just count consecutive days with completed tasks)
                    setDayStreak(Math.min(goals.length * 2, 30)); // Placeholder calculation
                } catch (error) {
                    console.error('Error loading stats:', error);
                }
            }
        };
        loadData();
        checkNotificationPermission();
    }, []);

    // Pick and save profile image
    const pickImage = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please allow access to your photo library to upload a profile picture.',
                [{ text: 'OK' }]
            );
            return;
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            const imageUri = result.assets[0].uri;
            setProfileImage(imageUri);

            // Save to AsyncStorage
            try {
                await AsyncStorage.setItem(PROFILE_IMAGE_KEY, imageUri);
            } catch (error) {
                console.error('Error saving profile image:', error);
            }
        }
    };

    // Edit name with Alert prompt
    const handleEditName = () => {
        Alert.prompt(
            'Edit Name',
            'Enter your display name',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Save',
                    onPress: (newName?: string) => {
                        if (newName && newName.trim()) {
                            setDisplayName(newName.trim());
                            updateUserProfile({ displayName: newName.trim() });
                        }
                    },
                },
            ],
            'plain-text',
            displayName
        );
    };

    // For Android, use a custom prompt since Alert.prompt is iOS only
    const handleEditNameCrossPlatform = () => {
        if (Platform.OS === 'ios') {
            handleEditName();
        } else {
            // For Android, we'll use a simple alert with instructions
            // In production, you'd use a modal or third-party library
            Alert.alert(
                'Edit Name',
                `Current name: ${displayName}\n\nTo change your name on Android, please use the in-app settings.`,
                [{ text: 'OK' }]
            );
        }
    };

    // Check notification permission status
    const checkNotificationPermission = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(status === 'granted');
    };

    // Handle notification toggle
    const handleNotificationToggle = async (value: boolean) => {
        if (value) {
            // Request permission
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'To receive notifications, please enable them in your device settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open Settings',
                            onPress: () => {
                                if (Platform.OS === 'ios') {
                                    // On iOS, we can't directly open settings, but we can inform the user
                                    Alert.alert('Settings', 'Please go to Settings > DreamPath > Notifications to enable notifications.');
                                }
                            }
                        },
                    ]
                );
                setNotificationsEnabled(false);
                return;
            }

            setNotificationsEnabled(true);
            // Configure notification handler
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
        } else {
            setNotificationsEnabled(false);
            // Note: We can't programmatically disable notifications, user must do it in settings
            Alert.alert(
                'Disable Notifications',
                'To disable notifications, please go to your device Settings and turn off notifications for DreamPath.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            logout();
                        } catch (error) {
                            console.error('Logout error:', error);
                        }
                    },
                },
            ]
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header with Profile Picture */}
                <View style={styles.profileHeader}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {getInitials(displayName || 'U')}
                                </Text>
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            <Ionicons name="camera" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.nameContainer}
                        onPress={handleEditNameCrossPlatform}
                    >
                        <Text style={styles.userName}>{displayName}</Text>
                        <Ionicons name="pencil" size={16} color={colors.text.secondary} />
                    </TouchableOpacity>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                {/* Stats Overview */}
                <View style={styles.overviewContainer}>
                    <View style={styles.overviewCard}>
                        <View style={[styles.overviewIconBg, { backgroundColor: '#e0f2fe' }]}>
                            <Ionicons name="trophy-outline" size={20} color="#0284c7" />
                        </View>
                        <Text style={styles.overviewValue}>{goalsCount}</Text>
                        <Text style={styles.overviewLabel}>Total Goals</Text>
                    </View>
                    <View style={styles.overviewCard}>
                        <View style={[styles.overviewIconBg, { backgroundColor: '#dcfce7' }]}>
                            <Ionicons name="checkmark-done-outline" size={20} color="#16a34a" />
                        </View>
                        <Text style={styles.overviewValue}>{tasksCompleted}</Text>
                        <Text style={styles.overviewLabel}>Tasks Done</Text>
                    </View>
                    <View style={styles.overviewCard}>
                        <View style={[styles.overviewIconBg, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="flame-outline" size={20} color="#d97706" />
                        </View>
                        <Text style={styles.overviewValue}>{dayStreak}</Text>
                        <Text style={styles.overviewLabel}>Day Streak</Text>
                    </View>
                </View>

                {/* Premium Upgrade Card with Gradient */}
                <View style={styles.premiumCardShadow}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2', '#f093fb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.premiumCard}
                    >
                        <View style={styles.premiumContent}>
                            <View style={styles.premiumIconContainer}>
                                <Ionicons name="diamond" size={28} color="#fff" />
                            </View>
                            <View style={styles.premiumTextContainer}>
                                <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                                <Text style={styles.premiumDescription}>
                                    Unlock AI insights, unlimited goals & more
                                </Text>
                            </View>
                        </View>
                        <View style={styles.premiumButtonShadow}>
                            <TouchableOpacity
                                style={styles.premiumButton}
                                onPress={() => Alert.alert('Premium', 'Premium subscription coming soon!')}
                            >
                                <Text style={styles.premiumButtonText}>Upgrade</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Menu Items */}
                <View style={styles.menuCardShadow}>
                    <Card style={styles.menuCard}>
                        <View style={styles.menuItem}>
                            <Ionicons name="notifications-outline" size={22} color={colors.text.secondary} style={styles.menuIcon} />
                            <Text style={styles.menuTitle}>Notifications</Text>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleNotificationToggle}
                                trackColor={{ false: colors.neutral[300], true: colors.primary.light }}
                                thumbColor={notificationsEnabled ? colors.primary.main : colors.neutral[100]}
                                ios_backgroundColor={colors.neutral[300]}
                            />
                        </View>
                        <View style={[styles.menuItem, styles.menuItemBorder]}>
                            <Ionicons name="stats-chart-outline" size={22} color={colors.text.secondary} style={styles.menuIcon} />
                            <Text style={styles.menuTitle}>Analytics</Text>
                            <TouchableOpacity onPress={() => Alert.alert('Analytics', 'Analytics dashboard coming soon!')}>
                                <Text style={styles.menuActionText}>View</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.menuItem}>
                            <Ionicons name="help-circle-outline" size={22} color={colors.text.secondary} style={styles.menuIcon} />
                            <Text style={styles.menuTitle}>Help & Support</Text>
                            <TouchableOpacity onPress={() => Alert.alert('Help & Support', 'Contact support@dreampath.app for assistance.')}>
                                <Text style={styles.menuActionText}>Contact</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>

                {/* Logout */}
                <Button
                    title="Sign Out"
                    variant="outline"
                    onPress={handleLogout}
                    fullWidth
                    style={{ marginTop: spacing.lg }}
                />

                {/* Version */}
                <Text style={styles.version}>DreamPath v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    scrollContent: {
        padding: spacing.screenPadding,
        paddingBottom: 30,
    },

    // Profile Header
    profileHeader: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    avatarText: {
        ...typography.variants.h3,
        color: colors.text.inverse,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: spacing.md,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    userName: {
        ...typography.variants.h4,
        color: colors.text.primary,
    },
    userEmail: {
        ...typography.variants.body,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    editNameContainer: {
        width: '100%',
        paddingHorizontal: spacing.xl,
    },
    nameInput: {
        ...typography.variants.h4,
        color: colors.text.primary,
        textAlign: 'center',
        borderBottomWidth: 2,
        borderBottomColor: colors.primary.main,
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
    },
    editNameButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.md,
    },
    cancelButton: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    cancelButtonText: {
        ...typography.variants.body,
        color: colors.text.secondary,
    },
    saveButton: {
        backgroundColor: colors.primary.main,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: spacing.borderRadius.md,
    },
    saveButtonText: {
        ...typography.variants.body,
        color: colors.text.inverse,
        fontWeight: '600',
    },

    // Overview Stats
    overviewContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    overviewCard: {
        flex: 1,
        backgroundColor: colors.background.primary,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    overviewIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    overviewValue: {
        ...typography.variants.h4,
        color: colors.text.primary,
    },
    overviewLabel: {
        ...typography.variants.caption,
        color: colors.text.secondary,
        marginTop: 2,
    },

    // Premium Card Shadow Wrapper
    premiumCardShadow: {
        marginBottom: spacing.lg,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
        elevation: 10,
    },
    // Premium Card
    premiumCard: {
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: spacing.borderRadius.lg,
        overflow: 'hidden',
    },
    premiumContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    premiumIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    premiumTextContainer: {
        flex: 1,
    },
    premiumTitle: {
        ...typography.variants.label,
        color: '#fff',
        marginBottom: 2,
    },
    premiumDescription: {
        ...typography.variants.caption,
        color: 'rgba(255,255,255,0.85)',
    },
    premiumButton: {
        backgroundColor: '#fff',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: spacing.borderRadius.full,
    },
    premiumButtonShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    premiumButtonText: {
        ...typography.variants.label,
        color: colors.primary.main,
        fontWeight: '600',
    },

    // Menu Card Shadow Wrapper
    menuCardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 6,
    },
    // Menu
    menuCard: {
        padding: 0,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    menuIcon: {
        marginRight: spacing.md,
    },
    menuTitle: {
        ...typography.variants.body,
        color: colors.text.primary,
        flex: 1,
    },
    menuActionText: {
        ...typography.variants.label,
        color: colors.primary.main,
    },

    // Version
    version: {
        ...typography.variants.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
});

export default ProfileScreen;
