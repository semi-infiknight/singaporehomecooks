import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCOnboardingFlowScreen, shcColors, shcSpacing, shcBorders, shcRadii } from '@shc/ui';
import { BENTO_ACTION_IMAGES, PROMO_BANNER_IMAGES } from '@shc/utils';
import { markCookOnboardingSeen } from '../../../lib/onboarding';
import { updateCookProfile } from '../../../lib/api-client';

const STEPS = ['welcome', 'story', 'kitchen', 'consent'] as const;
type Step = (typeof STEPS)[number];

const STEP_META: Record<
  Step,
  { imageUri: string; title: string; subtitle: string; nextLabel: string; skippable?: boolean }
> = {
  welcome: {
    imageUri: BENTO_ACTION_IMAGES.listings,
    title: 'Welcome, home cook',
    subtitle: 'List heritage dishes from your HDB kitchen — customers discover you on web and mobile.',
    nextLabel: 'Get started',
  },
  story: {
    imageUri: PROMO_BANNER_IMAGES.family,
    title: 'Your heritage story',
    subtitle: 'Tell customers what makes your kitchen special. This appears on your cook profile.',
    nextLabel: 'Continue',
    skippable: true,
  },
  kitchen: {
    imageUri: BENTO_ACTION_IMAGES.compliance,
    title: 'Collection instructions',
    subtitle: 'How should customers collect from your block? Shared after you accept an order.',
    nextLabel: 'Continue',
    skippable: true,
  },
  consent: {
    imageUri: BENTO_ACTION_IMAGES.orders,
    title: 'Safety & PDPA',
    subtitle: 'Home kitchens must disclose allergens on each dish. Ops may review compliance before featured placement.',
    nextLabel: 'Go to dashboard',
  },
};

export default function CookOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [story, setStory] = useState('');
  const [collectionInstructions, setCollectionInstructions] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const meta = STEP_META[step];
  const isLast = step === 'consent';

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const finish = async () => {
    if (!pdpaConsent) {
      Alert.alert('Consent required', 'Please acknowledge PDPA and kitchen safety before continuing.');
      return;
    }
    setBusy(true);
    try {
      await updateCookProfile({
        story: story.trim() || undefined,
        collection_instructions: collectionInstructions.trim() || undefined,
        pdpa_consent: true,
      });
      await markCookOnboardingSeen();
      router.replace('/(cook)/dashboard');
    } catch (e) {
      Alert.alert('Could not save profile', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handlePrimary = () => {
    if (isLast) void finish();
    else goNext();
  };

  return (
    <SHCOnboardingFlowScreen
      imageUri={meta.imageUri}
      title={meta.title}
      subtitle={meta.subtitle}
      stepIndex={stepIndex}
      totalSteps={STEPS.length}
      onNext={handlePrimary}
      onSkip={meta.skippable ? goNext : undefined}
      nextLabel={isLast ? (busy ? 'Saving…' : meta.nextLabel) : meta.nextLabel}
      nextTestID={isLast ? 'cook-onboarding-finish-btn' : 'cook-onboarding-next-btn'}
      disabled={isLast && (!pdpaConsent || busy)}
      loading={busy}
      screenTestID="cook-onboarding-screen"
    >
      {step === 'story' && (
        <TextInput
          value={story}
          onChangeText={setStory}
          placeholder="e.g. Peranakan recipes from my mother’s kitchen in Katong…"
          placeholderTextColor={shcColors.textLight}
          multiline
          style={styles.input}
          testID="cook-onboarding-story-input"
        />
      )}

      {step === 'kitchen' && (
        <TextInput
          value={collectionInstructions}
          onChangeText={setCollectionInstructions}
          placeholder="e.g. Block 123, lift lobby B — WhatsApp when you arrive"
          placeholderTextColor={shcColors.textLight}
          multiline
          style={styles.input}
          testID="cook-onboarding-collection-input"
        />
      )}

      {step === 'consent' && (
        <Pressable
          onPress={() => setPdpaConsent((v) => !v)}
          style={styles.consentRow}
          testID="cook-onboarding-pdpa-checkbox"
        >
          <View style={[styles.checkbox, pdpaConsent && styles.checkboxOn]}>
            {pdpaConsent ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.consentLabel}>
            I agree to PDPA data handling and accurate allergen disclosure on every listing.
          </Text>
        </Pressable>
      )}
    </SHCOnboardingFlowScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: shcRadii.lg,
    padding: shcSpacing.md,
    minHeight: 120,
    backgroundColor: '#FAFAFA',
    color: shcColors.text,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: shcSpacing.sm, marginTop: shcSpacing.xs },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: shcBorders.thin,
    borderColor: shcColors.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxOn: { backgroundColor: shcColors.primary, borderColor: shcColors.primary },
  checkMark: { color: shcColors.onPrimary, fontWeight: '800', fontSize: 14 },
  consentLabel: { flex: 1, fontSize: 15, color: shcColors.text, lineHeight: 22 },
});