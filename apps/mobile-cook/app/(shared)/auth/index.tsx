import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { shcColors, shcSpacing, shcBorders, shcRadii } from '@shc/ui';
import { COOK_ONBOARDING_DEMO_OTP, validateShcPassword } from '@shc/utils';
import { useAuth } from '../../../hooks/useAuth';
import { hasSeenCookOnboarding } from '../../../lib/onboarding';
import {
  getCookRegisterWhatsappVerifyStatus,
  sendCookRegisterWhatsappOtp,
} from '../../../lib/api-client';

type RegisterStep = 'details' | 'verify';

export default function CookAuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('details');
  const [email, setEmail] = useState(__DEV__ ? 'rose@shc.local' : '');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState(__DEV__ ? 'cooksecret' : '');
  const [whatsappOtp, setWhatsappOtp] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [otpReady, setOtpReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const resetRegister = () => {
    setRegisterStep('details');
    setWhatsappOtp('');
    setWhatsappUrl('');
    setOtpHint('');
    setOtpReady(false);
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    resetRegister();
  };

  const afterAuth = async (isNewAccount: boolean) => {
    const maestroE2e = process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
    if (isNewAccount && !maestroE2e) {
      router.replace('/(shared)/onboarding');
      return;
    }
    const seenOnboarding = maestroE2e || (await hasSeenCookOnboarding());
    router.replace(seenOnboarding ? '/(cook)/dashboard' : '/(shared)/onboarding');
  };

  const prepareWhatsappVerify = async () => {
    const trimmedMobile = mobile.trim();
    const trimmedEmail = email.trim();
    if (!trimmedMobile || trimmedMobile.replace(/\D/g, '').length < 8) {
      Alert.alert('Missing mobile', 'Enter your Singapore WhatsApp number (e.g. 9123 4567).');
      return false;
    }
    if (!trimmedEmail || password.length < 6) {
      Alert.alert('Missing details', 'Enter your email and password (6+ characters).');
      return false;
    }
    const policy = validateShcPassword(password);
    if (!policy.ok) {
      Alert.alert('Weak password', policy.message);
      return false;
    }

    setBusy(true);
    try {
      const res = await sendCookRegisterWhatsappOtp(trimmedMobile);
      setWhatsappUrl(res.whatsapp_url || '');
      setOtpHint(
        res.hint ||
          (res.demo_code
            ? `Demo code: ${res.demo_code}`
            : 'Message us on WhatsApp — we will reply with your code.')
      );
      if (res.demo_code) {
        setWhatsappOtp(res.demo_code);
        setOtpReady(true);
      } else {
        setOtpReady(Boolean(res.otp_ready));
      }
      setRegisterStep('verify');
      return true;
    } catch (e) {
      Alert.alert('Could not start verification', (e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openWhatsAppVerify = async () => {
    if (!whatsappUrl) return;
    const can = await Linking.canOpenURL(whatsappUrl);
    if (!can) {
      Alert.alert('WhatsApp unavailable', 'Install WhatsApp or open the link manually.');
      return;
    }
    await Linking.openURL(whatsappUrl);
  };

  useEffect(() => {
    if (mode !== 'register' || registerStep !== 'verify' || otpReady) return;
    const trimmedMobile = mobile.trim();
    if (!trimmedMobile) return;

    const timer = setInterval(() => {
      void getCookRegisterWhatsappVerifyStatus(trimmedMobile)
        .then((res) => {
          if (res.otp_ready) setOtpReady(true);
        })
        .catch(() => null);
    }, 3000);

    return () => clearInterval(timer);
  }, [mode, registerStep, mobile, otpReady]);

  const submit = async () => {
    if (busy) return;
    const trimmedEmail = email.trim();
    const trimmedMobile = mobile.trim();

    if (mode === 'login') {
      if (!trimmedEmail || password.length < 6) {
        Alert.alert('Missing details', 'Enter a valid email and password (6+ characters).');
        return;
      }
      setBusy(true);
      try {
        await login(trimmedEmail, password);
        await afterAuth(false);
      } catch (e) {
        Alert.alert('Sign in failed', (e as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (registerStep === 'details') {
      await prepareWhatsappVerify();
      return;
    }

    if (!whatsappOtp.trim()) {
      Alert.alert('Missing code', 'Message us on WhatsApp first, then enter the code we reply with.');
      return;
    }
    setBusy(true);
    try {
      await register(trimmedEmail, password, trimmedMobile, whatsappOtp.trim());
      await afterAuth(true);
    } catch (e) {
      Alert.alert('Sign up failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const isRegisterVerify = mode === 'register' && registerStep === 'verify';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Text style={styles.title}>SHC Cook Portal</Text>
        <Text style={styles.subtitle}>
          {mode === 'login'
            ? 'Sign in to manage listings, orders, and earnings.'
            : registerStep === 'details'
              ? 'Create your account — we verify you on WhatsApp (free, no spam templates).'
              : 'Tap Message us to verify — WhatsApp opens with a ready-to-send message. We reply with your code.'}
        </Text>

        {mode === 'login' && (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={shcColors.textLight}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              testID="auth-email-input"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={shcColors.textLight}
              secureTextEntry
              style={styles.input}
              testID="auth-password-input"
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          </>
        )}

        {mode === 'register' && registerStep === 'details' && (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={shcColors.textLight}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              testID="auth-email-input"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="Password (8+ chars)"
              placeholderTextColor={shcColors.textLight}
              secureTextEntry
              style={styles.input}
              testID="auth-password-input"
              returnKeyType="next"
              onSubmitEditing={() => otpRef.current?.focus()}
            />
            <TextInput
              value={mobile}
              onChangeText={setMobile}
              placeholder="WhatsApp mobile (e.g. 9123 4567)"
              placeholderTextColor={shcColors.textLight}
              keyboardType="phone-pad"
              style={styles.input}
              testID="auth-mobile-input"
              returnKeyType="done"
              onSubmitEditing={() => void prepareWhatsappVerify()}
            />
          </>
        )}

        {isRegisterVerify && (
          <>
            <TextInput
              value={mobile}
              editable={false}
              style={[styles.input, styles.inputReadonly]}
              testID="auth-mobile-input"
            />
            <Pressable
              onPress={() => void openWhatsAppVerify()}
              style={styles.whatsappBtn}
              testID="auth-whatsapp-verify-btn"
            >
              <Text style={styles.whatsappBtnText}>Message us to verify</Text>
            </Pressable>
            <Text style={styles.whatsappHint}>
              Opens WhatsApp with a message ready to send. Hit send — we reply with your 6-digit code.
            </Text>
            <TextInput
              ref={otpRef}
              value={whatsappOtp}
              onChangeText={setWhatsappOtp}
              placeholder="6-digit code from WhatsApp"
              placeholderTextColor={shcColors.textLight}
              keyboardType="number-pad"
              style={styles.input}
              testID="auth-otp-input"
              returnKeyType="done"
              onSubmitEditing={submit}
            />
            {otpHint ? <Text style={styles.hint}>{otpHint}</Text> : null}
            {!otpReady ? (
              <Text style={styles.waiting}>Waiting for your WhatsApp message…</Text>
            ) : (
              <Text style={styles.hint}>Code received — enter it above.</Text>
            )}
            <Pressable
              onPress={() => void prepareWhatsappVerify()}
              disabled={busy}
              style={styles.resend}
              testID="auth-resend-otp-btn"
            >
              <Text style={styles.resendText}>Get a new verify link</Text>
            </Pressable>
          </>
        )}

        <Pressable
          onPress={submit}
          disabled={busy}
          style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
          testID="auth-submit-btn"
        >
          <Text style={styles.submitText}>
            {busy
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : registerStep === 'details'
                  ? 'Continue'
                  : 'Create account'}
          </Text>
        </Pressable>

        {isRegisterVerify ? (
          <Pressable onPress={resetRegister} style={styles.toggle} testID="auth-change-mobile-btn">
            <Text style={styles.toggleText}>Start over</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
          style={styles.toggle}
          testID="auth-mode-toggle"
        >
          <Text style={styles.toggleText}>
            {mode === 'login' ? 'New home cook? Create an account' : 'Have an account? Sign in'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBF7' },
  content: { padding: shcSpacing.lg, paddingTop: 64 },
  title: { fontSize: 28, fontWeight: '900', color: shcColors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: shcColors.textLight, marginBottom: shcSpacing.lg, lineHeight: 22 },
  input: {
    borderWidth: shcBorders.thin,
    borderColor: shcColors.border,
    borderRadius: shcRadii.lg,
    padding: shcSpacing.md,
    fontSize: 16,
    marginBottom: shcSpacing.sm,
    backgroundColor: '#FFFFFF',
    color: shcColors.text,
  },
  inputReadonly: { backgroundColor: '#F5F0EB', color: shcColors.textLight },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: shcRadii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: shcSpacing.sm,
    borderWidth: shcBorders.thin,
    borderColor: '#128C7E',
  },
  whatsappBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  whatsappHint: { fontSize: 13, color: shcColors.textLight, marginBottom: shcSpacing.sm, lineHeight: 18 },
  hint: { fontSize: 13, color: shcColors.primary, fontWeight: '600', marginBottom: shcSpacing.sm },
  waiting: { fontSize: 13, color: shcColors.textLight, marginBottom: shcSpacing.sm },
  resend: { alignSelf: 'flex-start', marginBottom: shcSpacing.sm },
  resendText: { color: shcColors.primary, fontWeight: '700', fontSize: 14 },
  submitBtn: {
    backgroundColor: shcColors.primary,
    borderRadius: shcRadii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: shcSpacing.md,
    borderWidth: shcBorders.thin,
    borderColor: shcColors.border,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: shcColors.onPrimary, fontWeight: '800', fontSize: 16 },
  toggle: { marginTop: shcSpacing.lg, alignItems: 'center' },
  toggleText: { color: shcColors.primary, fontWeight: '700', fontSize: 14 },
});
