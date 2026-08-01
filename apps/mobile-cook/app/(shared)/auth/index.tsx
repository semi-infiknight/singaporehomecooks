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
import { validateShcPassword } from '@shc/utils';
import { useAuth } from '../../../hooks/useAuth';
import { hasSeenCookOnboarding } from '../../../lib/onboarding';

export default function CookAuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(__DEV__ ? 'rose@shc.local' : '');
  const [password, setPassword] = useState(__DEV__ ? 'cooksecret' : '');
  const [busy, setBusy] = useState(false);

  const afterAuth = async (isNewAccount: boolean) => {
    const maestroE2e = process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
    if (isNewAccount && !maestroE2e) {
      router.replace('/(shared)/onboarding');
      return;
    }
    const seenOnboarding = maestroE2e || (await hasSeenCookOnboarding());
    router.replace(seenOnboarding ? '/(cook)/dashboard' : '/(shared)/onboarding');
  };

  const submit = async () => {
    if (busy) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      Alert.alert('Missing details', 'Enter a valid email and password (6+ characters).');
      return;
    }
    if (mode === 'register') {
      const policy = validateShcPassword(password);
      if (!policy.ok) {
        Alert.alert('Weak password', policy.message);
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(trimmedEmail, password);
        await afterAuth(false);
      } else {
        await register(trimmedEmail, password);
        await afterAuth(true);
      }
    } catch (e) {
      Alert.alert(mode === 'login' ? 'Sign in failed' : 'Sign up failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

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
            : 'Create your home kitchen account — we’ll guide you through setup step by step.'}
        </Text>

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
          placeholder={mode === 'register' ? 'Password (8+ chars)' : 'Password'}
          placeholderTextColor={shcColors.textLight}
          secureTextEntry
          style={styles.input}
          testID="auth-password-input"
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        <Pressable
          onPress={submit}
          disabled={busy}
          style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
          testID="auth-submit-btn"
        >
          <Text style={styles.submitText}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
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
