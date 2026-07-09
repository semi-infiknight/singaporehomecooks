/**
 * Customer onboarding — HomelyEats-style friendly guide.
 * Warm home-food heroes, short value props, guest explore + sign-in.
 * Ref: blueprint/references/homelyeats-case-study/CASE_STUDY.md §6.1 + images/16.png
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCOnboardingFlowScreen, shcColors, shcSpacing } from '@shc/ui';
import { BENTO_ACTION_IMAGES, PROMO_BANNER_IMAGES } from '@shc/utils';
import { markOnboardingSeen } from '../../../lib/onboarding';

type Step = {
  imageUri: string;
  title: string;
  subtitle: string;
  bullets?: string[];
};

/** Warm home-kitchen carousel (SG heritage, not a separate product). */
const STEPS: Step[] = [
  {
    imageUri: PROMO_BANNER_IMAGES.family,
    title: 'Welcome home',
    subtitle:
      'Singapore Home Cooks brings auntie-and-uncle kitchens to your collection point — heritage recipes, HDB warmth, no stranger delivery.',
    bullets: ['Real home cooks, real stories', 'Occasion spreads & everyday meals', 'Collection from HDB kitchens'],
  },
  {
    imageUri: PROMO_BANNER_IMAGES.hariRaya,
    title: 'Tiffin & occasions',
    subtitle:
      'Subscribe to weekly tiffin from one kitchen, or order one-off dishes for Hari Raya, CNY, birthdays and more.',
    bullets: ['2 · 3 · 4 meals a week', 'One kitchen you trust', 'Plan ahead for big occasions'],
  },
  {
    imageUri: BENTO_ACTION_IMAGES.compliance,
    title: 'Cooked with care',
    subtitle: 'See the kitchen story, allergens, and clear receipts before you pay — trust you can feel.',
    bullets: ['Kitchen transparency', 'Tier 1 allergen acks', 'Safe HDB collection slots'],
  },
  {
    imageUri: PROMO_BANNER_IMAGES.newCook,
    title: 'Browse freely',
    subtitle:
      'Explore kitchens and dishes as a guest. Sign in when you’re ready to subscribe or checkout — no pressure.',
    bullets: ['Continue as guest anytime', 'Sign in to subscribe & order', 'Your pace, your table'],
  },
];

export default function CustomerOnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const exploreGuest = async () => {
    await markOnboardingSeen();
    router.replace('/(customer)' as any);
  };
  const goAuth = async () => {
    await markOnboardingSeen();
    router.push('/(shared)/auth' as any);
  };

  const goNext = () => {
    if (isLast) {
      void goAuth();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <SHCOnboardingFlowScreen
      imageUri={current.imageUri}
      title={current.title}
      subtitle={current.subtitle}
      stepIndex={step}
      totalSteps={STEPS.length}
      onNext={goNext}
      onSkip={!isLast ? exploreGuest : undefined}
      skipLabel="Explore as guest"
      onGuest={isLast ? exploreGuest : undefined}
      guestLabel="Continue as guest"
      nextLabel={isLast ? 'Sign in / Create account' : 'Continue'}
      nextTestID={isLast ? 'onboarding-signin-cta' : 'trust-onboarding-next-btn'}
      guestTestID="onboarding-guest-btn"
      skipTestID="onboarding-skip-btn"
      secondaryLabel={isLast ? 'Browse dishes first' : undefined}
      onSecondary={isLast ? exploreGuest : undefined}
      secondaryTestID="trust-browse-cta"
      screenTestID="trust-safety-screen"
    >
      {current.bullets ? (
        <View style={styles.bullets} testID="onboarding-value-bullets">
          {current.bullets.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <View style={styles.bulletDotWrap}>
                <Text style={styles.bulletDot}>✓</Text>
              </View>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </SHCOnboardingFlowScreen>
  );
}

const styles = StyleSheet.create({
  bullets: { gap: shcSpacing.sm, marginTop: shcSpacing.xs },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDotWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFE8DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletDot: { fontSize: 12, fontWeight: '800', color: shcColors.primary },
  bulletText: { flex: 1, fontSize: 15, fontWeight: '600', color: shcColors.text, lineHeight: 22 },
});
