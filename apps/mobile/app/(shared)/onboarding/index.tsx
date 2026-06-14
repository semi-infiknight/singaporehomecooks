// apps/mobile/app/(shared)/onboarding/index.tsx
// Basic multi-step onboarding for customer and cook (phase-2). SG PDPA consent, heritage intro.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, shcColors } from '@shc/ui';
import { useAuth } from '../../../hooks/useAuth';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'customer' | 'cook'>('customer');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const { switchRole } = useAuth();
  const router = useRouter();

  const finish = async () => {
    if (role === 'cook' && !pdpaConsent) {
      // enforce for cook onboarding per PDPA
      return;
    }
    const consentPayload = role === 'cook' ? { at: new Date().toISOString(), version: 'v1.0-pdpa-2025' } : undefined;
    await switchRole(role, undefined, consentPayload as any);
    router.replace(role === 'cook' ? '/(cook)/dashboard' : '/(customer)/index' as any);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Welcome to Singapore Home Cooks</Text>
      <Text style={{ color: shcColors.textLight }}>Heritage recipes from real HDB kitchens. Planned occasions. Trust first.</Text>

      {step === 1 && (
        <SHCCard style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: '600' }}>Step 1: Choose your role</Text>
          <Pressable onPress={() => setRole('customer')} style={{ padding: 12, backgroundColor: role === 'customer' ? shcColors.primary : '#eee', marginTop: 8, borderRadius: 8 }}>
            <Text style={{ color: role === 'customer' ? '#fff' : shcColors.text }}>I'm a Customer (planning family gatherings)</Text>
          </Pressable>
          <Pressable onPress={() => setRole('cook')} style={{ padding: 12, backgroundColor: role === 'cook' ? shcColors.primary : '#eee', marginTop: 8, borderRadius: 8 }}>
            <Text style={{ color: role === 'cook' ? '#fff' : shcColors.text }}>I'm a Home Cook (share my Peranakan / Hainanese recipes)</Text>
          </Pressable>
          <SHCButton onPress={() => setStep(2)} style={{ marginTop: 12 }}><SHCButtonText>Continue</SHCButtonText></SHCButton>
        </SHCCard>
      )}

      {step === 2 && (
        <SHCCard>
          <Text style={{ fontWeight: '600' }}>Step 2: Trust & PDPA (Singapore)</Text>
          <Text style={{ marginVertical: 8 }}>We protect cook privacy: addresses released only after PayNow. Allergen disclosure mandatory. Your data used only for order fulfilment (3yr retention per DATA_RETENTION_MATRIX).</Text>
          {/* Wire trust copy from seed/content if available */}
          <Text style={{ fontSize: 12, color: shcColors.textLight, marginTop: 4 }}>5-Layer Trust: addresses gated, allergen ack enforced, one-cook carts, SFA/WSQ cooks, post-collection review only.</Text>
          <Text style={{ marginTop: 8 }}>Consent captured on real sign-up (stub here). Full: content/trust-and-safety.md</Text>

          {role === 'cook' && (
            <View style={{ marginTop: 12, padding: 8, backgroundColor: shcColors.surface, borderRadius: 6 }}>
              <Pressable onPress={() => setPdpaConsent(!pdpaConsent)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>{pdpaConsent ? '☑' : '☐'}</Text>
                <Text style={{ flex: 1, fontSize: 13 }}>I (the cook) explicitly consent to PDPA processing of my personal data (story, contact, compliance docs, earnings) for platform operations, payouts and compliance verification. Consent version v1.0-pdpa-2025. (Required for cook role)</Text>
              </Pressable>
              <Text style={{ fontSize: 10, color: shcColors.textLight, marginTop: 4 }}>Timestamp recorded in profile + audit log.</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <SHCButton onPress={() => setStep(1)}><SHCButtonText>Back</SHCButtonText></SHCButton>
            <SHCButton onPress={finish} disabled={role === 'cook' && !pdpaConsent}><SHCButtonText>Finish & Enter (dev)</SHCButtonText></SHCButton>
          </View>
        </SHCCard>
      )}

      <Text style={{ marginTop: 24, fontSize: 11 }}>For cooks: SFA + WSQ certs required before accepting orders (compliance stub in dashboard).</Text>
    </ScrollView>
  );
}