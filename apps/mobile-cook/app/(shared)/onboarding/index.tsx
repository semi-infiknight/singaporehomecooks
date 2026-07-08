import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SHCCard, SHCButton, SHCButtonText, shcColors, shcSpacing, shcBorders, shcRadii } from '@shc/ui';
import { markCookOnboardingSeen } from '../../../lib/onboarding';
import { updateCookProfile } from '../../../lib/api-client';

const STEPS = ['welcome', 'story', 'kitchen', 'consent'] as const;
type Step = (typeof STEPS)[number];

export default function CookOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('welcome');
  const [story, setStory] = useState('');
  const [collectionInstructions, setCollectionInstructions] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const stepIndex = STEPS.indexOf(step);

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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + shcSpacing.md,
        paddingHorizontal: shcSpacing.md,
        paddingBottom: insets.bottom + 32,
      }}
      testID="cook-onboarding-screen"
    >
      <Text style={styles.progress}>
        Step {stepIndex + 1} of {STEPS.length}
      </Text>

      {step === 'welcome' && (
        <SHCCard style={styles.card}>
          <Text style={styles.title}>Welcome, home cook</Text>
          <Text style={styles.body}>
            List dishes on Singapore Home Cooks — customers discover your menu on the customer app and web PWA.
            Orders you accept here sync through Medusa to your kitchen dashboard.
          </Text>
          <SHCButton onPress={goNext} testID="cook-onboarding-next-btn">
            <SHCButtonText>Get started</SHCButtonText>
          </SHCButton>
        </SHCCard>
      )}

      {step === 'story' && (
        <SHCCard style={styles.card}>
          <Text style={styles.title}>Your heritage story</Text>
          <Text style={styles.body}>Tell customers what makes your HDB kitchen special — this appears on your cook profile.</Text>
          <TextInput
            value={story}
            onChangeText={setStory}
            placeholder="e.g. Peranakan recipes from my mother’s kitchen in Katong…"
            placeholderTextColor={shcColors.textLight}
            multiline
            style={styles.input}
            testID="cook-onboarding-story-input"
          />
          <SHCButton onPress={goNext} testID="cook-onboarding-next-btn">
            <SHCButtonText>Continue</SHCButtonText>
          </SHCButton>
        </SHCCard>
      )}

      {step === 'kitchen' && (
        <SHCCard style={styles.card}>
          <Text style={styles.title}>Collection instructions</Text>
          <Text style={styles.body}>
            How should customers collect from your block? Shared after you accept an order.
          </Text>
          <TextInput
            value={collectionInstructions}
            onChangeText={setCollectionInstructions}
            placeholder="e.g. Block 123, lift lobby B — WhatsApp when you arrive"
            placeholderTextColor={shcColors.textLight}
            multiline
            style={styles.input}
            testID="cook-onboarding-collection-input"
          />
          <SHCButton onPress={goNext} testID="cook-onboarding-next-btn">
            <SHCButtonText>Continue</SHCButtonText>
          </SHCButton>
        </SHCCard>
      )}

      {step === 'consent' && (
        <SHCCard style={styles.card}>
          <Text style={styles.title}>Safety & PDPA</Text>
          <Text style={styles.body}>
            Home kitchens must disclose allergens on each dish. Ops may review SFA/WSQ uploads before featured placement.
          </Text>
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
          <SHCButton onPress={finish} disabled={busy} testID="cook-onboarding-finish-btn">
            <SHCButtonText>{busy ? 'Saving…' : 'Go to dashboard'}</SHCButtonText>
          </SHCButton>
        </SHCCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: shcColors.background },
  progress: { fontSize: 12, color: shcColors.textLight, marginBottom: shcSpacing.sm },
  card: { padding: shcSpacing.lg, gap: shcSpacing.md },
  title: { fontSize: 22, fontWeight: '800', color: shcColors.text },
  body: { fontSize: 14, color: shcColors.textLight, lineHeight: 20 },
  input: {
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    padding: shcSpacing.md,
    minHeight: 88,
    backgroundColor: shcColors.surface,
    color: shcColors.text,
    textAlignVertical: 'top',
  },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: shcSpacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: shcColors.primary },
  checkMark: { color: shcColors.onPrimary, fontWeight: '800', fontSize: 14 },
  consentLabel: { flex: 1, fontSize: 13, color: shcColors.text, lineHeight: 18 },
});