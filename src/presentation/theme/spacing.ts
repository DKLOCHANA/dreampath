// src/presentation/theme/spacing.ts

export const spacing = {
  // Base spacing unit: 4px
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  
  // Semantic spacing
  gutter: 16,
  screenPadding: 20,
  cardPadding: 16,
  sectionGap: 24,
  itemGap: 12,
  
  // Component specific
  buttonPaddingHorizontal: 24,
  buttonPaddingVertical: 14,
  inputPaddingHorizontal: 16,
  inputPaddingVertical: 14,
  
  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },
} as const;

export type Spacing = typeof spacing;
