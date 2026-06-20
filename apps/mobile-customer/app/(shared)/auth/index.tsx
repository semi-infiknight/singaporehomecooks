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
import { shcColors, shcSpacing, shcBorders, shcRadii, shcShadows } from '@shc/ui';
import { useAuth } from '../../../hooks/useAuth';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('customer@shc.local');
  const [password, setPassword] = useState('customersecret');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
      router.replace('/(customer)');
    } catch (e) {
      Alert.alert('Sign in failed', (e as Error).message);
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
        <Text style={styles.title}>Singapore Home Cooks</Text>
        <Text style={styles.subtitle}>Sign in to checkout and track orders — or browse dishes first.</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="Email"
          placeholderTextColor={shcColors.textLight}
          style={styles.input}
          testID="auth-email-input"
        />
        <TextInput
          ref={passwordRef}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          placeholder="Password"
          placeholderTextColor={shcColors.textLight}
          style={styles.input}
          testID="auth-password-input"
        />

        <Pressable
          onPress={submit}
          disabled={busy}
          style={({ pressed }) => [styles.submitBtn, pressed && !busy && styles.submitBtnPressed, busy && styles.submitBtnDisabled]}
          testID="auth-submit-btn"
          accessibilityRole="button"
        >
          <Text style={styles.submitBtnText}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Text>
        </Pressable>

        <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={styles.modeToggle} testID="auth-mode-toggle">
          <Text style={styles.modeToggleText}>
            {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(customer)' as any)}
          style={styles.browseBtn}
          testID="auth-browse-guest-btn"
          accessibilityRole="button"
        >
          <Text style={styles.browseBtnText}>Browse without signing in</Text>
        </Pressable>

        <Text style={styles.demoHint}>Demo: customer@shc.local / customersecret (after bootstrap)</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: shcColors.background },
  content: { flexGrow: 1, padding: shcSpacing.lg, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: shcSpacing.sm, color: shcColors.text },
  subtitle: { fontSize: 14, color: shcColors.textLight, marginBottom: shcSpacing.lg },
  input: {
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.md,
    backgroundColor: shcColors.surface,
    fontSize: 16,
    color: shcColors.text,
  },
  submitBtn: {
    alignSelf: 'stretch',
    marginTop: shcSpacing.xs,
    backgroundColor: shcColors.primary,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    paddingVertical: shcSpacing.md,
    paddingHorizontal: shcSpacing.lg,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...shcShadows.brutalSm,
  },
  submitBtnPressed: { ...shcShadows.brutalPressed, transform: [{ scale: 0.98 }] },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: shcColors.onPrimary, fontWeight: '800', fontSize: 16 },
  modeToggle: { marginTop: shcSpacing.md, paddingVertical: shcSpacing.sm },
  modeToggleText: { textAlign: 'center', color: shcColors.primary, fontWeight: '700', fontSize: 15 },
  browseBtn: {
    marginTop: shcSpacing.sm,
    paddingVertical: shcSpacing.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    backgroundColor: shcColors.bentoYellow,
    alignItems: 'center',
    ...shcShadows.brutalSm,
  },
  browseBtnText: { color: shcColors.text, fontWeight: '800', fontSize: 15 },
  demoHint: { textAlign: 'center', marginTop: shcSpacing.lg, fontSize: 11, color: shcColors.textLight },
});