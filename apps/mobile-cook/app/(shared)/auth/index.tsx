import React, { useRef, useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { shcColors, shcSpacing, shcBorders, shcRadii } from '@shc/ui';
import { COOK_ONBOARDING_DEMO_OTP, validateShcPassword } from '@shc/utils';
import { useAuth } from '../../../hooks/useAuth';
import { hasSeenCookOnboarding } from '../../../lib/onboarding';
import { sendCookRegisterWhatsappOtp } from '../../../lib/api-client';

type RegisterStep = 'mobile' | 'verify';

export default function CookAuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('mobile');
  const [email, setEmail] = useState(__DEV__ ? 'rose@shc.local' : '');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState(__DEV__ ? 'cooksecret' : '');
  const [whatsappOtp, setWhatsappOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [busy, setBusy] = useState(false);

  const resetRegister = () => {
    setRegisterStep('mobile');
    setWhatsappOtp('');
    setOtpHint('');
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

  const sendWhatsappOtp = async () => {
    if (busy) return;
    const trimmedMobile = mobile.trim();
    if (!trimmedMobile || trimmedMobile.replace(/\D/g, '').length < 8) {
      Alert.alert('Missing mobile', 'Enter your Singapore WhatsApp number (e.g. 9123 4567).');
      return;
    }
    setBusy(true);
    try {
      const res = await sendCookRegisterWhatsappOtp(trimmedMobile);
      setOtpHint(res.hint || `Check WhatsApp for your code (demo: ${COOK_ONBOARDING_DEMO_OTP})`);
      setRegisterStep('verify');
    } catch (e) {
      Alert.alert('Could not send code', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

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

    if (registerStep === 'mobile') {
      await sendWhatsappOtp();
      return;
    }

    if (!whatsappOtp.trim() || !trimmedEmail || password.length < 6) {
      Alert.alert('Missing details', 'Enter the WhatsApp code, email, and password (6+ characters).');
      return;
    }
    const policy = validateShcPassword(password);
    if (!policy.ok) {
      Alert.alert('Weak password', policy.message);
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
            : registerStep === 'mobile'
              ? 'Create your home kitchen account — we verify your WhatsApp first.'
              : 'Enter the WhatsApp code, then your email and password.'}
        </Text>

        {(mode === 'login' || isRegisterVerify) && (
          <TextInput
            ref={emailRef}
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
        )}

        {mode === 'register' && (
          <TextInput
            value={mobile}
            onChangeText={setMobile}
            placeholder="WhatsApp mobile (e.g. 9123 4567)"
            placeholderTextColor={shcColors.textLight}
            keyboardType="phone-pad"
            style={[styles.input, isRegisterVerify && styles.inputReadonly]}
            testID="auth-mobile-input"
            editable={!isRegisterVerify}
            returnKeyType={registerStep === 'mobile' ? 'done' : 'next'}
            onSubmitEditing={() => {
              if (registerStep === 'mobile') void sendWhatsappOtp();
              else otpRef.current?.focus();
            }}
          />
        )}

        {isRegisterVerify ? (
          <>
            <TextInput
              ref={otpRef}
              value={whatsappOtp}
              onChangeText={setWhatsappOtp}
              placeholder="6-digit WhatsApp code"
              placeholderTextColor={shcColors.textLight}
              keyboardType="number-pad"
              style={styles.input}
              testID="auth-otp-input"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            {otpHint ? <Text style={styles.hint}>{otpHint}</Text> : null}
            <Pressable
              onPress={() => void sendWhatsappOtp()}
              disabled={busy}
              style={styles.resend}
              testID="auth-resend-otp-btn"
            >
              <Text style={styles.resendText}>Resend WhatsApp code</Text>
            </Pressable>
          </>
        ) : null}

        {(mode === 'login' || isRegisterVerify) && (
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'register' ? 'Password (8+ chars)' : 'Password'}
            placeholderTextColor={shcColors.textLight}
            secureTextEntry
            style={styles.input}
            testID="auth-password-input"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
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
                : registerStep === 'mobile'
                  ? 'Send WhatsApp code'
                  : 'Create account'}
          </Text>
        </Pressable>

        {isRegisterVerify ? (
          <Pressable onPress={resetRegister} style={styles.toggle} testID="auth-change-mobile-btn">
            <Text style={styles.toggleText}>Use a different mobile number</Text>
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
  hint: { fontSize: 13, color: shcColors.primary, fontWeight: '600', marginBottom: shcSpacing.sm },
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
