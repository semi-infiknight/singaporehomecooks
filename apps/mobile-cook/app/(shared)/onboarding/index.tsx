import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, shcColors } from '@shc/ui';
import { markCookOnboardingSeen } from '../../../lib/onboarding';

export default function Onboarding() {
  const router = useRouter();

  const finish = async () => {
    await markCookOnboardingSeen();
    router.replace('/(cook)/dashboard');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }} testID="cook-onboarding-screen">
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Welcome, home cook</Text>
      <Text style={{ color: shcColors.textLight, marginBottom: 20 }}>
        List dishes, fulfil orders, and track earnings from your HDB kitchen.
      </Text>
      <SHCCard style={{ padding: 16 }}>
        <SHCButton onPress={finish} testID="cook-onboarding-finish-btn">
          <SHCButtonText>Go to dashboard</SHCButtonText>
        </SHCButton>
      </SHCCard>
    </ScrollView>
  );
}