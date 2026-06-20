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
import { hasSeenCookOnboarding } from '../../../lib/onboarding';

export default function CookAuthScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('rose@shc.local');
  const [password, setPassword] = useState('cooksecret');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
      const seenOnboarding = await hasSeenCookOnboarding();
      router.replace(seenOnboarding ? '/(cook)/dashboard' : '/(shared)/onboarding');
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
        <Text style={styles.title}>SHC Cook Portal</Text>
        <Text style={styles.subtitle}>Sign in to manage listings, orders, and earnings.</Text>

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
          placeholder="Cook email"
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
          <Text style={styles.submitBtnText}>{busy ? 'Please wait…' : 'Sign in as cook'}</Text>
        </Pressable>

        <Text style={styles.demoHint}>Demo: rose@shc.local / cooksecret</Text>
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
  demoHint: { textAlign: 'center', marginTop: shcSpacing.lg, fontSize: 11, color: shcColors.textLight },
});