import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCButton, SHCButtonText, shcColors } from '@shc/ui';
import { useAuth } from '../../../hooks/useAuth';

export default function CookAuthScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('rose@shc.local');
  const [password, setPassword] = useState('cooksecret');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/(cook)/dashboard');
    } catch (e) {
      Alert.alert('Sign in failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: shcColors.background, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 8, color: shcColors.text }}>SHC Cook Portal</Text>
      <Text style={{ fontSize: 14, color: shcColors.textLight, marginBottom: 24 }}>
        Sign in to manage listings, orders, and earnings.
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Cook email"
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
        <SHCButtonText>{busy ? 'Please wait…' : 'Sign in as cook'}</SHCButtonText>
      </SHCButton>

      <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: shcColors.textLight }}>
        Demo: rose@shc.local / cooksecret
      </Text>
    </View>
  );
}