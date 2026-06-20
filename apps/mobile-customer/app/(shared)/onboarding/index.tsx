import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  SHCIcon,
  SHCFoodImage,
  shcColors,
  shcSpacing,
  shcBorders,
  shcRadii,
  shcShadows,
  type SHCIconKey,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES } from '@shc/utils';

const TRUST_LAYERS: { iconKey: SHCIconKey; title: string; body: string }[] = [
  {
    iconKey: 'compliance',
    title: 'Kitchen transparency',
    body: 'Cooks share dish demos and kitchen intros so you see the real HDB workspace before you order.',
  },
  {
    iconKey: 'leaf',
    title: 'Tasting portions',
    body: 'New cooks offer S$3–5 tasting sizes — try once before committing to a full occasion order.',
  },
  {
    iconKey: 'credits',
    title: 'Clear receipts',
    body: 'Itemised totals, platform fee, and cook earnings shown at every step. Corporate tax invoices supported.',
  },
  {
    iconKey: 'orders',
    title: 'Occasion guarantee',
    body: 'Orders over S$150: tiered platform-backed refund (up to 50%, capped at S$100) for verified quality issues.',
  },
  {
    iconKey: 'discover',
    title: 'Safe HDB collection',
    body: 'Exact block and unit released 2h before your slot. Collection-only — no delivery, no stranger at your door.',
  },
];

export default function TrustAndSafetyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: insets.bottom + 32 }]}
      testID="trust-safety-screen"
    >
      <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={120} rounded={shcRadii.lg} />

      <Text style={styles.title}>Trust & Safety</Text>
      <Text style={styles.subtitle}>
        Five layers of protection for customers and cooks — built for Singapore home kitchens, not generic delivery.
      </Text>

      {TRUST_LAYERS.map((layer) => (
        <SHCCard key={layer.title} style={styles.layerCard}>
          <View style={styles.layerRow}>
            <View style={styles.layerIcon}>
              <SHCIcon name={layer.iconKey} size={22} color={shcColors.primary} active />
            </View>
            <View style={styles.layerCopy}>
              <Text style={styles.layerTitle}>{layer.title}</Text>
              <Text style={styles.layerBody}>{layer.body}</Text>
            </View>
          </View>
        </SHCCard>
      ))}

      <SHCCard variant="bento-peach" style={styles.policyCard}>
        <Text style={styles.policyTitle}>Allergen disclosure</Text>
        <Text style={styles.policyBody}>
          Every dish lists Tier 1 allergens. You must acknowledge them before checkout. Home kitchens carry cross-contamination
          risk — we state that plainly, not in fine print.
        </Text>
      </SHCCard>

      <SHCCard style={styles.policyCard}>
        <Text style={styles.policyTitle}>Cancellation</Text>
        <Text style={styles.policyLine}>· 72+ hours before collection → full refund</Text>
        <Text style={styles.policyLine}>· 24–72 hours → 50% refund</Text>
        <Text style={styles.policyLine}>· Under 24 hours → no refund (food is prepped)</Text>
      </SHCCard>

      <SHCCard variant="bento-mint" style={styles.policyCard}>
        <Text style={styles.policyTitle}>PDPA & collection privacy</Text>
        <Text style={styles.policyBody}>
          Consent captured at checkout. Cook addresses stay hidden until 2 hours before your slot. Request data deletion from
          Profile any time.
        </Text>
      </SHCCard>

      <Pressable
        onPress={() => router.replace('/(customer)')}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        testID="trust-browse-cta"
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>Browse dishes</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(customer)/cook/auntie-rose-tampines' as any)} style={styles.secondaryCta}>
        <Text style={styles.secondaryCtaText}>Meet Auntie Rose (Katong heritage cook) →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: shcColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  title: { fontSize: 26, fontWeight: '900', color: shcColors.text, marginTop: shcSpacing.md },
  subtitle: { fontSize: 14, color: shcColors.textLight, marginTop: shcSpacing.sm, marginBottom: shcSpacing.md, lineHeight: 20 },
  layerCard: { marginBottom: shcSpacing.sm },
  layerRow: { flexDirection: 'row', gap: shcSpacing.sm },
  layerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: shcColors.bentoMint,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerCopy: { flex: 1 },
  layerTitle: { fontSize: 15, fontWeight: '800', color: shcColors.text },
  layerBody: { fontSize: 13, color: shcColors.textLight, marginTop: 4, lineHeight: 18 },
  policyCard: { marginBottom: shcSpacing.sm },
  policyTitle: { fontSize: 15, fontWeight: '800', color: shcColors.text, marginBottom: 6 },
  policyBody: { fontSize: 13, color: shcColors.textLight, lineHeight: 18 },
  policyLine: { fontSize: 13, color: shcColors.textLight, marginTop: 4 },
  cta: {
    marginTop: shcSpacing.lg,
    backgroundColor: shcColors.primary,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    paddingVertical: shcSpacing.md,
    alignItems: 'center',
    minHeight: 52,
    ...shcShadows.brutalSm,
  },
  ctaPressed: { ...shcShadows.brutalPressed, transform: [{ scale: 0.98 }] },
  ctaText: { color: shcColors.onPrimary, fontWeight: '800', fontSize: 16 },
  secondaryCta: { marginTop: shcSpacing.md, paddingVertical: shcSpacing.sm, alignItems: 'center' },
  secondaryCtaText: { color: shcColors.primary, fontWeight: '700', fontSize: 14 },
});