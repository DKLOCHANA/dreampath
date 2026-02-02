// src/presentation/theme/index.ts
import { colors, ColorTheme } from './colors';
import { typography, Typography } from './typography';
import { spacing, Spacing } from './spacing';
import { shadows, Shadows } from './shadows';

export const theme = {
  colors,
  typography,
  spacing,
  shadows,
} as const;

export type Theme = {
  colors: ColorTheme;
  typography: Typography;
  spacing: Spacing;
  shadows: Shadows;
};

export { colors, typography, spacing, shadows };
