/**
 * Customer auth — WhatsApp mobile login, design parity with cook app.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  InputAccessoryView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { shcColors, shcSpacing, shcRadii } from '@shc/ui';
import { COOK_ONBOARDING_DEMO_OTP } from '@shc/utils';
import { useAuth } from '../../../hooks/useAuth';
import { markOnboardingSeen } from '../../../lib/onboarding';
import { safeAuthReturnTo } from '../../../lib/auth-return';
import {
  CUSTOMER_PHONE_AUTH_PASSWORD,
  customerPhoneSyntheticEmail,
  formatMobileInput,
  isDemoWhatsappOtp,
  isValidSgMobileInput,
} from '../../../lib/customer-phone-auth';
import {
  hasCompletedProfileOnboarding,
  linkGuestLocalDataToProfile,
  readCustomerDisplayName,
} from '../../../lib/link-guest-to-profile';

type AuthStep = 'phone' | 'verify';

const INPUT_ACCESSORY_ID = 'customer-auth-no-keyboard-accessory';

const HERO_FOODS = ['🍜', '🍛', '🥟', '🍲', '🍚', '🥘', '🍤', '🥮'] as const;

function HeroFoodDecor({ width }: { width: number }) {
  const positions = [
    { emoji: HERO_FOODS[0], top: 18, left: width * 0.08, size: 34, rotate: '-12deg' },
    { emoji: HERO_FOODS[1], top: 42, left: width * 0.62, size: 40, rotate: '8deg' },
    { emoji: HERO_FOODS[2], top: 88, left: width * 0.18, size: 28, rotate: '6deg' },
    { emoji: HERO_FOODS[3], top: 72, left: width * 0.78, size: 32, rotate: '-6deg' },
    { emoji: HERO_FOODS[4], top: 128, left: width * 0.48, size: 36, rotate: '4deg' },
    { emoji: HERO_FOODS[5], top: 150, left: width * 0.05, size: 30, rotate: '-8deg' },
    { emoji: HERO_FOODS[6], top: 156, left: width * 0.72, size: 26, rotate: '10deg' },
    { emoji: HERO_FOODS[7], top: 108, left: width * 0.34, size: 24, rotate: '-4deg' },
  ] as const;

  return (
    <>
      {positions.map((item) => (
        <Text
          key={`${item.emoji}-${item.left}`}
          style={{
            position: 'absolute',
            top: item.top,
            left: item.left,
            fontSize: item.size,
            opacity: 0.92,
            transform: [{ rotate: item.rotate }],
          }}
        >
          {item.emoji}
        </Text>
      ))}
    </>
  );
}

function HeroCurve({ width }: { width: number }) {
  return (
    <Svg
      width={width}
      height={36}
      viewBox={`0 0 ${width} 36`}
      preserveAspectRatio="none"
      style={styles.heroCurve}
    >
      <Path
        d={`M0,0 C${width * 0.25},36 ${width * 0.75},36 ${width},0 L${width},36 L0,36 Z`}
        fill="#FFFFFF"
      />
    </Svg>
  );
}

export default function CustomerAuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnTo = safeAuthReturnTo(params.returnTo);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const otpRef = useRef<TextInput>(null);

  const [step, setStep] = useState<AuthStep>('phone');
  const [mobile, setMobile] = useState('');
  const [whatsappOtp, setWhatsappOtp] = useState(__DEV__ ? COOK_ONBOARDING_DEMO_OTP : '');
  const [otpHint, setOtpHint] = useState(__DEV__ ? `Demo code: ${COOK_ONBOARDING_DEMO_OTP}` : '');
  const [busy, setBusy] = useState(false);

  const afterAuth = async (isNewAccount: boolean) => {
    await markOnboardingSeen();
    const linked = await linkGuestLocalDataToProfile(mobile.trim());
    const name = await readCustomerDisplayName();
    const profileDone = await hasCompletedProfileOnboarding();

    // Name + optional photo (+ area if none saved) only when needed.
    if (isNewAccount || linked.needsName || !name || !profileDone) {
      router.replace('/(shared)/onboarding' as any);
      return;
    }
    router.replace((returnTo || '/(customer)') as any);
  };

  const startWhatsappVerify = async () => {
    const trimmedMobile = mobile.trim();
    if (!isValidSgMobileInput(trimmedMobile)) {
      Alert.alert('Invalid number', 'Enter a valid Singapore mobile number (e.g. 9123 4567).');
      return false;
    }
    setBusy(true);
    try {
      // UI parity with cook: verify step. Demo OTP until customer WhatsApp channel is live.
      setOtpHint(`Demo code: ${COOK_ONBOARDING_DEMO_OTP}`);
      setWhatsappOtp(COOK_ONBOARDING_DEMO_OTP);
      setStep('verify');
      return true;
    } finally {
      setBusy(false);
    }
  };

  const completePhoneAuth = async () => {
    const trimmedMobile = mobile.trim();
    const otp = whatsappOtp.trim();
    if (!otp || otp.length < 4) {
      Alert.alert('Missing code', 'Enter the 6-digit code from WhatsApp.');
      return;
    }
    if (!isDemoWhatsappOtp(otp) && !__DEV__) {
      // Production WhatsApp channel — accept demo until wired; still require 6 digits.
      if (otp.length !== 6) {
        Alert.alert('Invalid code', 'Enter the 6-digit code.');
        return;
      }
    }

    const email = customerPhoneSyntheticEmail(trimmedMobile);
    setBusy(true);
    try {
      try {
        await login(email, CUSTOMER_PHONE_AUTH_PASSWORD);
        await afterAuth(false);
        return;
      } catch {
        /* new number — register */
      }
      await register(email, CUSTOMER_PHONE_AUTH_PASSWORD);
      await afterAuth(true);
    } catch (e) {
      Alert.alert('Verification failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const resetPhoneStep = () => {
    setStep('phone');
    setWhatsappOtp(__DEV__ ? COOK_ONBOARDING_DEMO_OTP : '');
    setOtpHint(__DEV__ ? `Demo code: ${COOK_ONBOARDING_DEMO_OTP}` : '');
  };

  const submit = async () => {
    if (busy) return;
    Keyboard.dismiss();
    if (step === 'phone') {
      await startWhatsappVerify();
      return;
    }
    await completePhoneAuth();
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View style={styles.hiddenAccessory} />
        </InputAccessoryView>
      ) : null}
      <StatusBar style="light" />

      <View style={[styles.hero, { paddingTop: insets.top + shcSpacing.sm }]}>
        <HeroFoodDecor width={width} />
        <Text style={styles.logo}>home cooks</Text>
        <HeroCurve width={width} />
      </View>

      <View style={styles.body}>
        {step === 'phone' ? (
          <>
            <Text style={styles.headline}>Singapore&apos;s home cooking marketplace</Text>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Log in or sign up</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.phoneInputBox}>
              <Text style={styles.flagInline}>🇸🇬</Text>
              <Text style={styles.dialCode}>+65</Text>
              <TextInput
                value={mobile}
                onChangeText={(v) => setMobile(formatMobileInput(v))}
                placeholder="Enter Mobile Number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={styles.phoneInput}
                testID="auth-mobile-input"
                inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
                autoFocus
              />
            </View>

            <Pressable
              onPress={submit}
              disabled={busy}
              style={[styles.continueBtn, busy && styles.continueBtnDisabled]}
              testID="auth-submit-btn"
            >
              <Text style={styles.continueText}>{busy ? 'Please wait…' : 'Continue'}</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                await markOnboardingSeen();
                router.replace('/(customer)' as any);
              }}
              style={styles.browseLink}
              testID="auth-browse-guest-btn"
            >
              <Text style={styles.browseLinkText}>Browse without signing in</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={resetPhoneStep} style={styles.backRow} testID="auth-change-mobile-btn">
              <Ionicons name="arrow-back" size={20} color={shcColors.text} />
              <Text style={styles.backText}>Change number</Text>
            </Pressable>

            <Text style={styles.headline}>Verify on WhatsApp</Text>
            <Text style={styles.verifySubtitle}>
              Enter the 6-digit code we sent to +65 {mobile.trim() || 'your number'}
            </Text>

            <TextInput
              ref={otpRef}
              value={whatsappOtp}
              onChangeText={setWhatsappOtp}
              placeholder="6-digit code"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.otpInput}
              testID="auth-otp-input"
              inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
              autoFocus
            />

            {otpHint ? <Text style={styles.hint}>{otpHint}</Text> : null}

            <Pressable
              onPress={submit}
              disabled={busy}
              style={[styles.continueBtn, busy && styles.continueBtnDisabled]}
              testID="auth-submit-btn"
            >
              <Text style={styles.continueText}>{busy ? 'Please wait…' : 'Continue'}</Text>
            </Pressable>
          </>
        )}

        <Text style={styles.legal}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: {
    backgroundColor: shcColors.primary,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    textTransform: 'lowercase',
    zIndex: 2,
    marginTop: shcSpacing.lg,
  },
  body: {
    flex: 1,
    paddingHorizontal: shcSpacing.lg,
    paddingTop: shcSpacing.md,
    paddingBottom: shcSpacing.lg,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: shcColors.text,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: shcSpacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: shcSpacing.sm,
    marginBottom: shcSpacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: shcColors.textLight,
  },
  phoneInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: shcRadii.lg,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: shcSpacing.lg,
  },
  flagInline: { fontSize: 18, marginRight: 8 },
  dialCode: {
    fontSize: 16,
    fontWeight: '700',
    color: shcColors.text,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: shcColors.text,
    paddingVertical: 14,
  },
  continueBtn: {
    backgroundColor: shcColors.primary,
    borderRadius: shcRadii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: shcSpacing.sm,
  },
  continueBtnDisabled: { opacity: 0.65 },
  continueText: { color: '#FFFFFF', fontWeight: '800', fontSize: 17 },
  browseLink: { marginTop: shcSpacing.lg, paddingVertical: shcSpacing.sm },
  browseLinkText: {
    textAlign: 'center',
    color: shcColors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  legal: {
    marginTop: 'auto',
    paddingTop: shcSpacing.lg,
    fontSize: 12,
    lineHeight: 18,
    color: shcColors.textLight,
    textAlign: 'center',
  },
  legalLink: {
    color: shcColors.text,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: shcSpacing.md,
  },
  backText: { fontSize: 15, fontWeight: '700', color: shcColors.text },
  verifySubtitle: {
    fontSize: 15,
    color: shcColors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: shcSpacing.lg,
    marginTop: -8,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: shcRadii.lg,
    paddingHorizontal: shcSpacing.md,
    paddingVertical: 16,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    color: shcColors.text,
    marginBottom: shcSpacing.sm,
  },
  hint: {
    fontSize: 13,
    color: shcColors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: shcSpacing.sm,
  },
  hiddenAccessory: {
    height: 0,
    opacity: 0,
  },
});
