import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  SHCButton,
  SHCButtonText,
  SHCFoodImage,
  GourmeatCookHeader,
  SHCBadge,
  shcColors,
  shcSpacing,
  shcRadii,
  shcBorders,
  shcShadows,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { markCookOnboardingSeen } from '../../../lib/onboarding';
import { useShcI18n, getCookOnboardingCopy } from '@shc/i18n';

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useShcI18n();
  const copy = getCookOnboardingCopy(locale);

  const finish = async () => {
    await markCookOnboardingSeen();
    router.replace('/(cook)/dashboard');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: insets.bottom + shcSpacing.lg }]}
      testID="cook-onboarding-screen"
    >
      <GourmeatCookHeader title={copy.title} subtitle={copy.subtitle} testID="cook-onboarding-hero" />

      <View style={styles.heroImage}>
        <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={140} rounded={shcRadii.lg} />
      </View>

      <SHCCard variant="bento-peach" style={styles.card}>
        <View style={styles.badgeRow}>
          <SHCBadge variant="heritage">{t('cook.dashboard.payout_badge')}</SHCBadge>
          <SHCBadge variant="success">HDB kitchen</SHCBadge>
        </View>
        <Text style={styles.body}>{copy.subtitle}</Text>
        <SHCButton onPress={finish} testID="cook-onboarding-finish-btn" style={styles.cta}>
          <SHCButtonText>{copy.cta}</SHCButtonText>
        </SHCButton>
      </SHCCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: shcColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  heroImage: { marginTop: shcSpacing.md, marginBottom: shcSpacing.md },
  card: {
    padding: shcSpacing.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    ...shcShadows.brutalSm,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: shcSpacing.sm, marginBottom: shcSpacing.sm },
  body: { fontSize: 14, color: shcColors.textLight, lineHeight: 20, marginBottom: shcSpacing.md },
  cta: { marginTop: shcSpacing.xs },
});
