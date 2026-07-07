import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  SHCIcon,
  SHCFoodImage,
  gourmeatColors,
  gourmeatRadii,
  gourmeatShadows,
  shcSpacing,
  type SHCIconKey,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useShcI18n, getTrustSafetyOnboardingCopy } from '@shc/i18n';
import type { TrustLayerKey } from '@shc/i18n';

const LAYER_ICONS: Record<TrustLayerKey, SHCIconKey> = {
  kitchen: 'compliance',
  tasting: 'leaf',
  receipts: 'credits',
  guarantee: 'orders',
  collection: 'discover',
};

export default function TrustAndSafetyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useShcI18n();
  const copy = getTrustSafetyOnboardingCopy(locale);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: insets.bottom + 32 }]}
      testID="trust-safety-screen"
    >
      <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={120} rounded={gourmeatRadii.lg} />

      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      {copy.layers.map((layer) => (
        <SHCCard key={layer.key} style={styles.layerCard}>
          <View style={styles.layerRow}>
            <View style={styles.layerIcon}>
              <SHCIcon name={LAYER_ICONS[layer.key]} size={22} color={gourmeatColors.primary} active />
            </View>
            <View style={styles.layerCopy}>
              <Text style={styles.layerTitle}>{layer.title}</Text>
              <Text style={styles.layerBody}>{layer.desc}</Text>
            </View>
          </View>
        </SHCCard>
      ))}

      <SHCCard variant="bento-peach" style={styles.policyCard}>
        <Text style={styles.policyTitle}>{copy.allergenTitle}</Text>
        <Text style={styles.policyBody}>{copy.allergenBody}</Text>
      </SHCCard>

      <SHCCard style={styles.policyCard}>
        <Text style={styles.policyTitle}>{copy.cancellationTitle}</Text>
        {copy.cancellationLines.map((line) => (
          <Text key={line} style={styles.policyLine}>· {line}</Text>
        ))}
      </SHCCard>

      <SHCCard variant="bento-mint" style={styles.policyCard}>
        <Text style={styles.policyTitle}>{copy.pdpaTitle}</Text>
        <Text style={styles.policyBody}>{copy.pdpaBody}</Text>
      </SHCCard>

      <Pressable
        onPress={() => router.replace('/(customer)')}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        testID="trust-browse-cta"
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>{copy.browseCta}</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(customer)/cook/auntie-rose-tampines' as any)} style={styles.secondaryCta}>
        <Text style={styles.secondaryCtaText}>{copy.meetCookCta}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  title: { fontSize: 26, fontWeight: '900', color: gourmeatColors.text, marginTop: shcSpacing.md },
  subtitle: { fontSize: 14, color: gourmeatColors.textLight, marginTop: shcSpacing.sm, marginBottom: shcSpacing.md, lineHeight: 20 },
  layerCard: { marginBottom: shcSpacing.sm },
  layerRow: { flexDirection: 'row', gap: shcSpacing.sm },
  layerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: gourmeatColors.primaryLight,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerCopy: { flex: 1 },
  layerTitle: { fontSize: 15, fontWeight: '800', color: gourmeatColors.text },
  layerBody: { fontSize: 13, color: gourmeatColors.textLight, marginTop: 4, lineHeight: 18 },
  policyCard: { marginBottom: shcSpacing.sm },
  policyTitle: { fontSize: 15, fontWeight: '800', color: gourmeatColors.text, marginBottom: 6 },
  policyBody: { fontSize: 13, color: gourmeatColors.textLight, lineHeight: 18 },
  policyLine: { fontSize: 13, color: gourmeatColors.textLight, marginTop: 4 },
  cta: {
    marginTop: shcSpacing.lg,
    backgroundColor: gourmeatColors.primary,
    borderWidth: 1,
    borderColor: gourmeatColors.borderDark,
    borderRadius: gourmeatRadii.md,
    paddingVertical: shcSpacing.md,
    alignItems: 'center',
    minHeight: 52,
    ...gourmeatShadows.soft,
  },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  ctaText: { color: gourmeatColors.onPrimary, fontWeight: '800', fontSize: 16 },
  secondaryCta: { marginTop: shcSpacing.md, paddingVertical: shcSpacing.sm, alignItems: 'center' },
  secondaryCtaText: { color: gourmeatColors.primary, fontWeight: '700', fontSize: 14 },
});
