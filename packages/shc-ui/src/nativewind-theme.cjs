// CommonJS mirror of theme tokens for tailwind.config.js (Node cannot import .ts directly).
const shcColors = {
  primary: '#D96C4A',
  primaryDark: '#B84F32',
  accent: '#FFB800',
  accentDark: '#E5A600',
  background: '#FFF8F0',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF0E6',
  text: '#241812',
  textLight: '#5C5144',
  border: '#241812',
  borderLight: '#E8D5B7',
  success: '#15803D',
  warning: '#CA8A04',
  error: '#B91C1C',
  trafficGreen: '#15803D',
  trafficYellow: '#CA8A04',
  trafficRed: '#B91C1C',
  heritage: '#8B5E3C',
  bentoMint: '#E8F5E9',
  bentoPeach: '#FFE8DC',
  bentoYellow: '#FFF3C4',
};

const shcSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const shcRadii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
};

const shcBorders = {
  thin: 1,
  brutal: 2,
  thick: 3,
};

/** Tailwind theme extensions for NativeWind (keep in sync with theme.ts). */
const shcNativeWindTheme = {
  colors: shcColors,
  spacing: shcSpacing,
  borderRadius: shcRadii,
  borderWidth: shcBorders,
};

module.exports = { shcNativeWindTheme, shcColors, shcSpacing, shcRadii, shcBorders };