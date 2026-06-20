// Neo-Brutalist Food UI tokens — single source for mobile (@shc/ui).
// Must stay in sync with brand.md + apps/web/app/globals.css (tri-platform rule).
export const shcColors = {
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
  // Semantic surfaces (avoid hardcoded hex in components)
  surfaceSuccess: '#DCFCE7',
  surfaceWarning: '#FEF3C7',
  surfaceError: '#FEE2E2',
  surfaceHeritage: '#FDF2E9',
  onPrimary: '#FFFFFF',
  tierBronze: '#92400E',
  tierSilver: '#6B7280',
  tierGold: '#F59E0B',
};

export const shcSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  /** Toptal: generous white space between discover sections */
  section: 20,
  tabBarHeight: 56,
  stickyHeaderPadding: 12,
};

export const shcRadii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
};

export const shcBorders = {
  thin: 1,
  brutal: 2,
  thick: 3,
};

export const shcShadows = {
  brutal: {
    shadowColor: '#241812',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  brutalSm: {
    shadowColor: '#241812',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  brutalPressed: {
    shadowColor: '#241812',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
};

export const shcTypography = {
  display: { fontSize: 28, fontWeight: '900' as const, letterSpacing: -0.5 },
  h1: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
  h2: { fontSize: 18, fontWeight: '800' as const, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  mono: { fontSize: 14, fontWeight: '600' as const, fontVariant: ['tabular-nums'] as const },
};

export const shcMotion = {
  springPress: { damping: 15, stiffness: 400, mass: 0.8 },
  springSelect: { damping: 18, stiffness: 320 },
  fadeInMs: 300,
  stickyScrollThreshold: 24,
};

export const shcTheme = {
  colors: shcColors,
  spacing: shcSpacing,
  radii: shcRadii,
  borders: shcBorders,
  shadows: shcShadows,
  typography: shcTypography,
  motion: shcMotion,
};

export type SHCColors = typeof shcColors;

/** Gourmeat (Orbix Studio) — customer discover/checkout skin. Cook app keeps neo-brutalist tokens above. */
export const gourmeatColors = {
  primary: '#F87048',
  primaryDark: '#E05A32',
  primaryLight: '#FFF0EB',
  accent: '#FFB800',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F5',
  text: '#1C1C1C',
  textLight: '#8A8A8A',
  textMuted: '#B0B0B0',
  border: '#E8E8E8',
  borderDark: '#1C1C1C',
  nav: '#1C1C1C',
  navActive: '#F87048',
  onPrimary: '#FFFFFF',
  onDark: '#FFFFFF',
  pay: '#1C1C1C',
  payPressed: '#333333',
  discount: '#F87048',
  success: '#22C55E',
  error: '#EF4444',
};

export const gourmeatRadii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
  nav: 28,
};

export const gourmeatShadows = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  nav: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const gourmeatTheme = {
  colors: gourmeatColors,
  radii: gourmeatRadii,
  shadows: gourmeatShadows,
  spacing: shcSpacing,
  typography: shcTypography,
};