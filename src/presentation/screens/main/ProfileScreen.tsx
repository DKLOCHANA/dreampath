// src/presentation/screens/main/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Switch,
    ScrollView,
    Platform,
    Image,
    ActionSheetIOS,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut, deleteUser } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@/presentation/navigation/types';

import { Card, Button } from '@/presentation/components/common';
import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { useAuthStore } from '@/infrastructure/stores/authStore';
import { auth } from '@/infrastructure/firebase/config';
import {
    getNotificationsEnabled,
    saveNotificationsEnabled,
    requestPermissionsWithRationale,
    scheduleReengagementNotification,
    cancelReengagementNotification,
} from '@/services/notificationService';
import { getGoals, getTasks, USE_LOCAL_DATA, getProfileImageKey, clearAllLocalData, deleteAllUserDataFromFirestore } from '@/data';
import { useRevenueCat } from '@/presentation/hooks/useRevenueCat';
import { checkConnectivityWithAlert, isNetworkError } from '@/services/networkService';

const PROFILE_IMAGE_KEY = '@dreampath_profile_image'; // Base key, will be made user-specific

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
    const { user, logout, updateUserProfile } = useAuthStore();
    const [displayName, setDisplayName] = useState(user?.displayName || 'User');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [goalsCount, setGoalsCount] = useState(0);
    const [tasksCompleted, setTasksCompleted] = useState(0);
    const [dayStreak, setDayStreak] = useState(0);

    // RevenueCat subscription state
    const {
        isPro,
        isExpired,
        hasEverSubscribed,
        presentCustomerCenter,
        handleRestorePurchases,
    } = useRevenueCat();

    // Get user-specific profile image key
    const userProfileImageKey = getProfileImageKey();

    // Load stats and profile image
    useEffect(() => {
        const loadData = async () => {
            // Load profile image from AsyncStorage (user-specific)
            try {
                const savedImage = await AsyncStorage.getItem(userProfileImageKey);
                if (savedImage) {
                    setProfileImage(savedImage);
                }
            } catch (error) {
                console.error('Error loading profile image:', error);
            }

            try {
                const goals = await getGoals();
                const tasks = await getTasks();
                setGoalsCount(goals.length);
                setTasksCompleted(tasks.filter(t => t.status === 'COMPLETED').length);
                // Calculate streak (simplified - just count consecutive days with completed tasks)
                setDayStreak(Math.min(goals.length * 2, 30)); // Placeholder calculation
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        };
        loadData();
        checkNotificationPermission();
    }, []);

    // Save base64 image directly to AsyncStorage (user-specific)
    const saveImageToStorage = async (base64: string): Promise<boolean> => {
        try {
            const imageUri = `data:image/jpeg;base64,${base64}`;
            await AsyncStorage.setItem(userProfileImageKey, imageUri);
            return true;
        } catch (error) {
            console.error('Error saving image:', error);
            return false;
        }
    };

    // Handle image selection from library
    const selectFromLibrary = async () => {
        // Check current permission status first
        const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

        if (existingStatus !== 'granted') {
            // Show explanation before requesting permission (App Store guideline)
            Alert.alert(
                'Photo Access',
                'VividGoals would like to access your photo library to let you choose a profile picture. Your photos are only used locally on this device.',
                [
                    { text: 'Not Now', style: 'cancel' },
                    {
                        text: 'Continue',
                        onPress: async () => {
                            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (status === 'granted') {
                                await launchImageLibrary();
                            } else {
                                showPermissionDeniedAlert();
                            }
                        },
                    },
                ]
            );
        } else {
            await launchImageLibrary();
        }
    };

    // Handle taking a photo with camera
    const takePhoto = async () => {
        const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();

        if (existingStatus !== 'granted') {
            Alert.alert(
                'Camera Access',
                'VividGoals would like to access your camera to take a profile picture.',
                [
                    { text: 'Not Now', style: 'cancel' },
                    {
                        text: 'Continue',
                        onPress: async () => {
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status === 'granted') {
                                await launchCamera();
                            } else {
                                showPermissionDeniedAlert();
                            }
                        },
                    },
                ]
            );
        } else {
            await launchCamera();
        }
    };

    // Show permission denied alert with settings option
    const showPermissionDeniedAlert = () => {
        Alert.alert(
            'Permission Required',
            'To change your profile picture, please allow photo access in Settings.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Open Settings',
                    onPress: () => {
                        Linking.openURL('app-settings:');
                    },
                },
            ]
        );
    };

    // Launch the image library picker
    const launchImageLibrary = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
            allowsMultipleSelection: false,
        });

        if (!result.canceled && result.assets[0]?.base64) {
            await processSelectedImage(result.assets[0].base64);
        }
    };

    // Launch the camera
    const launchCamera = async () => {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0]?.base64) {
            await processSelectedImage(result.assets[0].base64);
        }
    };

    // Process and save the selected image (base64)
    const processSelectedImage = async (base64: string) => {
        const success = await saveImageToStorage(base64);
        if (success) {
            const imageUri = `data:image/jpeg;base64,${base64}`;
            setProfileImage(imageUri);
        } else {
            Alert.alert('Error', 'Failed to save the image. Please try again.');
        }
    };

    // Pick image with action sheet for source selection (iOS)
    const pickImage = async () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Cancel', 'Take Photo', 'Choose from Library'],
                cancelButtonIndex: 0,
            },
            async (buttonIndex) => {
                if (buttonIndex === 1) {
                    await takePhoto();
                } else if (buttonIndex === 2) {
                    await selectFromLibrary();
                }
            }
        );
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

    // Check both system permission and user's in-app preference
    const checkNotificationPermission = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        const enabled = await getNotificationsEnabled();
        setNotificationsEnabled(status === 'granted' && enabled);
    };

    // Handle notification toggle
    const handleNotificationToggle = async (value: boolean) => {
        if (value) {
            const granted = await requestPermissionsWithRationale();
            if (!granted) {
                setNotificationsEnabled(false); // snap switch back if permission was not granted
                return;
            }
            await saveNotificationsEnabled(true);
            await scheduleReengagementNotification();
            setNotificationsEnabled(true);
        } else {
            await saveNotificationsEnabled(false);
            await cancelReengagementNotification();
            setNotificationsEnabled(false);
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
                            // Check network connectivity before logout
                            const isOnline = await checkConnectivityWithAlert({
                                customMessage: 'An internet connection is required to sign out. Please check your connection and try again.',
                            });
                            if (!isOnline) return;

                            // Don't clear local data - it's now user-specific and persists across sessions
                            await signOut(auth);
                            logout();
                        } catch (error: any) {
                            console.error('Logout error:', error);
                            if (isNetworkError(error)) {
                                Alert.alert('No Internet Connection', 'Please check your internet connection and try again.');
                            } else {
                                Alert.alert('Error', 'Failed to sign out. Please try again.');
                            }
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and all associated data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: () => {
                        // Second confirmation
                        Alert.alert(
                            'Are you absolutely sure?',
                            'All your goals, tasks, and progress will be permanently deleted. Type DELETE to confirm.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'I understand, delete my account',
                                    style: 'destructive',
                                    onPress: performDeleteAccount,
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    const performDeleteAccount = async () => {
        try {
            // Check network connectivity
            const isOnline = await checkConnectivityWithAlert({
                customMessage: 'An internet connection is required to delete your account. Please check your connection and try again.',
            });
            if (!isOnline) return;

            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert('Error', 'No user is currently signed in.');
                return;
            }

            const userId = currentUser.uid;

            // Show loading indicator
            Alert.alert('Deleting Account', 'Please wait while we delete your account...');

            try {
                // 1. Delete all user data from Firestore
                await deleteAllUserDataFromFirestore(userId);
                console.log('Firestore data deleted');

                // 2. Clear local storage
                await clearAllLocalData();
                console.log('Local data cleared');

                // 3. Delete the Firebase Auth user
                await deleteUser(currentUser);
                console.log('Auth user deleted');

                // 4. Logout from the app state
                logout();

                Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
            } catch (deleteError: any) {
                console.error('Delete account error:', deleteError);
                
                // Handle re-authentication requirement
                if (deleteError.code === 'auth/requires-recent-login') {
                    Alert.alert(
                        'Re-authentication Required',
                        'For security reasons, please sign out and sign back in, then try deleting your account again.',
                        [{ text: 'OK' }]
                    );
                } else if (isNetworkError(deleteError)) {
                    Alert.alert('No Internet Connection', 'Please check your internet connection and try again.');
                } else {
                    Alert.alert('Error', 'Failed to delete account. Please try again later.');
                }
            }
        } catch (error: any) {
            console.error('Delete account error:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        }
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
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
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

                    {/* Pro Badge — shown when user is subscribed */}
                    {isPro && (
                        <View style={styles.proBadge}>
                            <Ionicons name="diamond" size={12} color="#fff" />
                            <Text style={styles.proBadgeText}>PRO</Text>
                        </View>
                    )}
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
                        <Text style={styles.overviewLabel}>Daily Streak</Text>
                    </View>
                </View>

                {/* Premium Card — 3 states: Active / Expired / Fresh */}
                {isPro ? (
                    <View style={styles.premiumCardShadow}>
                        <LinearGradient
                            colors={['#10b981', '#059669', '#047857']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.premiumCard}
                        >
                            <View style={styles.premiumContent}>
                                <View style={styles.premiumIconContainer}>
                                    <Ionicons name="diamond" size={28} color="#fff" />
                                </View>
                                <View style={styles.premiumTextContainer}>
                                    <Text style={styles.premiumTitle}>VividGoals Pro</Text>
                                    <Text style={styles.premiumDescription}>
                                        All premium features unlocked
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.premiumButtonShadow}>
                                <TouchableOpacity
                                    style={styles.premiumButton}
                                    onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
                                >
                                    <Text style={[styles.premiumButtonText, { color: '#059669' }]}>
                                        Manage
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                ) : isExpired ? (
                    <View style={styles.premiumCardShadow}>
                        <LinearGradient
                            colors={['#f59e0b', '#d97706', '#b45309']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.premiumCard}
                        >
                            <View style={styles.premiumContent}>
                                <View style={styles.premiumIconContainer}>
                                    <Ionicons name="time-outline" size={28} color="#fff" />
                                </View>
                                <View style={styles.premiumTextContainer}>
                                    <Text style={styles.premiumTitle}>Subscription Expired</Text>
                                    <Text style={styles.premiumDescription}>
                                        Your premium access has ended
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.premiumButtonShadow}>
                                <TouchableOpacity
                                    style={styles.premiumButton}
                                    onPress={() => navigation.navigate('ExpiredSubscription')}
                                >
                                    <Text style={[styles.premiumButtonText, { color: '#d97706' }]}>
                                        Reactivate
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                ) : (
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
                                    onPress={() => navigation.navigate('Paywall')}
                                >
                                    <Text style={styles.premiumButtonText}>Upgrade</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* Restore Purchases link — show for expired and fresh users */}
                {!isPro && (
                    <TouchableOpacity
                        style={styles.restoreButton}
                        onPress={handleRestorePurchases}
                    >
                        <Ionicons name="refresh-outline" size={16} color={colors.text.secondary} />
                        <Text style={styles.restoreButtonText}>Restore Purchases</Text>
                    </TouchableOpacity>
                )}

                {/* Preferences */}
                <View style={styles.settingsCard}>
                    <Text style={styles.settingsSectionTitle}>Preferences</Text>
                    <View style={styles.settingsRow}>
                        <View style={styles.settingsRowLeft}>
                            <View style={[styles.settingsIconBg, { backgroundColor: '#ede9fe' }]}>
                                <Ionicons name="notifications-outline" size={18} color="#7c3aed" />
                            </View>
                            <View style={styles.settingsTextGroup}>
                                <Text style={styles.settingsRowLabel}>Reminders</Text>
                                <Text style={styles.settingsRowSub}>Nudge if inactive for 12 hours</Text>
                            </View>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleNotificationToggle}
                            trackColor={{ false: colors.neutral[200], true: colors.primary.main + '80' }}
                            thumbColor={notificationsEnabled ? colors.primary.main : colors.neutral[400]}
                            ios_backgroundColor={colors.neutral[200]}
                        />
                    </View>
                </View>
            </ScrollView>

            

            {/* Logout - Fixed at bottom */}
            <View style={styles.logoutContainer}>
                <Button
                    title="Sign Out"
                    variant="outline"
                    onPress={handleLogout}
                    fullWidth
                />
                <TouchableOpacity
                    style={styles.deleteAccountButton}
                    onPress={handleDeleteAccount}
                >
                    <Text style={styles.deleteAccountText}>Delete Account</Text>
                </TouchableOpacity>
            </View>
            {/* Legal Links */}
            <View style={[styles.legalLinksContainer, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
                <TouchableOpacity
                    onPress={() => Linking.openURL('https://dklochana.github.io/vividgoals-policies/privacy-policy/')}
                >
                    <Text style={styles.legalLinkText}>Privacy Policy</Text>
                </TouchableOpacity>
                <Text style={styles.legalSeparator}>•</Text>
                <TouchableOpacity
                    onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
                >
                    <Text style={styles.legalLinkText}>Terms of Service</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    contentContainer: {
        alignItems: 'center',
        paddingHorizontal: spacing.screenPadding,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },

    // Profile Header
    profileHeader: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        width: '100%',
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

    // Pro Badge
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: '#667eea',
    },
    proBadgeText: {
        fontSize: typography.fontSize.xs,
        fontWeight: '700' as any,
        color: '#fff',
        letterSpacing: 1,
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
        width: '100%',
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
        width: '100%',
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

    // Restore Purchases
    restoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: spacing.sm,
    },
    restoreButtonText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
    },

    // Settings / Preferences card
    settingsCard: {
        width: '100%',
        backgroundColor: colors.background.primary,
        borderRadius: 16,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginTop: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
    },
    settingsSectionTitle: {
        fontSize: typography.fontSize.xs,
        fontWeight: '600' as any,
        color: colors.text.tertiary,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
    },
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
    },
    settingsRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: spacing.sm,
    },
    settingsIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsTextGroup: {
        flex: 1,
    },
    settingsRowLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600' as any,
        color: colors.text.primary,
    },
    settingsRowSub: {
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
        marginTop: 1,
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

    // Legal Links
    legalLinksContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    legalLinkText: {
        ...typography.variants.caption,
        color: colors.text.secondary,
        textDecorationLine: 'underline',
    },
    legalSeparator: {
        color: colors.text.tertiary,
        fontSize: typography.fontSize.xs,
    },

    // Logout Container
    logoutContainer: {
        paddingHorizontal: spacing.screenPadding,
        paddingVertical: spacing.md,
        backgroundColor: colors.background.secondary,
        alignItems: 'center',
    },

    // Delete Account
    deleteAccountButton: {
        marginTop: spacing.md,
        paddingVertical: spacing.buttonPaddingVertical,
        paddingHorizontal: spacing.buttonPaddingHorizontal,
        minHeight: 48,
        width: '100%',
        borderRadius: spacing.borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.error.main,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteAccountText: {
        ...typography.variants.button,
        color: colors.error.main,
    },
});

export default ProfileScreen;
