/**
 * Tiffin kitchen page — HomelyEats restaurant IA + plan subscribe.
 * Hero · rating · open · plans · full menu · sticky subscribe CTA.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCTiffinKitchenHero,
  SHCTiffinMealsPicker,
  SHCTiffinOrderSummary,
  SHCTiffinMenuListItem,
  SHCSubscribeTrustChips,
  SHCSubscribeFunnelProgress,
  SHCTiffinPlanFeatureList,
  GourmeatPrimaryButton,
  GourmeatSectionTitle,
  SHCSkeletonBone,
  SHCSkeletonList,
  SHCRecipeStoryPreview,
  gourmeatColors,
  shcSpacing,
} from '@shc/ui';
import {
  getCookKitchenHeroUrl,
  kitchenOpenStatus,
  kitchenTagList,
  kitchenTiffinPlanRows,
  tiffinPlanDurationOptions,
  tiffinPlanDurationTotal,
  subscribeTrustChips,
  kitchenSubscriberLabel,
  kitchenAboutPoints,
  kitchenCollectionHours,
  kitchenChefBackground,
  kitchenTrustCerts,
  kitchenRatingBucketsFromReviews,
  kitchenReviewFromApi,
  sortKitchenReviews,
  kitchenRatingSummary,
  tiffinPlanFeaturesForTier,
  tiffinPlanBestValueMeals,
  tiffinPlanStrikethroughPrice,
  tiffinPlanSavingsLabel,
  tiffinPriceResolver,
  type TiffinPlanDurationId,
} from '@shc/utils';
import { useTiffinKitchen, useSubscribeTiffin } from '../../../../hooks/useTiffin';
import { useCookReviews } from '../../../../hooks/useProducts';
import { useAuth } from '../../../../hooks/useAuth';
import { useGuestAuthTray } from '../../../../hooks/useGuestAuthTray';
import { VirtualRowFlashList } from '../../../../components/VirtualLists';

type TiffinDishRow = {
  id: string;
  name: string;
  price?: number;
  cuisine?: string;
  image_url?: string;
  description?: string;
  ingredients?: Array<{ name: string; quantity?: number; unit?: string }>;
  min_qty?: number;
};

export default function TiffinKitchenScreen() {
  const { cookId } = useLocalSearchParams<{ cookId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showGuestAuthTray } = useGuestAuthTray();
  const { data: kitchen, isLoading } = useTiffinKitchen(cookId || '');
  const cookSlug = String(kitchen?.cook?.slug || '');
  const { data: reviewsPayload } = useCookReviews(cookSlug, { limit: 50 });
  const subscribeMut = useSubscribeTiffin();
  const [subscribeError, setSubscribeError] = useState('');
  const [tab, setTab] = useState<'plan' | 'about' | 'hours' | 'reviews'>('plan');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const mealsOptions: number[] = kitchen?.meals_per_week_options || [2, 3, 4];
  const priceFn = useMemo(
    () => tiffinPriceResolver(kitchen?.pricing_by_meals_per_week),
    [kitchen?.pricing_by_meals_per_week]
  );
  const [mealsPerWeek, setMealsPerWeek] = useState<number>(mealsOptions[1] || 3);
  const [planDuration, setPlanDuration] = useState<TiffinPlanDurationId>('7d');
  const durationOpts = tiffinPlanDurationOptions();
  const selectedDuration = durationOpts.find((d) => d.id === planDuration) || durationOpts[0];
  const durationTotal = tiffinPlanDurationTotal(
    mealsPerWeek,
    priceFn(mealsPerWeek),
    selectedDuration.weeks
  );

  React.useEffect(() => {
    if (kitchen?.meals_per_week_options?.length) {
      setMealsPerWeek(kitchen.meals_per_week_options[1] || kitchen.meals_per_week_options[0]);
    }
  }, [kitchen?.meals_per_week_options]);

  const dishes: TiffinDishRow[] = useMemo(
    () =>
      (kitchen?.dishes || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        price: d.price,
        cuisine: d.cuisine,
        image_url: d.image_url,
        description: d.description,
        ingredients: d.ingredients,
        min_qty: d.min_qty,
      })),
    [kitchen?.dishes]
  );

  const cookName = kitchen?.cook?.display_name || 'Kitchen';
  const cookMeta = {
    id: cookId,
    display_name: cookName,
    area: kitchen?.cook?.area,
    story: kitchen?.tagline || kitchen?.cook?.story,
    cuisine: dishes[0]?.cuisine,
    rating: kitchen?.rating ?? kitchen?.cook?.rating,
    review_count: kitchen?.review_count ?? kitchen?.cook?.review_count,
    subscriber_count: kitchen?.subscriber_count,
    status: kitchen?.enabled === false ? 'paused' : 'active',
    collection_instructions: kitchen?.cook?.collection_instructions,
  };
  const open = kitchenOpenStatus(cookMeta);
  const tags = kitchenTagList(cookMeta);
  const planRows = useMemo(
    () => kitchenTiffinPlanRows(mealsOptions, priceFn),
    [mealsOptions, priceFn]
  );
  const ratingSum = kitchenRatingSummary(cookMeta);
  const hours = kitchenCollectionHours({
    products: dishes,
    collection_days: kitchen?.collection_days,
    default_collection_slot: kitchen?.default_collection_slot,
    collection_instructions: kitchen?.cook?.collection_instructions,
  });
  const aboutPoints = kitchenAboutPoints(cookMeta);
  const trustCerts = kitchenTrustCerts({
    ...cookMeta,
    sfa_reg_number: kitchen?.cook?.sfa_reg_number,
  });
  const chefBg = kitchenChefBackground(cookMeta);
  const reviews = useMemo(
    () => sortKitchenReviews((reviewsPayload?.reviews || []).map(kitchenReviewFromApi), 'recent'),
    [reviewsPayload?.reviews]
  );
  const trustChips = subscribeTrustChips({
    area: kitchen?.cook?.area,
    cookName,
  });
  const bestValueAt = tiffinPlanBestValueMeals(mealsOptions);
  const planFeatures = useMemo(
    () => tiffinPlanFeaturesForTier(mealsPerWeek),
    [mealsPerWeek]
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

  const renderDish = useCallback(
    (d: TiffinDishRow) => (
      <View style={{ marginBottom: shcSpacing.sm }} testID={`kitchen-menu-wrap-${d.id}`}>
        <SHCTiffinMenuListItem
          dish={d}
          subtitle={d.cuisine ? `${d.cuisine} heritage recipe` : 'Home-cooked'}
          onPress={() => router.push(`/(customer)/product/${encodeURIComponent(d.id)}` as any)}
          testID={`kitchen-menu-item-${d.id}`}
        />
        <SHCRecipeStoryPreview
          dish={d}
          cookName={cookName}
          expanded={expandedRecipeId === d.id}
          onToggle={() => setExpandedRecipeId((cur) => (cur === d.id ? null : d.id))}
          onOpenDish={() => router.push(`/(customer)/product/${encodeURIComponent(d.id)}` as any)}
          testID={`kitchen-recipe-${d.id}`}
        />
      </View>
    ),
    [cookName, expandedRecipeId, router]
  );

  if (isLoading) {
    return (
      <View
        style={[styles.screen, { paddingTop: insets.top + shcSpacing.md, paddingHorizontal: shcSpacing.md }]}
        testID="tiffin-kitchen-screen"
      >
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

  const ListHeader = (
    <>
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
        cookId={String(cookId)}
        cookName={cookName}
        tagline={kitchen.tagline || `${kitchen.cook?.area || 'Singapore'} · home-cooked tiffin`}
        imageUri={getCookKitchenHeroUrl(String(cookId), kitchen.cook?.hero_image_url)}
        rating={Number(cookMeta.rating)}
        reviewCount={cookMeta.review_count != null ? Number(cookMeta.review_count) : undefined}
        isOpen={open.isOpen}
        openDetail={open.detail}
        tags={tags}
        story={kitchen.cook?.story || kitchen.tagline}
        testID="kitchen-page-hero"
      />

      <View style={styles.tabRow} testID="kitchen-tabs">
        {(
          [
            { id: 'plan' as const, label: 'Plans' },
            { id: 'about' as const, label: 'About' },
            { id: 'hours' as const, label: 'Hours' },
            { id: 'reviews' as const, label: 'Reviews' },
          ] as const
        ).map((t) => {
          const on = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tabBtn, on && styles.tabBtnOn]}
              testID={`kitchen-tab-${t.id}`}
            >
              <Text style={[styles.tabBtnText, on && styles.tabBtnTextOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'about' ? (
        <View testID="kitchen-tab-panel-about">
          <Text style={styles.panelTitle}>Chef&apos;s background</Text>
          <Text style={styles.sectionHint}>{chefBg}</Text>
          {aboutPoints.map((p) => (
            <Text key={p} style={styles.bullet}>
              ✓ {p}
            </Text>
          ))}
          {trustCerts.map((c) => (
            <View key={c.id} style={styles.trustCard} testID={`kitchen-trust-${c.id}`}>
              <Text style={styles.trustTitle}>{c.label}</Text>
              <Text style={styles.sectionHint}>{c.detail}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tab === 'hours' ? (
        <View testID="kitchen-tab-panel-hours">
          {hours.map((h) => (
            <View key={h.id} style={styles.trustCard}>
              <Text style={styles.trustTitle}>{h.label}</Text>
              <Text style={styles.sectionHint}>{h.window}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tab === 'reviews' ? (
        <View testID="kitchen-tab-panel-reviews">
          {ratingSum ? (
            <>
              <Text style={styles.ratingBig}>{ratingSum.rating.toFixed(1)} / 5</Text>
              {ratingSum.reviewCount != null ? (
                <Text style={styles.sectionHint}>{ratingSum.reviewCount} reviews</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.sectionHint}>No ratings yet for this kitchen.</Text>
          )}
          {reviews.map((r) => (
            <View key={r.id} style={styles.trustCard}>
              <Text style={styles.trustTitle}>{r.author}</Text>
              <Text style={styles.bullet}>{'★'.repeat(r.rating)}</Text>
              <Text style={styles.sectionHint}>{r.body}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tab === 'plan' ? (
        <>
      <SHCSubscribeFunnelProgress current="plan" />
      <GourmeatSectionTitle title="Subscription plans" testID="kitchen-plans-header" />
      <Text style={styles.sectionHint} testID="kitchen-plans-hint">
        Choose meals per week — same kitchen every collection.
      </Text>
      <SHCTiffinMealsPicker
        options={mealsOptions}
        selected={mealsPerWeek}
        onSelect={setMealsPerWeek}
        bestValueAt={bestValueAt}
        strikethroughFor={(n) => tiffinPlanStrikethroughPrice(n, priceFn)}
        savingsLabel={(n) => tiffinPlanSavingsLabel(n, priceFn)}
      />
      <SHCTiffinPlanFeatureList features={planFeatures} />
      <View testID="kitchen-plan-rows">
        {planRows.map((row) => (
          <Text key={row.meals} style={styles.planMeta}>
            {row.label} · S${row.pricePerMeal.toFixed(2)}/meal
          </Text>
        ))}
      </View>

      <Text style={styles.sectionQuestion}>How long would you like to subscribe?</Text>
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
          onPress={() => router.push(`/(customer)/product/${encodeURIComponent(dishes[0].id)}` as any)}
          testID="kitchen-order-once-btn"
          style={{ marginBottom: shcSpacing.sm }}
        />
      ) : null}
        </>
      ) : null}
    </>
  );

  const ListFooter = tab === 'plan' ? (
    <>
      <Text style={styles.collectionHint} testID="kitchen-collection-days">
        Collection days:{' '}
        {(kitchen.collection_days || [])
          .map((d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
          .join(', ')}
      </Text>
      <Text style={styles.sectionHint} testID="kitchen-subscriber-proof">
        👤 {kitchenSubscriberLabel(kitchen.subscriber_count)}
      </Text>
    </>
  ) : null;

  const showDishList = tab === 'plan';

  return (
    <View style={styles.screen} testID="tiffin-kitchen-screen">
      <VirtualRowFlashList
        data={showDishList ? dishes : []}
        testID="kitchen-menu-list"
        keyExtractor={(d) => d.id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={{
          paddingTop: insets.top + shcSpacing.sm,
          paddingHorizontal: shcSpacing.md,
          paddingBottom: 140 + Math.max(insets.bottom, 12),
        }}
        renderItem={renderDish}
        ListEmptyComponent={
          <Text style={styles.empty} testID="kitchen-menu-empty">
            No tiffin dishes listed for this kitchen yet.
          </Text>
        }
      />

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
        {tab !== 'plan' ? (
          <Pressable onPress={() => setTab('plan')} style={{ marginBottom: shcSpacing.sm }}>
            <Text style={styles.planTabHint}>Plan tab · choose meals/week first ↑</Text>
          </Pressable>
        ) : (
          <SHCSubscribeTrustChips chips={trustChips.slice(0, 3)} compact testID="subscribe-trust-chips" />
        )}
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
  panelTitle: { fontSize: 14, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.sm },
  bullet: { fontSize: 13, fontWeight: '600', color: gourmeatColors.text, marginBottom: 6 },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: gourmeatColors.border,
    marginBottom: shcSpacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabBtnOn: { borderBottomColor: gourmeatColors.primary },
  tabBtnText: { fontSize: 13, fontWeight: '700', color: gourmeatColors.textLight },
  tabBtnTextOn: { color: gourmeatColors.primary, fontWeight: '800' },
  ratingBig: { fontSize: 28, fontWeight: '900', color: gourmeatColors.text },
  planTabHint: { fontSize: 12, fontWeight: '700', color: gourmeatColors.primary },
  sectionQuestion: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.sm },
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
