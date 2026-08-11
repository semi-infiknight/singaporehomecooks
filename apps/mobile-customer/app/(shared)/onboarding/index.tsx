/**
 * Customer post-login profile setup — shared onboarding shell (cream + progress + peach CTA).
 * Name (required) → optional pickup photo → area only if none saved.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  SHCOnboardingFlowScreen,
  shcColors,
  shcSpacing,
  shcRadii,
  gourmeatColors,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES, PROMO_BANNER_IMAGES } from '@shc/utils';
import { markOnboardingSeen } from '../../../lib/onboarding';
import {
  hasCompletedProfileOnboarding,
  markProfileOnboardingDone,
  readCustomerDisplayName,
  saveCustomerDisplayName,
  saveCustomerPickupPhoto,
  readCustomerPickupPhoto,
} from '../../../lib/link-guest-to-profile';
import { useCustomerLocation } from '../../../hooks/useCustomerLocation';

type Step = 'name' | 'photo' | 'address';

const STEP_ORDER: Step[] = ['name', 'photo', 'address'];

const STEP_META: Record<
  Step,
  { title: string; subtitle: string; chapter: string; next: string; imageUri: string }
> = {
  name: {
    chapter: 'Profile',
    title: 'What should we call you?',
    subtitle: "We'll use this on your orders. Guest details on this phone are already linked.",
    next: 'Continue',
    imageUri: PROMO_BANNER_IMAGES.family,
  },
  photo: {
    chapter: 'Pickup',
    title: 'Add a pickup photo',
    subtitle: 'Optional — a photo helps cooks recognise you at collection.',
    next: 'Continue',
    imageUri: BENTO_ACTION_IMAGES.listings,
  },
  address: {
    chapter: 'Near you',
    title: 'Set your area',
    subtitle: 'So we can show kitchens nearby. You can change this anytime.',
    next: 'Choose area',
    imageUri: PROMO_BANNER_IMAGES.paynow,
  },
};

export default function CustomerProfileOnboardingScreen() {
  const router = useRouter();
  const { saved, ready: locationReady } = useCustomerLocation();

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await readCustomerDisplayName();
      const photo = await readCustomerPickupPhoto();
      if (cancelled) return;
      if (existing) setName(existing);
      if (photo) setPhotoUri(photo);
      setBooting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stepIndex = STEP_ORDER.indexOf(step);
  const meta = STEP_META[step];
  /** Address step only when no saved areas — dots still count name + photo as 1–2 of 2 or 3. */
  const totalSteps = useMemo(() => {
    if (!locationReady) return 2;
    if (saved.length > 0 && step !== 'address') return 2;
    return 3;
  }, [locationReady, saved.length, step]);

  const finish = async () => {
    await markOnboardingSeen();
    await markProfileOnboardingDone();
    router.replace('/(customer)' as any);
  };

  const onNameContinue = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert('Your name', 'Enter the name we should use for your orders.');
      return;
    }
    setBusy(true);
    try {
      await saveCustomerDisplayName(trimmed);
      setStep('photo');
    } finally {
      setBusy(false);
    }
  };

  const pickPhoto = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photo access', 'Allow photo library access to add a pickup photo.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;
      const uri = res.assets[0].uri;
      setPhotoUri(uri);
      await saveCustomerPickupPhoto(uri);
    } catch {
      Alert.alert('Photo unavailable', 'You can add a photo later from Profile.');
    }
  };

  const afterPhoto = async () => {
    if (!locationReady) {
      await finish();
      return;
    }
    if (saved.length === 0) {
      setStep('address');
      return;
    }
    await finish();
  };

  const onNext = async () => {
    if (step === 'name') {
      await onNameContinue();
      return;
    }
    if (step === 'photo') {
      await afterPhoto();
      return;
    }
    router.push('/(customer)/location' as any);
  };

  const onBack = () => {
    if (step === 'photo') setStep('name');
    else if (step === 'address') setStep('photo');
  };

  if (booting) {
    return (
      <View style={[styles.boot, styles.center]} testID="trust-safety-screen">
        <ActivityIndicator color={gourmeatColors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <SHCOnboardingFlowScreen
        screenTestID="trust-safety-screen"
        imageUri={meta.imageUri}
        showHero={false}
        title={meta.title}
        subtitle={meta.subtitle}
        stepIndex={Math.min(stepIndex, totalSteps - 1)}
        totalSteps={totalSteps}
        chapterLabel={meta.chapter}
        nextLabel={
          step === 'photo' && !photoUri ? 'Skip for now' : step === 'address' ? 'Choose area' : meta.next
        }
        nextTestID={
          step === 'name'
            ? 'onboarding-signin-cta'
            : step === 'photo'
              ? 'trust-onboarding-next-btn'
              : 'customer-onboarding-address'
        }
        onNext={() => void onNext()}
        onBack={step === 'name' ? undefined : onBack}
        onSkip={step === 'address' ? () => void finish() : undefined}
        skipLabel="Skip for now"
        skipTestID="onboarding-guest-btn"
        disabled={busy}
        loading={busy}
      >
        {step === 'name' ? (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={shcColors.textLight}
            style={styles.input}
            testID="customer-onboarding-name"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => void onNameContinue()}
          />
        ) : null}

        {step === 'photo' ? (
          <Pressable onPress={() => void pickPhoto()} style={styles.photoBox} testID="customer-onboarding-photo">
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <Text style={styles.photoPlaceholder}>Tap to add photo</Text>
            )}
          </Pressable>
        ) : null}

        {step === 'address' ? (
          <View style={styles.addressHintCard}>
            <Text style={styles.addressHintText}>
              Your area only sorts nearby kitchens. Exact kitchen pickup is set by the cook.
            </Text>
          </View>
        ) : null}
      </SHCOnboardingFlowScreen>
    </>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: '#FFFBF7' },
  center: { alignItems: 'center', justifyContent: 'center' },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.12)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: '600',
    color: shcColors.text,
    backgroundColor: '#FFF',
    marginTop: shcSpacing.md,
  },
  photoBox: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignSelf: 'center',
    backgroundColor: '#FFE8DE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: shcSpacing.lg,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    fontSize: 14,
    fontWeight: '700',
    color: gourmeatColors.primary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  addressHintCard: {
    marginTop: shcSpacing.lg,
    padding: shcSpacing.md,
    borderRadius: shcRadii.lg,
    backgroundColor: '#FFE8DE',
  },
  addressHintText: {
    fontSize: 14,
    fontWeight: '600',
    color: shcColors.text,
    lineHeight: 20,
  },
});
