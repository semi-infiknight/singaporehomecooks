/**
 * Tiffin kitchen page — HomelyEats restaurant IA + plan subscribe.
 * Hero · rating · open · plans · full menu · sticky subscribe CTA.
 */
import React, { useState, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCTiffinKitchenHero,
  SHCTiffinMealsPicker,
  SHCTiffinOrderSummary,
  SHCTiffinMenuListItem,
  GourmeatPrimaryButton,
  GourmeatSectionTitle,
  SHCSkeletonBone,
  SHCSkeletonList,
  gourmeatColors,
  shcSpacing,
} from '@shc/ui';
import {
  getCookAvatarUrl,
  kitchenOpenStatus,
  kitchenTagList,
  kitchenTiffinPlanRows,
  tiffinPlanDurationOptions,
  tiffinPlanDurationTotal,
  subscribeTrustChips,
  kitchenSubscriberLabel,
  type TiffinPlanDurationId,
} from '@shc/utils';
import { tiffinPricePerServing as uiTiffinPrice } from '@shc/ui';
import { useTiffinKitchen, useSubscribeTiffin } from '../../../../hooks/useTiffin';
import { useAuth } from '../../../../hooks/useAuth';
import { useGuestAuthTray } from '../../../../hooks/useGuestAuthTray';

export default function TiffinKitchenScreen() {
  const { cookId } = useLocalSearchParams<{ cookId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showGuestAuthTray } = useGuestAuthTray();
  const { data: kitchen, isLoading } = useTiffinKitchen(cookId || '');
  const subscribeMut = useSubscribeTiffin();
  const [subscribeError, setSubscribeError] = useState('');

  const mealsOptions: number[] = kitchen?.meals_per_week_options || [2, 3, 4];
  const [mealsPerWeek, setMealsPerWeek] = useState<number>(mealsOptions[1] || 3);
  const [planDuration, setPlanDuration] = useState<TiffinPlanDurationId>('7d');
  const durationOpts = tiffinPlanDurationOptions();
  const selectedDuration = durationOpts.find((d) => d.id === planDuration) || durationOpts[0];
  const durationTotal = tiffinPlanDurationTotal(
    mealsPerWeek,
    uiTiffinPrice(mealsPerWeek),
    selectedDuration.weeks
  );

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
    setSubscribeError('');
    if (!cookId) {
      setSubscribeError('Kitchen missing. Go back and open a kitchen again.');
      return;
    }
    if (!user) {
      showGuestAuthTray(
        'Sign in to subscribe',
        'Browse kitchens freely — sign in to start a tiffin plan and pick meals.'
      );
      return;
    }
    try {
      await subscribeMut.mutateAsync({
        cookId: String(cookId),
        mealsPerWeek: mealsPerWeek as 2 | 3 | 4,
        weeks: selectedDuration.weeks,
      });
      router.replace('/(customer)/tiffin/confirm' as any);
    } catch (e: any) {
      setSubscribeError(e?.message || 'Unable to subscribe. Try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + shcSpacing.md, paddingHorizontal: shcSpacing.md }]}>
        <SHCSkeletonBone height={180} radius={16} style={{ marginBottom: shcSpacing.md }} />
        <SHCSkeletonBone height={22} width="60%" style={{ marginBottom: 8 }} />
        <SHCSkeletonBone height={14} width="40%" style={{ marginBottom: shcSpacing.md }} />
        <SHCSkeletonList count={4} rowHeight={56} />
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
          paddingBottom: 140,
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

        <Text style={styles.sectionHint}>Select plan duration</Text>
        <View style={styles.durationRow} testID="tiffin-plan-duration">
          {durationOpts.map((d) => {
            const active = d.id === planDuration;
            return (
              <Pressable
                key={d.id}
                onPress={() => setPlanDuration(d.id)}
                style={[styles.durationChip, active && styles.durationChipOn]}
                testID={`tiffin-duration-${d.id}`}
              >
                <Text style={[styles.durationLabel, active && styles.durationLabelOn]}>{d.label}</Text>
                <Text style={[styles.durationHint, active && styles.durationLabelOn]} numberOfLines={2}>
                  {d.hint}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.durationTotal} testID="tiffin-duration-total">
          Plan estimate · {selectedDuration.label}: S${durationTotal.toFixed(2)}
        </Text>

        <SHCTiffinOrderSummary mealsPerWeek={mealsPerWeek} />

        <GourmeatSectionTitle
          title={dishes.length ? `Full menu · ${dishes.length}` : 'Full menu'}
          testID="kitchen-menu-header"
        />
        <Text style={styles.sectionHint}>Pick dishes when you build your weekly plan after subscribe.</Text>
        {dishes[0] ? (
          <GourmeatPrimaryButton
            label="Order once (try without plan)"
            variant="outline"
            onPress={() =>
              router.push(`/(customer)/product/${encodeURIComponent(dishes[0].id)}` as any)
            }
            testID="kitchen-order-once-btn"
            style={{ marginBottom: shcSpacing.sm }}
          />
        ) : null}
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
        <Text style={styles.sectionHint} testID="kitchen-subscriber-proof">
          👤 {kitchenSubscriberLabel(kitchen.subscriber_count)}
        </Text>

        <Text style={styles.sectionTitle}>Why subscribe</Text>
        {subscribeTrustChips({
          area: kitchen?.cook?.area,
          cookName,
        }).map((c) => (
          <View key={c.id} style={styles.trustCard} testID={`subscribe-trust-${c.id}`}>
            <Text style={styles.trustTitle}>✓ {c.label}</Text>
            <Text style={styles.sectionHint}>{c.detail}</Text>
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 12) + shcSpacing.md,
            zIndex: 40,
            elevation: 40,
          },
        ]}
        testID="tiffin-subscribe-bar"
      >
        {subscribeError ? (
          <Text style={styles.err} testID="tiffin-subscribe-error">
            {subscribeError}
          </Text>
        ) : null}
        <GourmeatPrimaryButton
          label={
            subscribeMut.isPending
              ? 'Subscribing…'
              : user
                ? 'Subscribe & select meals'
                : 'Sign in to subscribe'
          }
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
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: shcSpacing.sm },
  durationChip: {
    flex: 1,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: gourmeatColors.surface,
  },
  durationChipOn: {
    borderColor: gourmeatColors.primary,
    backgroundColor: gourmeatColors.primary,
  },
  durationLabel: { fontSize: 13, fontWeight: '900', color: gourmeatColors.text, textAlign: 'center' },
  durationLabelOn: { color: '#fff' },
  durationHint: {
    fontSize: 9,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  durationTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: gourmeatColors.primary,
    marginBottom: shcSpacing.sm,
  },
  collectionHint: {
    fontSize: 12,
    color: gourmeatColors.primary,
    fontWeight: '600',
    marginTop: shcSpacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: gourmeatColors.text,
    marginTop: shcSpacing.md,
    marginBottom: shcSpacing.sm,
  },
  trustCard: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.sm,
  },
  trustTitle: { fontSize: 14, fontWeight: '800', color: gourmeatColors.text, marginBottom: 4 },
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
  err: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: shcSpacing.sm,
  },
});
