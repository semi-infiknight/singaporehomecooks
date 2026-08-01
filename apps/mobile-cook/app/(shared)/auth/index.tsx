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
import { sendCookRegisterEmailOtp } from '../../../lib/api-client';

type RegisterStep = 'email' | 'verify';

export default function CookAuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('email');
  const [email, setEmail] = useState(__DEV__ ? 'rose@shc.local' : '');
  const [password, setPassword] = useState(__DEV__ ? 'cooksecret' : '');
  const [emailOtp, setEmailOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [busy, setBusy] = useState(false);

  const resetRegister = () => {
    setRegisterStep('email');
    setEmailOtp('');
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

  const sendEmailOtp = async () => {
    if (busy) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Missing email', 'Enter your email to receive a verification code.');
      return;
    }
    setBusy(true);
    try {
      const res = await sendCookRegisterEmailOtp(trimmedEmail);
      setOtpHint(res.hint || `Enter code ${COOK_ONBOARDING_DEMO_OTP}`);
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

    if (registerStep === 'email') {
      await sendEmailOtp();
      return;
    }

    if (!emailOtp.trim() || password.length < 6) {
      Alert.alert('Missing details', 'Enter the verification code and a password (6+ characters).');
      return;
    }
    const policy = validateShcPassword(password);
    if (!policy.ok) {
      Alert.alert('Weak password', policy.message);
      return;
    }
    setBusy(true);
    try {
      await register(trimmedEmail, password, emailOtp.trim());
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
            : registerStep === 'email'
              ? 'Create your home kitchen account — we’ll verify your email first.'
              : 'Enter the code we sent and choose a password.'}
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={shcColors.textLight}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, isRegisterVerify && styles.inputReadonly]}
          testID="auth-email-input"
          editable={!isRegisterVerify}
          returnKeyType={mode === 'login' ? 'next' : registerStep === 'email' ? 'done' : 'next'}
          onSubmitEditing={() => {
            if (mode === 'login') passwordRef.current?.focus();
            else if (registerStep === 'email') void sendEmailOtp();
            else otpRef.current?.focus();
          }}
        />

        {isRegisterVerify ? (
          <>
            <TextInput
              ref={otpRef}
              value={emailOtp}
              onChangeText={setEmailOtp}
              placeholder="6-digit verification code"
              placeholderTextColor={shcColors.textLight}
              keyboardType="number-pad"
              style={styles.input}
              testID="auth-otp-input"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            {otpHint ? <Text style={styles.hint}>{otpHint}</Text> : null}
            <Pressable
              onPress={() => void sendEmailOtp()}
              disabled={busy}
              style={styles.resend}
              testID="auth-resend-otp-btn"
            >
              <Text style={styles.resendText}>Resend code</Text>
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
                : registerStep === 'email'
                  ? 'Send verification code'
                  : 'Create account'}
          </Text>
        </Pressable>

        {isRegisterVerify ? (
          <Pressable onPress={resetRegister} style={styles.toggle} testID="auth-change-email-btn">
            <Text style={styles.toggleText}>Use a different email</Text>
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
