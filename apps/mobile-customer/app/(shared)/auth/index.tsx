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
import { shcSpacing, gourmeatRadii, gourmeatShadows, SHCButton, gourmeatColors } from '@shc/ui';
import { useAuth } from '../../../hooks/useAuth';
import { useShcI18n } from '@shc/i18n';

export default function AuthScreen() {
  const { t } = useShcI18n();
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
      Alert.alert(t('auth.failed_title'), (e as Error).message);
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
        <Text style={styles.title}>{t('auth.app_title')}</Text>
        <Text style={styles.subtitle}>{t('auth.sign_in_subtitle')}</Text>

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
          placeholder={t('auth.email_placeholder')}
          placeholderTextColor={gourmeatColors.textMuted}
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
          placeholder={t('auth.password_placeholder')}
          placeholderTextColor={gourmeatColors.textMuted}
          style={styles.input}
          testID="auth-password-input"
        />

        <SHCButton
          onPress={submit}
          disabled={busy}
          size="lg"
          testID="auth-submit-btn"
          style={styles.submitBtn}
        >
          {busy ? t('auth.please_wait') : mode === 'login' ? t('auth.sign_in_btn') : t('auth.create_account_btn')}
        </SHCButton>

        <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={styles.modeToggle} testID="auth-mode-toggle">
          <Text style={styles.modeToggleText}>
            {mode === 'login' ? t('auth.toggle_to_register') : t('auth.toggle_to_login_mobile')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(customer)' as any)}
          style={styles.browseBtn}
          testID="auth-browse-guest-btn"
          accessibilityRole="button"
        >
          <Text style={styles.browseBtnText}>{t('auth.browse_guest')}</Text>
        </Pressable>

        <Text style={styles.demoHint}>{t('auth.demo_hint')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { flexGrow: 1, padding: shcSpacing.lg, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: shcSpacing.sm, color: gourmeatColors.text },
  subtitle: { fontSize: 14, color: gourmeatColors.textLight, marginBottom: shcSpacing.lg },
  input: {
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    borderRadius: gourmeatRadii.md,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.md,
    backgroundColor: gourmeatColors.surface,
    fontSize: 16,
    color: gourmeatColors.text,
  },
  submitBtn: {
    alignSelf: 'stretch',
    marginTop: shcSpacing.xs,
  },
  modeToggle: { marginTop: shcSpacing.md, paddingVertical: shcSpacing.sm },
  modeToggleText: { textAlign: 'center', color: gourmeatColors.primary, fontWeight: '700', fontSize: 15 },
  browseBtn: {
    marginTop: shcSpacing.sm,
    paddingVertical: shcSpacing.md,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    borderRadius: gourmeatRadii.md,
    backgroundColor: gourmeatColors.primaryLight,
    alignItems: 'center',
    ...gourmeatShadows.soft,
  },
  browseBtnText: { color: gourmeatColors.text, fontWeight: '800', fontSize: 15 },
  demoHint: { textAlign: 'center', marginTop: shcSpacing.lg, fontSize: 11, color: gourmeatColors.textLight },
});
