// Singapore heritage theme tokens (matches root _layout.tsx and 12-shared-components.md)
// Warm cream HDB kitchen, tropical green, Peranakan terracotta, heritage wood tones.
export const shcColors = {
  primary: '#1D9E75',
  primaryDark: '#166B52',
  accent: '#B85C38',
  background: '#FAF7F2',
  surface: '#F5F0E6',
  surfaceAlt: '#FDF9F3',
  text: '#2C2416',
  textLight: '#5C5144',
  success: '#2E8B57',
  warning: '#D97706',
  error: '#B91C1C',
  trafficGreen: '#15803D',
  trafficYellow: '#CA8A04',
  trafficRed: '#B91C1C',
  heritage: '#8B5E3C',
};

export const shcSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const shcRadii = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
};

export const shcTheme = {
  colors: shcColors,
  spacing: shcSpacing,
  radii: shcRadii,
};

export type SHCColors = typeof shcColors;
