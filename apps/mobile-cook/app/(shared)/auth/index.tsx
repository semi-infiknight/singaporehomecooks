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
import { validateShcPassword } from '@shc/utils';
import { useAuth } from '../../../hooks/useAuth';
import { hasSeenCookOnboarding, clearCookOnboardingSeen } from '../../../lib/onboarding';

export default function CookAuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const displayNameRef = useRef<TextInput>(null);
  const areaRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(__DEV__ ? 'rose@shc.local' : '');
  const [password, setPassword] = useState(__DEV__ ? 'cooksecret' : '');
  const [displayName, setDisplayName] = useState('');
  const [area, setArea] = useState('');
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
    if (mode === 'register' && (!displayName.trim() || !area.trim())) {
      Alert.alert('Missing details', 'Add your kitchen name and HDB area for customers to find you.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(trimmedEmail, password);
        await afterAuth(false);
      } else {
        await register(trimmedEmail, password, displayName.trim(), area.trim());
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
            : 'Create your home kitchen account — list dishes customers can book.'}
        </Text>

        {mode === 'register' && (
          <>
            <TextInput
              ref={displayNameRef}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Kitchen / display name (e.g. Auntie Mei)"
              placeholderTextColor={shcColors.textLight}
              style={styles.input}
              testID="auth-display-name-input"
              returnKeyType="next"
              onSubmitEditing={() => areaRef.current?.focus()}
            />
            <TextInput
              ref={areaRef}
              value={area}
              onChangeText={setArea}
              placeholder="HDB area (e.g. Tampines, Bedok)"
              placeholderTextColor={shcColors.textLight}
              style={styles.input}
              testID="auth-area-input"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </>
        )}

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
          autoComplete="off"
          autoCorrect={false}
          textContentType={mode === 'register' ? 'none' : 'password'}
          returnKeyType="go"
          onSubmitEditing={submit}
          placeholder="Password (6+ characters)"
          placeholderTextColor={shcColors.textLight}
          style={styles.input}
          testID="auth-password-input"
        />

        <Pressable
          onPress={submit}
          disabled={busy}
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && !busy && styles.submitBtnPressed,
            busy && styles.submitBtnDisabled,
          ]}
          testID="auth-submit-btn"
          accessibilityRole="button"
        >
          <Text style={styles.submitBtnText}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in as cook' : 'Create cook account'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
          style={styles.modeToggle}
          testID="auth-mode-toggle"
        >
          <Text style={styles.modeToggleText}>
            {mode === 'login' ? 'New home cook? Create an account' : 'Have an account? Sign in'}
          </Text>
        </Pressable>

        {mode === 'login' && (
          <Pressable
            onPress={async () => {
              await clearCookOnboardingSeen();
              setMode('register');
            }}
            style={styles.modeToggle}
            testID="cook-auth-tour-hint"
          >
            <Text style={styles.modeToggleText}>Want the kitchen tour? Create account → setup after sign-up</Text>
          </Pressable>
        )}

        {__DEV__ && mode === 'login' && (
          <Text style={styles.demoHint}>Demo: rose@shc.local / cooksecret — tour shows if not completed yet</Text>
        )}
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
  modeToggle: { marginTop: shcSpacing.lg, paddingVertical: shcSpacing.sm },
  modeToggleText: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: shcColors.primary },
  demoHint: { textAlign: 'center', marginTop: shcSpacing.md, fontSize: 11, color: shcColors.textLight },
});