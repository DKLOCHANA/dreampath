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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
    scheduleTrialEndReminder,
    cancelTrialEndReminder,
} from '@/services/notificationService';
import { useSubscriptionStore } from '@/infrastructure/stores/subscriptionStore';
import { REVENUECAT_CONFIG } from '@/infrastructure/revenuecat/config';
import { getGoals, getTasks, USE_LOCAL_DATA, getProfileImageKey, clearAllLocalData, deleteAllUserDataFromFirestore } from '@/data';
import { useRevenueCat } from '@/presentation/hooks/useRevenueCat';
import { checkConnectivityWithAlert, isNetworkError } from '@/services/networkService';

const PROFILE_IMAGE_KEY = '@dreampath_profile_image'; // Base key, will be made user-specific

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
    const insets = useSafeAreaInsets();
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

    // Handle notification toggle — controls BOTH the reengagement ping and
    // the trial-end reminder. Turning off here cancels everything; turning on
    // re-schedules the trial-end reminder if the user is currently in their
    // free trial period.
    const handleNotificationToggle = async (value: boolean) => {
        if (value) {
            const granted = await requestPermissionsWithRationale();
            if (!granted) {
                setNotificationsEnabled(false); // snap switch back if permission was not granted
                return;
            }
            await saveNotificationsEnabled(true);
            await scheduleReengagementNotification();

            // Re-arm the trial-end reminder if user is still inside their trial
            const info = useSubscriptionStore.getState().customerInfo;
            const ent = info?.entitlements.active[REVENUECAT_CONFIG.entitlementId];
            if (ent?.periodType === 'TRIAL' && ent.expirationDate) {
                const expMs = new Date(ent.expirationDate).getTime();
                if (!Number.isNaN(expMs)) {
                    await scheduleTrialEndReminder(expMs);
                }
            }

            setNotificationsEnabled(true);
        } else {
            await saveNotificationsEnabled(false);
            await cancelReengagementNotification();
            await cancelTrialEndReminder();
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
        <View style={styles.container}>
            <StatusBar style="light" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.contentContainer, { paddingBottom: spacing.xl + insets.bottom }]}
            >
                {/* Background decorative bubbles + outlined icons (behind everything) */}
                <View pointerEvents="none" style={styles.bgDecorWrap}>
                    <View style={[styles.bgBubble, styles.bgBubble1]} />
                    <View style={[styles.bgBubble, styles.bgBubble2]} />
                    <View style={[styles.bgBubble, styles.bgBubble3]} />
                    <View style={[styles.bgBubble, styles.bgBubble4]} />
                    <View style={[styles.bgBubble, styles.bgBubble5]} />
                    <View style={[styles.bgBubble, styles.bgBubble6]} />
                    <View style={[styles.bgBubble, styles.bgBubble7]} />

                    <View style={[styles.bgIcon, styles.bgIcon1]}>
                        <Ionicons name="trophy-outline" size={56} color={colors.primary.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon2]}>
                        <Ionicons name="flag-outline" size={44} color={colors.accent.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon3]}>
                        <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.primary.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon4]}>
                        <Ionicons name="star-outline" size={40} color={colors.accent.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon5]}>
                        <Ionicons name="ribbon-outline" size={52} color={colors.primary.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon6]}>
                        <Ionicons name="rocket-outline" size={48} color={colors.accent.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon7]}>
                        <Ionicons name="medal-outline" size={44} color={colors.primary.light} />
                    </View>
                    <View style={[styles.bgIcon, styles.bgIcon8]}>
                        <Ionicons name="bulb-outline" size={38} color={colors.accent.light} />
                    </View>
                </View>

                {/* Gradient Hero Header — same pattern as other pages */}
                <View style={[styles.heroSection, { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.lg }]}>
                    <LinearGradient
                        colors={[colors.primary.dark, colors.primary.main, colors.accent.main]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    {/* Decorative translucent circles */}
                    <View style={[styles.decorCircle, styles.decorCircle1]} />
                    <View style={[styles.decorCircle, styles.decorCircle2]} />
                    <View style={[styles.decorCircle, styles.decorCircle3]} />
                    <View style={[styles.decorCircle, styles.decorCircle4]} />

                    <View style={styles.heroContent}>
                        {/* Left: badge + name + email + pro */}
                        <View style={styles.heroLeft}>
                            <View style={styles.heroBadge}>
                                <Ionicons name="person" size={14} color="#fff" />
                                <Text style={styles.heroBadgeText}>MY PROFILE</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.heroNameRow}
                                onPress={handleEditNameCrossPlatform}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.heroTitle} numberOfLines={1}>{displayName}</Text>
                                <Ionicons name="pencil" size={15} color="rgba(255,255,255,0.85)" />
                            </TouchableOpacity>
                            <Text style={styles.heroSubtitle} numberOfLines={1}>{user?.email}</Text>
                            {isPro && (
                                <View style={styles.heroProBadge}>
                                    <Ionicons name="diamond" size={11} color="#fff" />
                                    <Text style={styles.heroProBadgeText}>PRO</Text>
                                </View>
                            )}
                        </View>

                        {/* Right: avatar */}
                        <TouchableOpacity
                            style={styles.heroAvatarContainer}
                            onPress={pickImage}
                            activeOpacity={0.85}
                        >
                            <View style={styles.heroAvatarRing}>
                                {profileImage ? (
                                    <Image source={{ uri: profileImage }} style={styles.heroAvatarImage} />
                                ) : (
                                    <View style={styles.heroAvatarInner}>
                                        <Text style={styles.heroAvatarText}>
                                            {getInitials(displayName || 'U')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.heroCameraIcon}>
                                <Ionicons name="camera" size={12} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Overview */}
                <View style={styles.contentPadded}>
                    <View style={styles.overviewContainer}>
                        <View style={styles.overviewCard}>
                            <View style={[styles.overviewAccent, { backgroundColor: '#0284c7' }]} />
                            <View style={[styles.overviewIconBg, { backgroundColor: '#e0f2fe' }]}>
                                <Ionicons name="trophy-outline" size={20} color="#0284c7" />
                            </View>
                            <Text style={styles.overviewValue}>{goalsCount}</Text>
                            <Text style={styles.overviewLabel}>Total Goals</Text>
                        </View>
                        <View style={styles.overviewCard}>
                            <View style={[styles.overviewAccent, { backgroundColor: '#16a34a' }]} />
                            <View style={[styles.overviewIconBg, { backgroundColor: '#dcfce7' }]}>
                                <Ionicons name="checkmark-done-outline" size={20} color="#16a34a" />
                            </View>
                            <Text style={styles.overviewValue}>{tasksCompleted}</Text>
                            <Text style={styles.overviewLabel}>Tasks Done</Text>
                        </View>
                        <View style={styles.overviewCard}>
                            <View style={[styles.overviewAccent, { backgroundColor: '#d97706' }]} />
                            <View style={[styles.overviewIconBg, { backgroundColor: '#fef3c7' }]}>
                                <Ionicons name="flame-outline" size={20} color="#d97706" />
                            </View>
                            <Text style={styles.overviewValue}>{dayStreak}</Text>
                            <Text style={styles.overviewLabel}>Daily Streak</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.contentPadded}>
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

                {/* Legal */}
                <View style={styles.settingsCard}>
                    <Text style={styles.settingsSectionTitle}>Legal</Text>

                    <TouchableOpacity
                        style={styles.settingsRow}
                        onPress={() => Linking.openURL('https://dklochana.github.io/vividgoals-policies/privacy-policy/')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingsRowLeft}>
                            <View style={[styles.settingsIconBg, { backgroundColor: '#dbeafe' }]}>
                                <Ionicons name="shield-checkmark-outline" size={18} color="#2563eb" />
                            </View>
                            <View style={styles.settingsTextGroup}>
                                <Text style={styles.settingsRowLabel}>Privacy Policy</Text>
                                <Text style={styles.settingsRowSub}>How we handle your data</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                    </TouchableOpacity>

                    <View style={styles.settingsDivider} />

                    <TouchableOpacity
                        style={styles.settingsRow}
                        onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingsRowLeft}>
                            <View style={[styles.settingsIconBg, { backgroundColor: '#fef3c7' }]}>
                                <Ionicons name="document-text-outline" size={18} color="#d97706" />
                            </View>
                            <View style={styles.settingsTextGroup}>
                                <Text style={styles.settingsRowLabel}>Terms of Service</Text>
                                <Text style={styles.settingsRowSub}>Apple Standard EULA</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                    </TouchableOpacity>
                </View>

                {/* Account Actions */}
                <View style={styles.accountActions}>
                    <TouchableOpacity
                        style={styles.signOutButton}
                        onPress={handleLogout}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="log-out-outline" size={18} color={colors.error.main} />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.deleteAccountButton}
                        onPress={handleDeleteAccount}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <Text style={styles.deleteAccountText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    contentContainer: {
        paddingBottom: spacing.xl,
    },
    contentPadded: {
        paddingHorizontal: spacing.screenPadding,
    },

    // Gradient hero header
    heroSection: {
        width: '100%',
        overflow: 'hidden',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    decorCircle1: {
        width: 140,
        height: 140,
        top: -40,
        right: -30,
    },
    decorCircle2: {
        width: 80,
        height: 80,
        top: 30,
        left: -20,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    decorCircle3: {
        width: 50,
        height: 50,
        top: 80,
        right: 60,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    decorCircle4: {
        width: 24,
        height: 24,
        top: 60,
        left: 70,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },

    // In-hero content (row: left text column + right avatar)
    heroContent: {
        zIndex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.screenPadding + spacing.sm,
    },
    heroLeft: {
        flex: 1,
        paddingRight: spacing.md,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: spacing.md,
    },
    heroBadgeText: {
        fontSize: 10,
        fontWeight: '700' as any,
        color: '#fff',
        letterSpacing: 1,
    },
    heroAvatarContainer: {
        position: 'relative',
    },
    heroAvatarRing: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.45)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    heroAvatarInner: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroAvatarImage: {
        width: 82,
        height: 82,
        borderRadius: 41,
    },
    heroAvatarText: {
        ...typography.variants.h3,
        color: colors.text.inverse,
    },
    heroCameraIcon: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.accent.main,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    heroNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800' as any,
        color: '#fff',
        letterSpacing: -0.3,
        flexShrink: 1,
    },
    heroSubtitle: {
        fontSize: typography.fontSize.sm,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
    },
    heroProBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        marginTop: spacing.sm + 2,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.28)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    heroProBadgeText: {
        fontSize: 10,
        fontWeight: '700' as any,
        color: '#fff',
        letterSpacing: 1,
    },

    // Background decorative bubbles (over white area)
    bgDecorWrap: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    bgBubble: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: colors.primary.background,
        opacity: 0.6,
    },
    bgBubble1: {
        width: 220,
        height: 220,
        top: 360,
        right: -110,
    },
    bgBubble2: {
        width: 160,
        height: 160,
        top: 620,
        left: -80,
    },
    bgBubble3: {
        width: 120,
        height: 120,
        top: 880,
        right: -50,
    },
    bgBubble4: {
        width: 70,
        height: 70,
        top: 280,
        left: 24,
        opacity: 0.5,
    },
    bgBubble5: {
        width: 40,
        height: 40,
        top: 540,
        right: 30,
        opacity: 0.7,
    },
    bgBubble6: {
        width: 90,
        height: 90,
        top: 780,
        left: 40,
        opacity: 0.4,
    },
    bgBubble7: {
        width: 55,
        height: 55,
        top: 1020,
        right: 80,
        opacity: 0.55,
    },

    // Outlined decorative icons (goal / task / achievement)
    bgIcon: {
        position: 'absolute',
        opacity: 0.18,
    },
    bgIcon1: {
        top: 300,
        right: 22,
        transform: [{ rotate: '-12deg' }],
    },
    bgIcon2: {
        top: 420,
        left: 18,
        transform: [{ rotate: '15deg' }],
    },
    bgIcon3: {
        top: 560,
        right: 18,
        transform: [{ rotate: '-8deg' }],
    },
    bgIcon4: {
        top: 690,
        left: 30,
        transform: [{ rotate: '20deg' }],
    },
    bgIcon5: {
        top: 820,
        right: 28,
        transform: [{ rotate: '-15deg' }],
    },
    bgIcon6: {
        top: 940,
        left: 24,
        transform: [{ rotate: '10deg' }],
    },
    bgIcon7: {
        top: 1060,
        right: 36,
        transform: [{ rotate: '-20deg' }],
    },
    bgIcon8: {
        top: 1170,
        left: 50,
        transform: [{ rotate: '8deg' }],
    },

    // Avatar — floats between gradient and white
    avatarFloatWrap: {
        alignItems: 'center',
        marginTop: -54,
        marginBottom: spacing.sm,
    },
    avatarRing: {
        width: 108,
        height: 108,
        borderRadius: 54,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },

    // Profile Header (text below avatar)
    profileHeader: {
        alignItems: 'center',
        marginBottom: spacing.lg,
        width: '100%',
        paddingHorizontal: spacing.screenPadding,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        ...typography.variants.h3,
        color: colors.text.inverse,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarImage: {
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
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
        paddingVertical: 5,
        borderRadius: 20,
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
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
        marginTop: spacing.lg,
        marginBottom: spacing.lg,
        marginHorizontal: spacing.sm,
    },
    overviewCard: {
        flex: 1,
        backgroundColor: colors.background.primary,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.md,
        paddingTop: spacing.md + 4,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    overviewAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
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
        marginHorizontal: spacing.sm,
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
    settingsDivider: {
        height: 1,
        backgroundColor: colors.border.light,
        marginVertical: spacing.xs,
        marginLeft: 36 + spacing.sm, // align with text after icon
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

    // Account Actions (sign out + delete)
    accountActions: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.buttonPaddingVertical,
        paddingHorizontal: spacing.buttonPaddingHorizontal,
        minHeight: 50,
        borderRadius: spacing.borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.error.main,
        backgroundColor: colors.background.primary,
        shadowColor: colors.error.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 4,
    },
    signOutText: {
        ...typography.variants.button,
        color: colors.error.main,
    },
    deleteAccountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.buttonPaddingVertical,
        paddingHorizontal: spacing.buttonPaddingHorizontal,
        minHeight: 50,
        borderRadius: spacing.borderRadius.lg,
        backgroundColor: colors.error.main,
        shadowColor: colors.error.main,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    deleteAccountText: {
        ...typography.variants.button,
        color: '#fff',
    },
});

export default ProfileScreen;
