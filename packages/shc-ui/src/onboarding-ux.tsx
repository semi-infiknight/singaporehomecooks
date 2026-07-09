// HomelyEats-style onboarding shell: warm hero, dots, primary CTA + guest explore.
// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, Image, ScrollView, StyleSheet, Dimensions, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shcColors, shcSpacing, shcRadii, gourmeatColors } from './theme';

const HERO_RATIO = 0.48;

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

/**
 * Onboarding carousel shell (HomelyEats case study §Onboarding).
 * - Warm hero illustration
 * - Dot progress
 * - Primary CTA + optional guest explore (low barrier)
 */
export function SHCOnboardingFlowScreen({
  imageUri,
  title,
  subtitle,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
  onGuest,
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
}: {
  imageUri: string;
  title: string;
  subtitle?: string;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip?: () => void;
  /** HomelyEats: explore without account */
  onGuest?: () => void;
  nextLabel?: string;
  guestLabel?: string;
  skipLabel?: string;
  nextTestID?: string;
  skipTestID?: string;
  guestTestID?: string;
  /** Optional mid-footer CTA e.g. Sign in */
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryTestID?: string;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  screenTestID?: string;
  contentStyle?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(Dimensions.get('window').height * HERO_RATIO);

  return (
    <View style={styles.screen} testID={screenTestID}>
      <View style={[styles.hero, { height: heroHeight }]}>
        <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" accessibilityIgnoresInvertColors />
        <View style={styles.heroOverlay} />
        <View style={[styles.heroBrand, { top: insets.top + shcSpacing.sm }]}>
          <Text style={styles.heroBrandText}>Singapore Home Cooks</Text>
        </View>
        {onSkip ? (
          <Pressable
            onPress={onSkip}
            hitSlop={12}
            style={[styles.skipBtn, { top: insets.top + shcSpacing.sm }]}
            testID={skipTestID}
            accessibilityRole="button"
            accessibilityLabel={skipLabel}
          >
            <Text style={styles.skipText}>{skipLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.body, contentStyle]}>
        <SHCOnboardingDots total={totalSteps} active={stepIndex} />
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children ? (
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.formSpacer} />
        )}
      </View>

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

        {onSecondary && secondaryLabel ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBF7' },
  hero: { width: '100%', backgroundColor: gourmeatColors.primaryLight || '#FFE8DE', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: 'rgba(255,251,247,0.55)',
  },
  heroBrand: {
    position: 'absolute',
    left: shcSpacing.md,
    paddingHorizontal: shcSpacing.sm,
    paddingVertical: 6,
    borderRadius: shcRadii.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  heroBrandText: { fontSize: 12, fontWeight: '800', color: gourmeatColors.primary || shcColors.primary },
  skipBtn: {
    position: 'absolute',
    right: shcSpacing.md,
    paddingHorizontal: shcSpacing.sm,
    paddingVertical: 6,
    borderRadius: shcRadii.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  skipText: { fontSize: 14, fontWeight: '700', color: shcColors.text },
  body: {
    flex: 1,
    paddingHorizontal: shcSpacing.lg,
    paddingTop: shcSpacing.lg,
    backgroundColor: '#FFFBF7',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: shcSpacing.md,
  },
  dot: { height: 8, borderRadius: 4 },
  dotInactive: { width: 8, backgroundColor: '#E8DDD4' },
  dotActive: { width: 24, backgroundColor: gourmeatColors.primary || shcColors.primary },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: shcColors.text,
    letterSpacing: -0.6,
    lineHeight: 34,
    marginBottom: shcSpacing.sm,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: shcColors.textLight,
    lineHeight: 24,
    marginBottom: shcSpacing.md,
  },
  formScroll: { flex: 1, marginTop: shcSpacing.xs },
  formScrollContent: { paddingBottom: shcSpacing.sm },
  formSpacer: { flex: 1 },
  footer: {
    paddingHorizontal: shcSpacing.lg,
    paddingTop: shcSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0E6DC',
    backgroundColor: '#FFFBF7',
    gap: 4,
  },
  cta: {
    backgroundColor: gourmeatColors.primary || shcColors.primary,
    borderRadius: shcRadii.lg,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: shcSpacing.lg,
  },
  ctaPressed: { opacity: 0.88 },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secondaryBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shcRadii.lg,
    borderWidth: 2,
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
