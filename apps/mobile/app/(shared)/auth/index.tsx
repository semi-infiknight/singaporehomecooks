// apps/mobile/app/(shared)/auth/index.tsx
// Basic auth mock entry (SecureStore backed via hook). Dev friendly.
import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCButton, SHCButtonText, shcColors } from '@shc/ui';
import { useAuth } from '../../../hooks/useAuth';

export default function AuthScreen() {
  const { switchRole } = useAuth();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: shcColors.background, padding: 16, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, textAlign: 'center', marginBottom: 20 }}>Singapore Home Cooks</Text>
      <SHCButton onPress={async () => { await switchRole('customer'); router.replace('/'); }}>
        <SHCButtonText>Continue as Customer (demo)</SHCButtonText>
      </SHCButton>
      <SHCButton onPress={async () => { await switchRole('cook', 'Auntie Rose'); router.replace('/(cook)/dashboard'); }} style={{ marginTop: 12 }}>
        <SHCButtonText>Continue as Cook (Auntie Rose)</SHCButtonText>
      </SHCButton>
      <Text style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: shcColors.textLight }}>SecureStore ready. Real OTP/SMS + JWT later (07-auth.md).</Text>
    </View>
  );
}