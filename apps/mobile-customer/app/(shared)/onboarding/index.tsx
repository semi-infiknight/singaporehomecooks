import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, shcColors } from '@shc/ui';

export default function Onboarding() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Welcome to Singapore Home Cooks</Text>
      <Text style={{ color: shcColors.textLight, marginBottom: 20 }}>
        Heritage recipes from real HDB kitchens. Planned occasions. Trust first.
      </Text>
      <SHCCard style={{ padding: 16 }}>
        <Text style={{ marginBottom: 12 }}>Browse cooks, order for your next gathering, and track collection with PayNow.</Text>
        <SHCButton onPress={() => router.replace('/(customer)')}>
          <SHCButtonText>Start discovering</SHCButtonText>
        </SHCButton>
      </SHCCard>
    </ScrollView>
  );
}