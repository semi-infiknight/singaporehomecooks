// HomelyEats / ReciMe-style onboarding shell: progress bar, back nav, bottom CTA.
// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shcColors, shcSpacing, shcRadii, shcBorders, gourmeatColors, shcShadows } from './theme';

const HERO_RATIO = 0.42;
const HERO_RATIO_FORM = 0.22;
const HERO_MAX_FORM = 160;

export function SHCOnboardingDots({
  total,
  active,
  compact,
  testID = 'onboarding-dots',
}: {
  total: number;
  active: number;
  /** Tighter spacing for header chrome (no bottom margin). */
  compact?: boolean;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={[styles.dotsRow, compact && styles.dotsRowCompact]}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: total }, (_, i) => {
        const on = i === active;
        return (
          <View
            key={i}
            style={[styles.dot, on ? styles.dotActive : styles.dotInactive]}
            accessibilityState={{ selected: on }}
          />
        );
      })}
    </View>
  );
}

export function SHCOnboardingProgressBar({
  percent,
  testID = 'onboarding-progress-bar',
}: {
  percent: number;
  testID?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <View
      style={styles.progressTrack}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      <View style={[styles.progressFill, { width: `${clamped}%` }]} />
    </View>
  );
}

/** Stacked full-width option buttons (ReciMe / Swiggy question screens). */
export function SHCOnboardingOptionStack({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: readonly { label: string; value: string }[] | { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  testIDPrefix?: string;
}) {
  return (
    <View style={styles.optionStack}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.optionBtn, selected && styles.optionBtnSelected]}
            testID={testIDPrefix ? `${testIDPrefix}-${opt.value.replace(/\s+/g, '-').toLowerCase()}` : undefined}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.optionBtnText, selected && styles.optionBtnTextSelected]}>{opt.label}</Text>
            {selected ? (
              <View style={styles.optionCheck}>
                <Text style={styles.optionCheckMark}>✓</Text>
              </View>
            ) : (
              <View style={styles.optionCheckIdle} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const DEFAULT_HERO_STATS = [
  { value: '500+', label: 'Home cooks' },
  { value: 'HDB', label: 'Kitchens' },
  { value: 'PayNow', label: 'Payouts' },
] as const;

function SHCOnboardingHeroSplash({
  title,
  subtitle,
  imageUri,
  heroCardUris,
  heroStats,
  onNext,
  onSkip,
  nextLabel,
  skipLabel,
  nextTestID,
  skipTestID,
  disabled,
  loading,
  screenTestID,
}: {
  title: string;
  subtitle?: string;
  imageUri: string;
  heroCardUris?: string[];
  heroStats?: readonly { value: string; label: string }[];
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  skipLabel?: string;
  nextTestID?: string;
  skipTestID?: string;
  disabled?: boolean;
  loading?: boolean;
  screenTestID?: string;
}) {
  const insets = useSafeAreaInsets();
  const cards = (heroCardUris?.length ? heroCardUris : [imageUri, imageUri, imageUri]).slice(0, 3);
  const stats = heroStats?.length ? heroStats : DEFAULT_HERO_STATS;

  return (
    <View style={heroStyles.screen} testID={screenTestID}>
      {/* Soft depth layers — peach comfort, not flat coral block */}
      <View style={heroStyles.blobTop} pointerEvents="none" />
      <View style={heroStyles.blobBottom} pointerEvents="none" />

      <View style={[heroStyles.topBar, { paddingTop: insets.top + shcSpacing.sm }]}>
        <View style={heroStyles.brandPill}>
          <Text style={heroStyles.brandPillText}>Singapore Home Cooks</Text>
        </View>
        {onSkip ? (
          <Pressable
            onPress={onSkip}
            hitSlop={12}
            style={heroStyles.skipBtn}
            testID={skipTestID}
            accessibilityRole="button"
            accessibilityLabel={skipLabel}
          >
            <Text style={heroStyles.skipText}>{skipLabel || 'Skip'}</Text>
          </Pressable>
        ) : (
          <View style={heroStyles.topSpacer} />
        )}
      </View>

      <View style={heroStyles.content}>
        <View style={heroStyles.cardStack} accessibilityRole="image">
          {cards.map((uri, i) => {
            const offsets = [
              { left: 8, rotate: '-11deg', zIndex: 1, top: 14 },
              { left: 78, rotate: '2deg', zIndex: 3, top: 0 },
              { left: 148, rotate: '11deg', zIndex: 2, top: 16 },
            ][i];
            return (
              <View
                key={`${uri}-${i}`}
                style={[
                  heroStyles.card,
                  {
                    left: offsets.left,
                    top: offsets.top,
                    zIndex: offsets.zIndex,
                    transform: [{ rotate: offsets.rotate }],
                  },
                ]}
              >
                <Image source={{ uri }} style={heroStyles.cardImage} resizeMode="cover" accessibilityIgnoresInvertColors />
              </View>
            );
          })}
        </View>

        <Text style={heroStyles.headline} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={heroStyles.subline}>{subtitle}</Text> : null}

        <View style={heroStyles.statsBar}>
          {stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 ? <View style={heroStyles.statsDivider} /> : null}
              <View style={heroStyles.statItem}>
                <Text style={heroStyles.statValue}>{stat.value}</Text>
                <Text style={heroStyles.statLabel}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={[heroStyles.footer, { paddingBottom: Math.max(insets.bottom, shcSpacing.lg) }]}>
        <Pressable
          onPress={onNext}
          disabled={disabled || loading}
          testID={nextTestID}
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
        >
          {({ pressed }) => (
            <View
              style={[
                heroStyles.cta,
                (disabled || loading) && heroStyles.ctaDisabled,
                pressed && !disabled && !loading && heroStyles.ctaPressed,
              ]}
            >
              <Text style={heroStyles.ctaText}>{loading ? 'Please wait…' : nextLabel || 'Continue'}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Onboarding wizard shell — one focused screen per step.
 * - Linear progress bar + back chevron in header
 * - Optional hero for welcome / intro steps
 * - `variant="hero"` — full-bleed splash (welcome only; hides progress chrome)
 * - Primary CTA pinned at bottom
 */
export function SHCOnboardingFlowScreen({
  imageUri,
  title,
  subtitle,
  stepIndex,
  totalSteps,
  progressPercent,
  onNext,
  onSkip,
  onGuest,
  onBack,
  nextLabel = 'Continue',
  guestLabel = 'Continue as guest',
  skipLabel = 'Skip',
  nextTestID = 'onboarding-next-btn',
  skipTestID = 'onboarding-skip-btn',
  guestTestID = 'onboarding-guest-btn',
  secondaryLabel,
  onSecondary,
  secondaryTestID = 'onboarding-secondary-btn',
  disabled,
  loading,
  children,
  screenTestID,
  contentStyle,
  showHero,
  chapterLabel,
  variant = 'default',
  heroCardUris,
  heroStats,
}: {
  imageUri: string;
  title: string;
  subtitle?: string;
  stepIndex: number;
  totalSteps: number;
  /** 0–100 linear progress; defaults from stepIndex/totalSteps if omitted. */
  progressPercent?: number;
  onNext: () => void;
  onSkip?: () => void;
  onGuest?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  guestLabel?: string;
  skipLabel?: string;
  nextTestID?: string;
  skipTestID?: string;
  guestTestID?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryTestID?: string;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  screenTestID?: string;
  contentStyle?: ViewStyle;
  /** Force hero on/off; auto-detects from children when omitted. */
  showHero?: boolean;
  chapterLabel?: string;
  /** Full-screen coral splash — bypasses standard header/progress. */
  variant?: 'default' | 'hero';
  /** Three overlapping card images for hero splash. */
  heroCardUris?: string[];
  heroStats?: readonly { value: string; label: string }[];
}) {
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get('window').height;
  const hasForm = Boolean(children);
  const heroVisible = showHero ?? !hasForm;
  const heroHeight = heroVisible
    ? hasForm
      ? Math.min(HERO_MAX_FORM, Math.round(windowHeight * HERO_RATIO_FORM))
      : Math.round(windowHeight * HERO_RATIO)
    : 0;
  const percent =
    progressPercent ?? (totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0);
  const footerInset = 120 + Math.max(insets.bottom, shcSpacing.md);

  if (variant === 'hero') {
    return (
      <SHCOnboardingHeroSplash
        title={title}
        subtitle={subtitle}
        imageUri={imageUri}
        heroCardUris={heroCardUris}
        heroStats={heroStats}
        onNext={onNext}
        onSkip={onSkip}
        nextLabel={nextLabel}
        skipLabel={skipLabel}
        nextTestID={nextTestID}
        skipTestID={skipTestID}
        disabled={disabled}
        loading={loading}
        screenTestID={screenTestID}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID={screenTestID}
    >
      <View style={[styles.header, { paddingTop: insets.top + shcSpacing.xs }]}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={styles.backBtn}
            testID={secondaryTestID}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.headerCenter}>
          <SHCOnboardingProgressBar percent={percent} />
        </View>
        {onSkip ? (
          <Pressable
            onPress={onSkip}
            hitSlop={12}
            style={styles.skipHeaderBtn}
            testID={skipTestID}
            accessibilityRole="button"
            accessibilityLabel={skipLabel}
          >
            <Text style={styles.skipHeaderText}>{skipLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: footerInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {heroVisible ? (
          <View style={[styles.hero, { height: heroHeight }]}>
            <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" accessibilityIgnoresInvertColors />
            <View style={styles.heroOverlay} />
          </View>
        ) : null}

        <View style={[styles.body, !heroVisible && styles.bodyNoHero, contentStyle]}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {children ? <View style={styles.childrenWrap}>{children}</View> : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, shcSpacing.md) }]}>
        <Pressable
          onPress={onNext}
          disabled={disabled || loading}
          testID={nextTestID}
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
        >
          {({ pressed }) => (
            <View
              style={[
                styles.cta,
                (disabled || loading) && styles.ctaDisabled,
                pressed && !disabled && !loading && styles.ctaPressed,
              ]}
            >
              <Text style={styles.ctaText}>{loading ? 'Please wait…' : nextLabel}</Text>
            </View>
          )}
        </Pressable>

        {onSecondary && secondaryLabel && !onBack ? (
          <Pressable
            onPress={onSecondary}
            testID={secondaryTestID}
            accessibilityRole="button"
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryText}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}

        {onGuest ? (
          <Pressable
            onPress={onGuest}
            testID={guestTestID}
            accessibilityRole="button"
            accessibilityLabel={guestLabel}
            style={styles.guestBtn}
          >
            <Text style={styles.guestText}>{guestLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBF7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: shcSpacing.md,
    paddingBottom: shcSpacing.md,
    gap: shcSpacing.sm,
    backgroundColor: '#FFFBF7',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: shcRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: shcColors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.08)',
    ...shcShadows.brutalSm,
  },
  backIcon: { fontSize: 20, fontWeight: '800', color: shcColors.text },
  backPlaceholder: { width: 42 },
  headerCenter: { flex: 1, justifyContent: 'center' },
  skipHeaderBtn: {
    paddingHorizontal: shcSpacing.sm,
    paddingVertical: 8,
    minWidth: 42,
    alignItems: 'flex-end',
  },
  skipHeaderText: { fontSize: 14, fontWeight: '800', color: gourmeatColors.primary || shcColors.primary },
  progressTrack: {
    height: 8,
    borderRadius: shcRadii.pill,
    backgroundColor: '#F0E4D8',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: shcRadii.pill,
    backgroundColor: gourmeatColors.primary || shcColors.primary,
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  hero: {
    width: '100%',
    backgroundColor: shcColors.surfaceAlt,
    overflow: 'hidden',
    borderBottomLeftRadius: shcRadii.xl || 24,
    borderBottomRightRadius: shcRadii.xl || 24,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: 'transparent',
    // peach fade into page bg
    borderBottomLeftRadius: shcRadii.xl || 24,
    borderBottomRightRadius: shcRadii.xl || 24,
  },
  body: {
    paddingHorizontal: shcSpacing.lg,
    paddingTop: shcSpacing.lg,
    paddingBottom: shcSpacing.md,
    backgroundColor: '#FFFBF7',
  },
  bodyNoHero: {
    paddingTop: shcSpacing.md,
  },
  childrenWrap: {
    marginTop: shcSpacing.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: shcSpacing.md,
  },
  dotsRowCompact: {
    marginBottom: 0,
    gap: 6,
  },
  dot: { height: 8, borderRadius: 4 },
  dotInactive: { width: 8, backgroundColor: '#F0E4D8' },
  dotActive: { width: 24, backgroundColor: gourmeatColors.primary || shcColors.primary },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: shcColors.text,
    letterSpacing: -0.9,
    lineHeight: 36,
    marginBottom: shcSpacing.sm,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: shcColors.textLight,
    lineHeight: 24,
    marginBottom: shcSpacing.md,
  },
  optionStack: { gap: shcSpacing.sm, marginTop: shcSpacing.sm },
  optionBtn: {
    minHeight: 58,
    borderRadius: shcRadii.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.12)',
    backgroundColor: shcColors.surface,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: shcSpacing.lg,
    paddingVertical: shcSpacing.md,
    ...shcShadows.brutalSm,
  },
  optionBtnSelected: {
    backgroundColor: '#FFF5F0',
    borderColor: gourmeatColors.primary || shcColors.primary,
    borderWidth: 2,
  },
  optionBtnText: { flex: 1, fontSize: 16, fontWeight: '700', color: shcColors.text, paddingRight: 8 },
  optionBtnTextSelected: { color: shcColors.text },
  optionCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: gourmeatColors.primary || shcColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCheckMark: { color: '#fff', fontWeight: '900', fontSize: 14 },
  optionCheckIdle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.12)',
    backgroundColor: shcColors.surface,
  },
  footer: {
    paddingHorizontal: shcSpacing.lg,
    paddingTop: shcSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(36,24,18,0.08)',
    backgroundColor: 'rgba(255,251,247,0.98)',
    gap: 4,
  },
  cta: {
    backgroundColor: gourmeatColors.primary || shcColors.primary,
    borderRadius: 999,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: shcSpacing.lg,
    ...shcShadows.brutal,
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: -0.2 },
  secondaryBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shcRadii.lg,
    borderWidth: 2,
    borderColor: gourmeatColors.primary || shcColors.primary,
    marginTop: 8,
    backgroundColor: shcColors.surface,
  },
  secondaryText: {
    color: gourmeatColors.primary || shcColors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  guestBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  guestText: {
    color: shcColors.textLight,
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

const heroStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: gourmeatColors.primary || shcColors.primary,
  },
  blobTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  blobBottom: {
    position: 'absolute',
    bottom: 120,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: shcSpacing.lg,
    minHeight: 44,
  },
  topSpacer: { width: 56 },
  brandPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: shcRadii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  brandPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: shcColors.onPrimary,
    letterSpacing: 0.2,
  },
  skipBtn: {
    paddingHorizontal: shcSpacing.sm,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: shcRadii.pill,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '800',
    color: shcColors.onPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: shcSpacing.lg,
  },
  cardStack: {
    width: 268,
    height: 160,
    marginBottom: shcSpacing.xl,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: 112,
    height: 142,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
    backgroundColor: shcColors.surface,
    ...shcShadows.brutal,
  },
  cardImage: { width: '100%', height: '100%' },
  headline: {
    fontSize: 30,
    fontWeight: '900',
    color: shcColors.onPrimary,
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: shcSpacing.sm,
  },
  subline: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: shcSpacing.lg,
    paddingHorizontal: shcSpacing.sm,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingVertical: 12,
    paddingHorizontal: shcSpacing.md,
    marginTop: shcSpacing.sm,
    width: '100%',
    maxWidth: 340,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 17,
    fontWeight: '900',
    color: shcColors.onPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statsDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  footer: {
    paddingHorizontal: shcSpacing.lg,
    paddingTop: shcSpacing.sm,
  },
  cta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: shcSpacing.lg,
    ...shcShadows.brutal,
  },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  ctaDisabled: { opacity: 0.5 },
  ctaText: {
    color: gourmeatColors.primary || shcColors.primary,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});
