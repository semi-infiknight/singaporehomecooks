import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCOnboardingFlowScreen, shcColors, shcSpacing } from '@shc/ui';
import { BENTO_ACTION_IMAGES, PROMO_BANNER_IMAGES } from '@shc/utils';
import type { SHCIconKey } from '@shc/ui';

const TRUST_LAYERS: { iconKey: SHCIconKey; title: string; body: string; imageUri: string }[] = [
  {
    iconKey: 'compliance',
    title: 'Kitchen transparency',
    body: 'Cooks share dish demos and kitchen intros so you see the real HDB workspace before you order.',
    imageUri: BENTO_ACTION_IMAGES.compliance,
  },
  {
    iconKey: 'leaf',
    title: 'Tasting portions',
    body: 'New cooks offer S$3–5 tasting sizes — try once before committing to a full occasion order.',
    imageUri: PROMO_BANNER_IMAGES.newCook,
  },
  {
    iconKey: 'credits',
    title: 'Clear receipts',
    body: 'Itemised totals, platform fee, and cook earnings shown at every step. Corporate tax invoices supported.',
    imageUri: BENTO_ACTION_IMAGES.credits,
  },
  {
    iconKey: 'orders',
    title: 'Occasion guarantee',
    body: 'Orders over S$150: tiered platform-backed refund (up to 50%, capped at S$100) for verified quality issues.',
    imageUri: BENTO_ACTION_IMAGES.orders,
  },
  {
    iconKey: 'discover',
    title: 'Safe HDB collection',
    body: 'Exact block and unit released 2h before your slot. Collection-only — no delivery, no stranger at your door.',
    imageUri: PROMO_BANNER_IMAGES.family,
  },
];

const POLICY_STEP = {
  title: 'Allergens, refunds & privacy',
  subtitle: 'Plain-language policies — no fine print.',
  imageUri: BENTO_ACTION_IMAGES.listings,
  body: [
    'Every dish lists Tier 1 allergens. You acknowledge them before checkout.',
    '72+ hours before collection → full refund · 24–72h → 50% · Under 24h → no refund.',
    'PDPA consent at checkout. Cook addresses hidden until 2h before your slot.',
  ],
};

const FINAL_STEP = {
  title: 'Ready to discover?',
  subtitle: 'Heritage home cooks across Singapore — Hari Raya, CNY, birthdays, and everyday meals.',
  imageUri: PROMO_BANNER_IMAGES.hariRaya,
};

const TOTAL_STEPS = TRUST_LAYERS.length + 2;

export default function TrustAndSafetyScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const isPolicy = step === TRUST_LAYERS.length;
  const isFinal = step === TRUST_LAYERS.length + 1;

  const goNext = () => {
    if (isFinal) {
      router.replace('/(customer)');
      return;
    }
    setStep((s) => s + 1);
  };

  const skipToBrowse = () => router.replace('/(customer)');

  let imageUri = TRUST_LAYERS[step]?.imageUri ?? FINAL_STEP.imageUri;
  let title = TRUST_LAYERS[step]?.title ?? '';
  let subtitle = TRUST_LAYERS[step]?.body ?? '';

  if (isPolicy) {
    imageUri = POLICY_STEP.imageUri;
    title = POLICY_STEP.title;
    subtitle = POLICY_STEP.subtitle;
  } else if (isFinal) {
    imageUri = FINAL_STEP.imageUri;
    title = FINAL_STEP.title;
    subtitle = FINAL_STEP.subtitle;
  }

  return (
    <SHCOnboardingFlowScreen
      imageUri={imageUri}
      title={title}
      subtitle={subtitle}
      stepIndex={step}
      totalSteps={TOTAL_STEPS}
      onNext={goNext}
      onSkip={!isFinal ? skipToBrowse : undefined}
      nextLabel={isFinal ? 'Browse dishes' : 'Continue'}
      nextTestID={isFinal ? 'trust-browse-cta' : 'trust-onboarding-next-btn'}
      screenTestID="trust-safety-screen"
    >
      {isPolicy && (
        <View style={styles.policyList}>
          {POLICY_STEP.body.map((line) => (
            <Text key={line} style={styles.policyLine}>
              · {line}
            </Text>
          ))}
        </View>
      )}

      {isFinal && (
        <Pressable
          onPress={() => router.push('/(customer)/cook/auntie-rose-tampines' as any)}
          style={styles.secondaryCta}
        >
          <Text style={styles.secondaryCtaText}>Meet Auntie Rose (Katong heritage cook) →</Text>
        </Pressable>
      )}
    </SHCOnboardingFlowScreen>
  );
}

const styles = StyleSheet.create({
  policyList: { gap: shcSpacing.sm },
  policyLine: { fontSize: 15, color: shcColors.textLight, lineHeight: 22 },
  secondaryCta: { marginTop: shcSpacing.sm, paddingVertical: shcSpacing.sm },
  secondaryCtaText: { color: shcColors.primary, fontWeight: '700', fontSize: 15, textAlign: 'center' },
});