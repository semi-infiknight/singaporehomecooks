/**
 * Tiffin kitchen page — HomelyEats restaurant IA + plan subscribe.
 * Hero · rating · open · plans · full menu · sticky subscribe CTA.
 */
import React, { useState, useMemo } from 'react';
import { View, ScrollView, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCTiffinKitchenHero,
  SHCTiffinMealsPicker,
  SHCTiffinOrderSummary,
  SHCTiffinMenuListItem,
  GourmeatPrimaryButton,
  GourmeatSectionTitle,
  gourmeatColors,
  shcSpacing,
} from '@shc/ui';
import {
  getCookAvatarUrl,
  kitchenOpenStatus,
  kitchenTagList,
  kitchenTiffinPlanRows,
} from '@shc/utils';
import { tiffinPricePerServing as uiTiffinPrice } from '@shc/ui';
import { useTiffinKitchen, useSubscribeTiffin } from '../../../../hooks/useTiffin';

export default function TiffinKitchenScreen() {
  const { cookId } = useLocalSearchParams<{ cookId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: kitchen, isLoading } = useTiffinKitchen(cookId || '');
  const subscribeMut = useSubscribeTiffin();

  const mealsOptions: number[] = kitchen?.meals_per_week_options || [2, 3, 4];
  const [mealsPerWeek, setMealsPerWeek] = useState<number>(mealsOptions[1] || 3);

  React.useEffect(() => {
    if (kitchen?.meals_per_week_options?.length) {
      setMealsPerWeek(kitchen.meals_per_week_options[1] || kitchen.meals_per_week_options[0]);
    }
  }, [kitchen?.meals_per_week_options]);

  const dishes = (kitchen?.dishes || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    price: d.price,
    cuisine: d.cuisine,
  }));

  const cookName = kitchen?.cook?.display_name || 'Kitchen';
  const cookMeta = {
    id: cookId,
    display_name: cookName,
    area: kitchen?.cook?.area,
    story: kitchen?.tagline || kitchen?.cook?.story,
    cuisine: dishes[0]?.cuisine,
    rating: kitchen?.rating ?? kitchen?.cook?.rating ?? 4.8,
    review_count: kitchen?.review_count ?? kitchen?.cook?.review_count,
    subscriber_count: kitchen?.subscriber_count,
    status: kitchen?.enabled === false ? 'paused' : 'active',
  };
  const open = kitchenOpenStatus(cookMeta);
  const tags = kitchenTagList(cookMeta);
  const planRows = useMemo(
    () => kitchenTiffinPlanRows(mealsOptions, (n) => uiTiffinPrice(n)),
    [mealsOptions]
  );

  const handleSubscribe = async () => {
    if (!cookId) return;
    await subscribeMut.mutateAsync({
      cookId,
      mealsPerWeek: mealsPerWeek as 2 | 3 | 4,
    });
    router.replace('/(customer)/tiffin/confirm' as any);
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={gourmeatColors.primary} />
      </View>
    );
  }

  if (!kitchen) {
    return (
      <View style={[styles.screen, styles.centered, { padding: shcSpacing.lg }]} testID="tiffin-kitchen-missing">
        <Text style={styles.empty}>This kitchen is not available for tiffin.</Text>
        <GourmeatPrimaryButton label="Back" onPress={() => router.back()} testID="tiffin-kitchen-back" />
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="tiffin-kitchen-screen">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + shcSpacing.sm,
          paddingHorizontal: shcSpacing.md,
          paddingBottom: 120,
        }}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="kitchen-back-btn">
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1} testID="kitchen-page-title">
            {cookName}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <SHCTiffinKitchenHero
          cookName={cookName}
          tagline={
            kitchen.tagline || `${kitchen.cook?.area || 'Singapore'} · home-cooked tiffin`
          }
          imageUri={getCookAvatarUrl(cookId || 'tiffin', cookName)}
          rating={Number(cookMeta.rating)}
          reviewCount={cookMeta.review_count != null ? Number(cookMeta.review_count) : undefined}
          isOpen={open.isOpen}
          openDetail={open.detail}
          tags={tags}
          story={kitchen.cook?.story || kitchen.tagline}
          testID="kitchen-page-hero"
        />

        <GourmeatSectionTitle title="Subscription plans" testID="kitchen-plans-header" />
        <Text style={styles.sectionHint} testID="kitchen-plans-hint">
          Choose meals per week — same kitchen every collection.
        </Text>
        <SHCTiffinMealsPicker options={mealsOptions} selected={mealsPerWeek} onSelect={setMealsPerWeek} />
        <View testID="kitchen-plan-rows">
          {planRows.map((row) => (
            <Text key={row.meals} style={styles.planMeta}>
              {row.label} · S${row.pricePerMeal.toFixed(2)}/meal
            </Text>
          ))}
        </View>
        <SHCTiffinOrderSummary mealsPerWeek={mealsPerWeek} />

        <GourmeatSectionTitle
          title={dishes.length ? `Full menu · ${dishes.length}` : 'Full menu'}
          testID="kitchen-menu-header"
        />
        <Text style={styles.sectionHint}>Pick dishes when you build your weekly plan after subscribe.</Text>
        {dishes.length === 0 ? (
          <Text style={styles.empty} testID="kitchen-menu-empty">
            No tiffin dishes listed for this kitchen yet.
          </Text>
        ) : (
          dishes.map((d: { id: string; name: string; price?: number; cuisine?: string }) => (
            <SHCTiffinMenuListItem
              key={d.id}
              dish={d}
              subtitle={d.cuisine ? `${d.cuisine} heritage recipe` : 'Home-cooked'}
              onPress={() => router.push(`/(customer)/tiffin/menu?cookId=${cookId}` as any)}
            />
          ))
        )}

        <Text style={styles.collectionHint} testID="kitchen-collection-days">
          Collection days:{' '}
          {(kitchen.collection_days || [])
            .map((d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
            .join(', ')}
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + shcSpacing.md }]}>
        <GourmeatPrimaryButton
          label="Subscribe & select meals"
          onPress={handleSubscribe}
          loading={subscribeMut.isPending}
          testID="tiffin-subscribe-btn"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 15, color: gourmeatColors.textLight, marginBottom: shcSpacing.md, textAlign: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: shcSpacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 32, fontWeight: '300', color: gourmeatColors.text, lineHeight: 36 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: gourmeatColors.text },
  sectionHint: { fontSize: 12, color: gourmeatColors.textLight, marginBottom: shcSpacing.sm },
  planMeta: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginBottom: 2 },
  collectionHint: {
    fontSize: 12,
    color: gourmeatColors.primary,
    fontWeight: '600',
    marginTop: shcSpacing.md,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: shcSpacing.md,
    paddingTop: shcSpacing.md,
    backgroundColor: gourmeatColors.surface,
    borderTopWidth: 1,
    borderTopColor: gourmeatColors.border,
  },
});
