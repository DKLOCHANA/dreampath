// src/presentation/screens/onboarding/FinalWelcomeScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { RootStackParamList } from '@/presentation/navigation/types';
import { onboardingData } from './onboardingData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FinalWelcomeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { finalWelcomeScreen } = onboardingData;

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const featureAnims = useRef(finalWelcomeScreen.features.map(() => new Animated.Value(0))).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            }),
        ]).start();

        // Stagger features
        setTimeout(() => {
            Animated.stagger(80,
                featureAnims.map(anim =>
                    Animated.spring(anim, {
                        toValue: 1,
                        friction: 8,
                        useNativeDriver: true,
                    })
                )
            ).start();
        }, 300);

        // Button animation
        setTimeout(() => {
            Animated.spring(buttonAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            }).start();
        }, 600);

        // Continuous pulse for CTA
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleStartJourney = () => {
        // Navigate to Register screen
        navigation.navigate('Auth', { screen: 'Register' });
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const featureIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
        'Personalized AI Planning': 'sparkles',
        'Daily Task Generation': 'list',
        'Real-time Progress Tracking': 'analytics',
        'Adaptive Goal Adjustment': 'refresh',
        'Unlimited Goals & Projects': 'infinite',
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header with Back Button */}
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Animated.View
                        style={[
                            styles.headerContent,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { translateY: slideAnim },
                                    { scale: scaleAnim },
                                ],
                            }
                        ]}
                    >
                        {/* Celebration Icon */}
                        <View style={styles.celebrationIcon}>
                            <Ionicons name="rocket" size={36} color="#fff" />
                        </View>

                        <Text style={styles.headline}>{finalWelcomeScreen.headline}</Text>
                        <Text style={styles.subheadline}>{finalWelcomeScreen.subheadline}</Text>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>

            {/* Content - No Scroll */}
            <SafeAreaView edges={['bottom']} style={styles.contentContainer}>
                <View style={styles.contentInner}>
                    {/* Features */}
                    <View style={styles.featuresGrid}>
                        {finalWelcomeScreen.features.slice(0, 4).map((feature, index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.featureItem,
                                    {
                                        opacity: featureAnims[index],
                                        transform: [{
                                            translateX: featureAnims[index].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-20, 0],
                                            })
                                        }],
                                    }
                                ]}
                            >
                                <View style={styles.featureIcon}>
                                    <Ionicons
                                        name={featureIcons[feature] || 'checkmark'}
                                        size={20}
                                        color={colors.primary.main}
                                    />
                                </View>
                                <Text style={styles.featureText}>{feature}</Text>
                            </Animated.View>
                        ))}
                    </View>

                    {/* Trust Element */}
                    <View style={styles.trustRow}>
                        {finalWelcomeScreen.trustElements.slice(0, 2).map((trust, index) => (
                            <View key={index} style={styles.trustItem}>
                                <Ionicons
                                    name={index === 0 ? 'trophy' : 'star'}
                                    size={14}
                                    color={colors.success.main}
                                />
                                <Text style={styles.trustText}>{trust}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* CTA Button */}
                <View style={styles.buttonContainer}>
                    <Animated.View
                        style={{
                            opacity: buttonAnim,
                            transform: [
                                { scale: pulseAnim },
                                {
                                    translateY: buttonAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20, 0],
                                    })
                                }
                            ],
                        }}
                    >
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleStartJourney}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.primaryGradient}
                            >
                                <Ionicons name="rocket" size={20} color="#fff" />
                                <Text style={styles.primaryButtonText}>{finalWelcomeScreen.ctaPrimary}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    headerGradient: {
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerSafeArea: {
        paddingHorizontal: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    headerContent: {
        alignItems: 'center',
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    celebrationIcon: {
        width: 70,
        height: 70,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    headline: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subheadline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    contentInner: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        justifyContent: 'center',
    },
    featuresGrid: {
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: '#fff',
        padding: spacing.md,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary.main + '12',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    trustRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.lg,
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    trustText: {
        fontSize: 12,
        color: colors.success.main,
        fontWeight: '500',
    },
    buttonContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md + 2,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
});

export default FinalWelcomeScreen;
