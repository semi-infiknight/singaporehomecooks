import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCButton, SHCButtonText, shcColors } from '@shc/ui';
import { useAuth } from '../../../hooks/useAuth';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('customer@shc.local');
  const [password, setPassword] = useState('customersecret');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
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
    <View style={{ flex: 1, backgroundColor: shcColors.background, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 8, color: shcColors.text }}>Singapore Home Cooks</Text>
      <Text style={{ fontSize: 14, color: shcColors.textLight, marginBottom: 24 }}>Customer app — sign in to order heritage home-cooked food.</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff' }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#fff' }}
      />

      <SHCButton onPress={submit} disabled={busy}>
        <SHCButtonText>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</SHCButtonText>
      </SHCButton>

      <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ marginTop: 16 }}>
        <Text style={{ textAlign: 'center', color: shcColors.primary }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </Text>
      </Pressable>

      <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: shcColors.textLight }}>
        Demo: customer@shc.local / customersecret (after bootstrap)
      </Text>
    </View>
  );
}