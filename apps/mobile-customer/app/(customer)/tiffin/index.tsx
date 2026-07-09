import React from 'react';
import { View, ScrollView, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  SHCTiffinHeroBanner,
  SHCTiffinKitchenCard,
  SHCTiffinEmptyState,
  gourmeatColors,
  shcSpacing,
  GourmeatPrimaryButton,
} from '@shc/ui';
import { useTiffinKitchens, useTiffinSubscription } from '../../../hooks/useTiffin';
import { useGuestAuthGate } from '../../../hooks/useGuestAuthGate';

export default function TiffinBrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isGuest, requireAuth } = useGuestAuthGate();
  const { data: kitchens = [], isLoading } = useTiffinKitchens();
  const { data: subData } = useTiffinSubscription();
  const hasSub = Boolean((subData as any)?.subscription);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + shcSpacing.md, paddingBottom: 120, paddingHorizontal: shcSpacing.md }}
      testID="tiffin-browse-screen"
    >
      <GourmeatScreenHeader
        title="Tiffin subscription"
        subtitle="One kitchen, your weekly rhythm — home-cooked meals on repeat."
        onBack={() => router.back()}
        testID="tiffin-browse-header"
      />

      <SHCTiffinHeroBanner />

      {hasSub ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeText}>You have an active tiffin plan</Text>
          <GourmeatPrimaryButton
            label="Manage subscription"
            onPress={() => router.push('/(customer)/tiffin/manage' as any)}
            testID="tiffin-go-manage-btn"
          />
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={gourmeatColors.primary} style={{ marginTop: shcSpacing.xl }} />
      ) : kitchens.length === 0 ? (
        <SHCTiffinEmptyState
          title="No tiffin kitchens yet"
          subtitle="Home cooks are enabling weekly plans. Check back soon or ask your favourite auntie to turn on tiffin."
        />
      ) : (
        kitchens.map((k: any) => (
          <SHCTiffinKitchenCard
            key={k.cook_id}
            cookId={k.cook_id}
            cookName={k.cook?.display_name || 'Home kitchen'}
            area={k.cook?.area}
            tagline={k.tagline || 'Weekly home-cooked meals'}
            mealsOptions={k.meals_per_week_options}
            dishCount={(k.dishes || []).length}
            onPress={() => {
              if (isGuest) {
                requireAuth('Subscribe to tiffin');
                return;
              }
              router.push(`/(customer)/tiffin/kitchen/${k.cook_id}` as any);
            }}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  empty: { textAlign: 'center', color: gourmeatColors.textLight, marginTop: shcSpacing.xl, fontSize: 14 },
  activeBanner: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: 12,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.md,
    gap: shcSpacing.sm,
  },
  activeText: { fontSize: 14, fontWeight: '700', color: gourmeatColors.text },
});