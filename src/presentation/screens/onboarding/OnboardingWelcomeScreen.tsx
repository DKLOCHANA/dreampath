// src/presentation/screens/onboarding/OnboardingWelcomeScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/presentation/theme/colors';
import { typography } from '@/presentation/theme/typography';
import { spacing } from '@/presentation/theme/spacing';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { onboardingData } from './onboardingData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingWelcome'>;

export const OnboardingWelcomeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { welcomeScreen } = onboardingData;

    // Animation values
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(30)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;
    const buttonTranslateY = useRef(new Animated.Value(20)).current;
    const sparkleRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start entrance animations
        Animated.sequence([
            // Logo appears with bounce
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 4,
                    tension: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            // Text slides up and fades in
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(textTranslateY, {
                    toValue: 0,
                    friction: 6,
                    useNativeDriver: true,
                }),
            ]),
            // Button appears
            Animated.parallel([
                Animated.timing(buttonOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(buttonTranslateY, {
                    toValue: 0,
                    friction: 6,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Continuous sparkle rotation
        Animated.loop(
            Animated.timing(sparkleRotate, {
                toValue: 1,
                duration: 4000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const sparkleRotation = sparkleRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleGetStarted = () => {
        navigation.navigate('Question', { questionIndex: 0 });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Decorative elements */}
                <Animated.View
                    style={[
                        styles.sparkle,
                        styles.sparkle1,
                        { transform: [{ rotate: sparkleRotation }] }
                    ]}
                >
                    <Ionicons name="sparkles" size={24} color="rgba(255,255,255,0.3)" />
                </Animated.View>
                <Animated.View
                    style={[
                        styles.sparkle,
                        styles.sparkle2,
                        { transform: [{ rotate: sparkleRotation }] }
                    ]}
                >
                    <Ionicons name="star" size={16} color="rgba(255,255,255,0.2)" />
                </Animated.View>
                <Animated.View
                    style={[
                        styles.sparkle,
                        styles.sparkle3,
                        { transform: [{ rotate: sparkleRotation }] }
                    ]}
                >
                    <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.25)" />
                </Animated.View>

                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        {/* Logo Section */}
                        <Animated.View
                            style={[
                                styles.logoContainer,
                                {
                                    opacity: logoOpacity,
                                    transform: [{ scale: logoScale }],
                                }
                            ]}
                        >
                            <View style={styles.logoIconWrapper}>
                                <Image
                                    source={require('../../../../assets/icon.png')}
                                    style={styles.logoIcon}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.logoText}>{welcomeScreen.logo}</Text>
                        </Animated.View>

                        {/* Text Section */}
                        <Animated.View
                            style={[
                                styles.textContainer,
                                {
                                    opacity: textOpacity,
                                    transform: [{ translateY: textTranslateY }],
                                }
                            ]}
                        >
                            <Text style={styles.slogan}>{welcomeScreen.slogan}</Text>
                            <Text style={styles.subtitle}>{welcomeScreen.subtitle}</Text>
                        </Animated.View>

                        {/* Button Section */}
                        <Animated.View
                            style={[
                                styles.buttonContainer,
                                {
                                    opacity: buttonOpacity,
                                    transform: [{ translateY: buttonTranslateY }],
                                }
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.ctaButton}
                                onPress={handleGetStarted}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.ctaButtonText}>{welcomeScreen.ctaButton}</Text>
                            </TouchableOpacity>
                        </Animated.View>


                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    sparkle: {
        position: 'absolute',
    },
    sparkle1: {
        top: '15%',
        left: '10%',
    },
    sparkle2: {
        top: '25%',
        right: '15%',
    },
    sparkle3: {
        bottom: '30%',
        left: '20%',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing['2xl'],
    },
    logoIconWrapper: {
        marginBottom: spacing.lg,
    },
    logoIcon: {
        width: 250,
        height: 250,
    },
    logoText: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: spacing['3xl'],
    },
    slogan: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: spacing.md,
        lineHeight: 36,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: spacing.md,
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: spacing.lg,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: '#fff',
        paddingVertical: spacing.md + 2,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    ctaButtonText: {
        color: colors.primary.main,
        fontSize: 18,
        fontWeight: '700',
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        position: 'absolute',
        bottom: 40,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dotActive: {
        backgroundColor: '#fff',
        width: 24,
    },
});

export default OnboardingWelcomeScreen;
