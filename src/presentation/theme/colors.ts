// src/presentation/theme/colors.ts

export const colors = {
  // Primary Colors - Deep Purple/Violet (from design)
  primary: {
    main: '#7C3AED', // Vibrant purple
    light: '#A78BFA',
    dark: '#5B21B6',
    contrast: '#FFFFFF',
  },
  
  // Secondary Colors - Complementary Purple
  secondary: {
    main: '#8B5CF6', // Soft purple
    light: '#C4B5FD',
    dark: '#6D28D9',
    contrast: '#FFFFFF',
  },
  
  // Accent Colors - Gradient Purple
  accent: {
    main: '#A855F7', // Bright purple
    light: '#D8B4FE',
    dark: '#7E22CE',
    contrast: '#FFFFFF',
  },
  
  // Semantic Colors
  success: {
    main: '#10B981', // Emerald green (for "On track")
    light: '#34D399',
    dark: '#059669',
    background: '#ECFDF5',
  },
  
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    background: '#FFFBEB',
  },
  
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    background: '#FEF2F2',
  },
  
  info: {
    main: '#6366F1', // Indigo
    light: '#818CF8',
    dark: '#4F46E5',
    background: '#EEF2FF',
  },
  
  // Neutral Colors - with purple undertone
  neutral: {
    50: '#FAFAFC',
    100: '#F4F4F7',
    200: '#E4E4EC',
    300: '#D1D1E0',
    400: '#9F9FB8',
    500: '#6E6E8A',
    600: '#4A4A63',
    700: '#363650',
    800: '#1F1F35',
    900: '#0F0A1E', // Deep dark purple-black (from design)
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FC', // Slight purple tint
    tertiary: '#F1F2F8',
    dark: '#0F0A1E', // Deep purple-black for dark mode
    darkSecondary: '#1A1033', // Slightly lighter dark purple
  },
  
  // Text Colors
  text: {
    primary: '#1A1033', // Dark purple-black
    secondary: '#6E6E8A',
    tertiary: '#9F9FB8',
    disabled: '#D1D1E0',
    inverse: '#FFFFFF',
  },
  
  // Border Colors
  border: {
    light: '#E4E4EC',
    medium: '#D1D1E0',
    dark: '#9F9FB8',
  },
  
  // Overlay
  overlay: {
    light: 'rgba(15, 10, 30, 0.1)',
    medium: 'rgba(15, 10, 30, 0.3)',
    dark: 'rgba(15, 10, 30, 0.5)',
  },
  
  // Progress/Chart Colors
  chart: {
    purple: '#7C3AED',
    violet: '#8B5CF6',
    indigo: '#6366F1',
    pink: '#EC4899',
    cyan: '#06B6D4',
  },
} as const;

export type ColorTheme = typeof colors;
