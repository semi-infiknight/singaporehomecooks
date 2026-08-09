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
  testID = 'onboarding-dots',
}: {
  total: number;
  active: number;
  testID?: string;
}) {
  return (
    <View testID={testID} style={styles.dotsRow} accessibilityRole="progressbar">
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
    <View style={styles.progressTrack} testID={testID} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: clamped }}>
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
      <View style={[heroStyles.topBar, { paddingTop: insets.top + shcSpacing.sm }]}>
        <View style={heroStyles.topSpacer} />
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
        <Text style={heroStyles.wordmark} accessibilityRole="header">
          home cooks
        </Text>

        <View style={heroStyles.cardStack} accessibilityRole="image">
          {cards.map((uri, i) => {
            const offsets = [
              { left: 0, rotate: '-10deg', zIndex: 1, top: 8 },
              { left: 72, rotate: '4deg', zIndex: 3, top: 0 },
              { left: 144, rotate: '12deg', zIndex: 2, top: 12 },
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

        <Text style={heroStyles.headline}>{title}</Text>
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

      <View style={[heroStyles.footer, { paddingBottom: Math.max(insets.bottom, shcSpacing.md) }]}>
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
          {chapterLabel ? <Text style={styles.chapterLabel}>{chapterLabel}</Text> : null}
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

        <View style={[styles.body, contentStyle]}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {children}
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
  screen: { flex: 1, backgroundColor: shcColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: shcSpacing.md,
    paddingBottom: shcSpacing.sm,
    gap: shcSpacing.sm,
    backgroundColor: shcColors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: shcColors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: shcRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: shcColors.surface,
    borderWidth: shcBorders.thin,
    borderColor: shcColors.borderLight,
  },
  backIcon: { fontSize: 20, fontWeight: '800', color: shcColors.text },
  backPlaceholder: { width: 40 },
  headerCenter: { flex: 1, gap: 4 },
  chapterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: shcColors.textLight,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  skipHeaderBtn: {
    paddingHorizontal: shcSpacing.sm,
    paddingVertical: 8,
    minWidth: 40,
    alignItems: 'flex-end',
  },
  skipHeaderText: { fontSize: 14, fontWeight: '700', color: shcColors.primary },
  progressTrack: {
    height: 6,
    borderRadius: shcRadii.pill,
    backgroundColor: shcColors.borderLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: shcRadii.pill,
    backgroundColor: gourmeatColors.primary || shcColors.primary,
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  hero: { width: '100%', backgroundColor: shcColors.surfaceAlt, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: 'rgba(255,248,240,0.6)',
  },
  body: {
    paddingHorizontal: shcSpacing.lg,
    paddingTop: shcSpacing.lg,
    paddingBottom: shcSpacing.md,
    backgroundColor: shcColors.background,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: shcSpacing.md,
  },
  dot: { height: 8, borderRadius: 4 },
  dotInactive: { width: 8, backgroundColor: shcColors.borderLight },
  dotActive: { width: 24, backgroundColor: gourmeatColors.primary || shcColors.primary },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: shcColors.text,
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: shcSpacing.sm,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: shcColors.textLight,
    lineHeight: 24,
    marginBottom: shcSpacing.lg,
  },
  optionStack: { gap: shcSpacing.sm, marginTop: shcSpacing.sm },
  optionBtn: {
    minHeight: 56,
    borderRadius: shcRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: shcColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: shcSpacing.lg,
    paddingVertical: shcSpacing.md,
  },
  optionBtnSelected: {
    backgroundColor: shcColors.primary,
    borderColor: shcColors.primary,
  },
  optionBtnText: { fontSize: 17, fontWeight: '700', color: shcColors.text },
  optionBtnTextSelected: { color: shcColors.onPrimary },
  footer: {
    paddingHorizontal: shcSpacing.lg,
    paddingTop: shcSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: shcColors.borderLight,
    backgroundColor: shcColors.background,
    gap: 4,
  },
  cta: {
    backgroundColor: gourmeatColors.primary || shcColors.primary,
    borderRadius: shcRadii.lg,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: shcSpacing.lg,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
  },
  ctaPressed: { opacity: 0.88 },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: shcColors.onPrimary, fontSize: 17, fontWeight: '800' },
  secondaryBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shcRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.primary || shcColors.primary,
    marginTop: 8,
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
    backgroundColor: shcColors.primary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: shcSpacing.lg,
    minHeight: 44,
  },
  topSpacer: { width: 56 },
  skipBtn: {
    paddingHorizontal: shcSpacing.sm,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '700',
    color: shcColors.onPrimary,
    opacity: 0.92,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: shcSpacing.lg,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: '900',
    color: shcColors.onPrimary,
    textTransform: 'lowercase',
    letterSpacing: -1.2,
    marginBottom: shcSpacing.lg,
  },
  cardStack: {
    width: 248,
    height: 148,
    marginBottom: shcSpacing.xl,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: 104,
    height: 132,
    borderRadius: shcRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
    backgroundColor: shcColors.surface,
    ...shcShadows.brutal,
  },
  cardImage: { width: '100%', height: '100%' },
  headline: {
    fontSize: 28,
    fontWeight: '900',
    color: shcColors.onPrimary,
    textAlign: 'center',
    letterSpacing: -0.6,
    lineHeight: 34,
    marginBottom: shcSpacing.sm,
  },
  subline: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: shcSpacing.lg,
    paddingHorizontal: shcSpacing.sm,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: shcRadii.lg,
    borderWidth: shcBorders.thin,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingVertical: shcSpacing.sm,
    paddingHorizontal: shcSpacing.md,
    marginTop: shcSpacing.sm,
    width: '100%',
    maxWidth: 320,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: shcColors.onPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statsDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  footer: {
    paddingHorizontal: shcSpacing.lg,
    paddingTop: shcSpacing.sm,
  },
  cta: {
    backgroundColor: shcColors.onPrimary,
    borderRadius: shcRadii.lg,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: shcSpacing.lg,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
  },
  ctaPressed: { opacity: 0.9 },
  ctaDisabled: { opacity: 0.5 },
  ctaText: {
    color: shcColors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
});
