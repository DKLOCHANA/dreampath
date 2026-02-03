// src/presentation/screens/onboarding/QuestionScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/presentation/theme/colors';
import { spacing } from '@/presentation/theme/spacing';
import { OnboardingStackParamList } from '@/presentation/navigation/types';
import { onboardingData, Answer } from './onboardingData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Question'>;
type RouteProps = RouteProp<OnboardingStackParamList, 'Question'>;

export const QuestionScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { questionIndex } = route.params;

    const question = onboardingData.questions[questionIndex];
    const totalQuestions = onboardingData.questions.length;

    const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const answerAnims = useRef(question.answers.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        // Reset animations when question changes
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        setSelectedAnswer(null);
        answerAnims.forEach(anim => anim.setValue(0));

        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }),
            // Progress bar animation
            Animated.timing(progressAnim, {
                toValue: (questionIndex + 1) / totalQuestions,
                duration: 600,
                useNativeDriver: false,
            }),
        ]).start();

        // Stagger answer cards
        Animated.stagger(100,
            answerAnims.map(anim =>
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                })
            )
        ).start();
    }, [questionIndex]);

    const handleAnswerSelect = (answer: Answer) => {
        setSelectedAnswer(answer);

        // Navigate to the appropriate report screen based on question index
        setTimeout(() => {
            const reportScreens = ['Report1', 'Report2', 'Report3', 'Report4'] as const;
            const reportScreen = reportScreens[questionIndex];
            navigation.navigate(reportScreen, {
                questionIndex,
                selectedAnswer: answer,
            });
        }, 300);
    };

    const handleBack = () => {
        if (questionIndex === 0) {
            navigation.navigate('OnboardingWelcome');
        } else {
            navigation.goBack();
        }
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                    {/* Back Button + Progress Bar */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <Animated.View
                                    style={[
                                        styles.progressFill,
                                        { width: progressWidth }
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {questionIndex + 1}/{totalQuestions}
                            </Text>
                        </View>
                    </View>

                    {/* Question */}
                    <Animated.View
                        style={[
                            styles.questionContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                    >
                        <Text style={styles.questionText}>{question.question}</Text>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>

            {/* Answer Options - Fixed height, no scroll */}
            <SafeAreaView edges={['bottom']} style={styles.answersContainer}>
                <View style={styles.answersContent}>
                    {question.answers.map((answer, index) => (
                        <Animated.View
                            key={answer.answerId}
                            style={{
                                opacity: answerAnims[index],
                                transform: [{
                                    translateY: answerAnims[index].interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [30, 0],
                                    })
                                }],
                            }}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.answerCard,
                                    selectedAnswer?.answerId === answer.answerId && styles.answerCardSelected,
                                ]}
                                onPress={() => handleAnswerSelect(answer)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.answerIconContainer,
                                    selectedAnswer?.answerId === answer.answerId && styles.answerIconContainerSelected,
                                ]}>
                                    <Ionicons
                                        name={answer.icon as any}
                                        size={22}
                                        color={selectedAnswer?.answerId === answer.answerId ? '#fff' : colors.primary.main}
                                    />
                                </View>
                                <Text style={[
                                    styles.answerText,
                                    selectedAnswer?.answerId === answer.answerId && styles.answerTextSelected,
                                ]}>
                                    {answer.text}
                                </Text>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={selectedAnswer?.answerId === answer.answerId ? colors.primary.main : colors.text.tertiary}
                                />
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
    },
    headerGradient: {
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerSafeArea: {
        paddingHorizontal: spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
    questionContainer: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 30,
        textAlign: 'center',
    },
    answersContainer: {
        flex: 1,
    },
    answersContent: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        justifyContent: 'center',
        gap: spacing.sm,
    },
    answerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: spacing.md,
        gap: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    answerCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '08',
    },
    answerIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primary.main + '12',
        justifyContent: 'center',
        alignItems: 'center',
    },
    answerIconContainerSelected: {
        backgroundColor: colors.primary.main,
    },
    answerText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: colors.text.primary,
        lineHeight: 20,
    },
    answerTextSelected: {
        color: colors.primary.main,
        fontWeight: '600',
    },
});

export default QuestionScreen;
