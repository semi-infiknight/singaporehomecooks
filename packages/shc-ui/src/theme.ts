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
  /** Status chip surfaces (tiffin, orders) */
  surfaceInfo: '#E3F2FD',
  info: '#1565C0',
  surfaceNeutral: '#F5F5F5',
  neutral: '#616161',
  surfaceSkipped: '#FFF3E0',
  warningDark: '#E65100',
  surfaceErrorAlt: '#FFEBEE',
  errorDark: '#C62828',
  /** Pill CTA ink (Order now / Pay / Next) */
  ctaInk: '#111111',
  ctaInkPressed: '#2A2A2A',
  ctaArrowWell: 'rgba(255,255,255,0.16)',
  /** White pill over photos */
  ctaHeroText: '#4A2410',
};

export const shcSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  /** Toptal: generous white space between discover sections */
  section: 20,
  /** Vertical gap between stacked cards/rails (search → banner → section). */
  stack: 12,
  /** Equal vertical rhythm: section above → eyebrow → circle → label (8px each) */
  categoryStackGap: 8,
  /** @deprecated use categoryStackGap */
  categoryLabelGap: 8,
  /** @deprecated use categoryStackGap */
  categoryTitleGap: 8,
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
  /** 1px divider — alias for thin (cook compliance etc.) */
  hairline: 1,
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
  /** Soft elevation under pill CTAs (screenshots: Order now / Add more). */
  ctaPill: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaPillSoft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
};

/** DM Sans / DM Mono — loaded via useSHCFonts on mobile; web uses next/font CSS vars. */
export const shcFontFamilies = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
  black: 'DMSans_800ExtraBold',
  mono: 'DMMono_500Medium',
} as const;

export function shcFontFamilyForWeight(fontWeight?: string | number | null): string {
  const raw = fontWeight ?? 400;
  const w = typeof raw === 'string' ? parseInt(raw, 10) || 400 : raw;
  if (w >= 800) return shcFontFamilies.black;
  if (w >= 600) return shcFontFamilies.bold;
  if (w >= 500) return shcFontFamilies.medium;
  return shcFontFamilies.regular;
}

export const shcTypography = {
  display: { fontSize: 28, fontWeight: '900' as const, letterSpacing: -0.5, fontFamily: shcFontFamilies.black },
  h1: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3, fontFamily: shcFontFamilies.black },
  h2: { fontSize: 18, fontWeight: '800' as const, letterSpacing: -0.3, fontFamily: shcFontFamilies.black },
  h3: { fontSize: 16, fontWeight: '700' as const, fontFamily: shcFontFamilies.bold },
  body: { fontSize: 14, fontWeight: '500' as const, fontFamily: shcFontFamilies.regular },
  bodyBold: { fontSize: 14, fontWeight: '700' as const, fontFamily: shcFontFamilies.bold },
  caption: { fontSize: 12, fontWeight: '500' as const, fontFamily: shcFontFamilies.regular },
  captionBold: { fontSize: 12, fontWeight: '700' as const, fontFamily: shcFontFamilies.bold },
  micro: { fontSize: 11, fontWeight: '600' as const, fontFamily: shcFontFamilies.medium },
  microBold: { fontSize: 11, fontWeight: '800' as const, fontFamily: shcFontFamilies.black },
  eyebrow: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, fontFamily: shcFontFamilies.black },
  mono: { fontSize: 14, fontWeight: '600' as const, fontVariant: ['tabular-nums'] as const, fontFamily: shcFontFamilies.mono },
};

/** Customer Gourmeat card chrome — soft 1px borders (not neo-brutal cook/forms). */
export const gourmeatSurfaces = {
  cardBorderWidth: 1,
  cardBorderColor: '#E8E8E8',
};

/** Gourmeat customer skin typography — Orbix Studio discover/checkout. */
export const gourmeatTypography = {
  homeHeadline: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 32, fontFamily: shcFontFamilies.black },
  screenTitle: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5, fontFamily: shcFontFamilies.black },
  sectionTitle: { fontSize: 18, fontWeight: '800' as const, letterSpacing: -0.3, fontFamily: shcFontFamilies.black },
  cardTitle: { fontSize: 14, fontWeight: '700' as const, fontFamily: shcFontFamilies.bold },
  cardMeta: { fontSize: 11, fontWeight: '500' as const, fontFamily: shcFontFamilies.regular },
  price: { fontSize: 15, fontWeight: '800' as const, fontFamily: shcFontFamilies.black },
  locationHint: { fontSize: 11, fontWeight: '600' as const, fontFamily: shcFontFamilies.medium },
  locationLabel: { fontSize: 12, fontWeight: '700' as const, fontFamily: shcFontFamilies.bold },
  search: { fontSize: 14, fontWeight: '500' as const, fontFamily: shcFontFamilies.regular },
  tabLabel: { fontSize: 10, fontWeight: '500' as const, fontFamily: shcFontFamilies.regular },
  tabLabelActive: { fontSize: 10, fontWeight: '700' as const, fontFamily: shcFontFamilies.bold },
  categoryLabel: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14, fontFamily: shcFontFamilies.regular },
  categoryLabelActive: { fontSize: 11, fontWeight: '700' as const, lineHeight: 14, fontFamily: shcFontFamilies.bold },
};

/** Standard icon sizes (SHCIcon, lucide web mirrors). */
export const shcIconSizes = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
  nav: 22,
  category: 26,
} as const;

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
  /** Subscription offer banner (navy) */
  offerNavy: '#1E3A5F',
  /** Star rating accent */
  ratingStar: '#F5A623',
  /** Text on primary / hero banners */
  heroCream: '#FFF8F0',
  /** Photo overlay on cards/rails */
  overlayDark: 'rgba(36,24,18,0.45)',
  overlayHero: 'rgba(36,24,18,0.42)',
  onHero: 'rgba(255,255,255,0.92)',
  onHeroMuted: 'rgba(255,255,255,0.85)',
  onHeroSubtle: 'rgba(255,255,255,0.95)',
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

/** Vertical rhythm for stacked homepage / discover cards (Neo-Brutalist bento). */
export const shcSectionStack = {
  marginTop: shcSpacing.stack,
  marginBottom: shcSpacing.section,
} as const;

/** Section title: stack above, sm below content. */
export const shcTitleBlock = {
  marginTop: shcSpacing.stack,
  marginBottom: shcSpacing.sm,
} as const;

/** Gap between stacked list cards (kitchen, order, listing rows). */
export const shcCardGap = {
  marginBottom: shcSpacing.stack,
} as const;

/** Form fields, inputs, wizard steps. */
export const shcFieldStack = {
  marginBottom: shcSpacing.sm,
} as const;

/** Screen header block → first content (search, filters). */
export const shcHeaderGap = {
  marginBottom: shcSpacing.md,
} as const;

/** In-flow callout / alert / inset banner (not a full section break). */
export const shcInsetStack = {
  marginTop: shcSpacing.stack,
  marginBottom: shcSpacing.sm,
} as const;

/** Screen horizontal inset (FlashList / ScrollView content). */
export const shcScreenInset = {
  paddingHorizontal: shcSpacing.md,
} as const;

/** Empty state vertical breathing room. */
export const shcEmptyStatePad = {
  paddingVertical: shcSpacing.xl,
} as const;

/** Bottom inset for content/CTAs above the floating customer tab bar (+ optional sticky cart). */
export const gourmeatLayout = {
  /** Floating nav pill + margins (no sticky cart). */
  tabBarClearance: 88,
  /** Sticky cart bar + floating nav + margins. */
  tabBarWithCartClearance: 156,
  /** Pinned Pay / CTA row height (excludes safe-area — add inset separately). */
  stickyFooterClearance: 80,
};

/** Scroll content padding when the floating tab bar is visible. */
export function contentPadForTabBar(bottomInset = 0): number {
  return gourmeatLayout.tabBarClearance + Math.max(bottomInset, shcSpacing.sm);
}

/** Scroll content padding when the screen has its own sticky footer (tab bar hidden). */
export function contentPadForStickyFooter(bottomInset = 0): number {
  return gourmeatLayout.stickyFooterClearance + Math.max(bottomInset, shcSpacing.sm);
}

/** Scroll content padding on stack/modal screens (no tab bar, no sticky footer). */
export function contentPadSafe(bottomInset = 0): number {
  return Math.max(bottomInset, shcSpacing.md);
}

export const gourmeatTheme = {
  colors: gourmeatColors,
  radii: gourmeatRadii,
  shadows: gourmeatShadows,
  spacing: shcSpacing,
  typography: gourmeatTypography,
  layout: gourmeatLayout,
};