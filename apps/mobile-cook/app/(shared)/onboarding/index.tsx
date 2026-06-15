import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, shcColors } from '@shc/ui';

export default function Onboarding() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Welcome, home cook</Text>
      <Text style={{ color: shcColors.textLight, marginBottom: 20 }}>
        List dishes, fulfil orders, and track earnings from your HDB kitchen.
      </Text>
      <SHCCard style={{ padding: 16 }}>
        <SHCButton onPress={() => router.replace('/(cook)/dashboard')}>
          <SHCButtonText>Go to dashboard</SHCButtonText>
        </SHCButton>
      </SHCCard>
    </ScrollView>
  );
}