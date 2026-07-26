/**
 * Category explore page — HomelyEats "Explore category" IA.
 * Offer banner · Top rated dishes · All kitchens (scoped to cuisine id).
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  GourmeatDishCard,
  GourmeatSectionTitle,
  SHCTiffinKitchenCard,
  SHCSkeletonDishGrid,
  SHCSkeletonKitchenList,
  SHCDiscoverFilterSheet,
  useSHCTray,
  gourmeatColors,
  shcSpacing,
  shcRadii,
  contentPadSafe,
  type SHCDishCardData,
} from '@shc/ui';
import {
  getCuisineCategoryById,
  scopeProductsByCategory,
  scopeKitchensByCategory,
  topRatedCategoryDishes,
  categoryOfferCopy,
  getDishImageUrl,
  getCookKitchenHeroUrl,
  coerceRating,
  filterDiscoverProducts,
  discoverActiveFilterCount,
  clearedDiscoverFilters,
  MEAL_TYPE_CHIPS,
  type MealTypeId,
} from '@shc/utils';
import { useProducts, useAddToCart } from '../../../hooks/useProducts';
import { useGuestAuthGate } from '../../../hooks/useGuestAuthGate';
import { useCustomerLocation } from '../../../hooks/useCustomerLocation';
import { useDiscoverPrefs } from '../../../hooks/useDiscoverPrefs';
import { getCooks } from '../../../lib/api-client';
import { VirtualRowFlashList } from '../../../components/VirtualLists';

function toDishCardData(product: Record<string, unknown>): SHCDishCardData {
  const id = String(product.id);
  return {
    id,
    name: String(product.name),
    cook_name: String(product.cook_name || product.cook_display_name || ''),
    price: Number(product.price),
    cuisine: product.cuisine ? String(product.cuisine) : undefined,
    rating: coerceRating(product.rating),
    halal: Boolean(product.halal),
    ...(product.collection_slot ? { collection_slot: String(product.collection_slot) } : {}),
    image_url: getDishImageUrl({
      id,
      cuisine: product.cuisine ? String(product.cuisine) : undefined,
      name: String(product.name),
      image_url: product.image_url as string | undefined,
    }),
  };
}

export default function CategoryExploreScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const categoryId = decodeURIComponent(String(rawId || ''));
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requireAuth } = useGuestAuthGate();
  const addMut = useAddToCart();
  const { data: products, isLoading } = useProducts('');
  const productList = (products as Record<string, unknown>[]) ?? [];
  const { data: cooks, isLoading: cooksLoading } = useQuery({ queryKey: ['cooks'], queryFn: getCooks, staleTime: 60_000 });
  const cookList = (cooks as Record<string, unknown>[]) ?? [];
  const { openTray, dismiss } = useSHCTray();
  const { active: collectionLocation } = useCustomerLocation();
  const { halalOnly, maxCal, vegetarianOnly, toggleHalalOnly, toggleLight, toggleVegetarianOnly } = useDiscoverPrefs();
  const [chip, setChip] = useState('all');
  const [mealType, setMealType] = useState<MealTypeId>('all');

  const category = useMemo(() => getCuisineCategoryById(categoryId), [categoryId]);
  const offer = useMemo(() => categoryOfferCopy(category), [category]);

  const filters = useMemo(
    () => ({ mealType, halalOnly, vegetarianOnly, maxCal }),
    [mealType, halalOnly, vegetarianOnly, maxCal]
  );
  const activeFilterCount = discoverActiveFilterCount(filters);

  const categoryProducts = useMemo(() => {
    const scoped = scopeProductsByCategory(productList, categoryId);
    return filterDiscoverProducts(scoped, {
      mealType: mealType !== 'all' ? mealType : undefined,
      halalOnly: halalOnly || undefined,
      vegetarianOnly: vegetarianOnly || undefined,
      maxCal,
    });
  }, [productList, categoryId, mealType, halalOnly, vegetarianOnly, maxCal]);

  const clearFilters = useCallback(() => {
    const cleared = clearedDiscoverFilters();
    setMealType(cleared.mealType);
    if (halalOnly) toggleHalalOnly();
    if (vegetarianOnly) toggleVegetarianOnly();
    if (maxCal != null) toggleLight();
  }, [halalOnly, vegetarianOnly, maxCal, toggleHalalOnly, toggleVegetarianOnly, toggleLight]);

  const openFilters = useCallback(() => {
    openTray(
      { id: 'category-filters', title: 'Filters', height: 'tall' },
      () => (
        <SHCDiscoverFilterSheet
          mealTypeChips={MEAL_TYPE_CHIPS}
          mealType={mealType}
          onMealTypeChange={(id) => setMealType(id as MealTypeId)}
          cuisines={[]}
          cuisine=""
          onCuisineChange={() => {}}
          halalOnly={halalOnly}
          vegetarianOnly={vegetarianOnly}
          lightOnly={maxCal != null}
          onToggleHalal={toggleHalalOnly}
          onToggleVegetarian={toggleVegetarianOnly}
          onToggleLight={toggleLight}
          onClear={clearFilters}
          onApply={dismiss}
          resultCount={categoryProducts.length}
          activeCount={activeFilterCount}
          hideCuisine
          testID="category-filter-sheet"
        />
      )
    );
  }, [
    openTray,
    dismiss,
    mealType,
    halalOnly,
    vegetarianOnly,
    maxCal,
    toggleHalalOnly,
    toggleVegetarianOnly,
    toggleLight,
    clearFilters,
    categoryProducts.length,
    activeFilterCount,
  ]);

  const topRated = useMemo(() => topRatedCategoryDishes(categoryProducts, 8), [categoryProducts]);

  const kitchens = useMemo(() => {
    let list = scopeKitchensByCategory(cookList, categoryProducts, categoryId);
    if (chip === 'nearest' && collectionLocation) {
      list = [...list].sort((a, b) => {
        const aArea = String(a.area || '');
        const bArea = String(b.area || '');
        return (bArea ? 1 : 0) - (aArea ? 1 : 0);
      });
    }
    return list;
  }, [cookList, categoryProducts, categoryId, chip, collectionLocation]);

  const handleAdd = useCallback(
    (productId: string) => {
      if (!requireAuth('Sign in to add dishes to your cart.')) return;
      addMut.mutate({ productId, qty: 1 });
    },
    [requireAuth, addMut]
  );

  const title = category?.label || category?.id || 'Category';

  const ListHeader = (
    <>
      <View style={styles.offerBanner} testID="category-offer-banner">
        <Text style={styles.offerTitle}>{offer.title}</Text>
        <Text style={styles.offerSub}>{offer.subtitle}</Text>
      </View>

      {isLoading ? (
        <View style={{ marginBottom: shcSpacing.md }}>
          <SHCSkeletonDishGrid count={4} />
        </View>
      ) : null}

      <GourmeatSectionTitle title="Top rated" testID="category-top-rated-header" />
      {topRated.length === 0 && !isLoading ? (
        <Text style={styles.empty} testID="category-dishes-empty">
          No dishes in this category yet — try another cuisine from home.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dishRail}
          testID="category-top-rated-rail"
        >
          {topRated.map((p) => (
            <View key={String(p.id)} style={styles.dishCardWrap}>
              <GourmeatDishCard
                dish={toDishCardData(p)}
                onPress={() => router.push(`/(customer)/product/${p.id}` as any)}
                onAddPress={() => handleAdd(String(p.id))}
              />
            </View>
          ))}
        </ScrollView>
      )}

      <GourmeatSectionTitle
        title={kitchens.length ? `${kitchens.length} kitchen${kitchens.length === 1 ? '' : 's'}` : 'All kitchens'}
        testID="category-kitchens-header"
      />
      <View style={{ marginBottom: shcSpacing.sm, flexDirection: 'row', alignItems: 'center', gap: 8 }} data-testid="category-filter-chips">
        <Pressable
          onPress={() => setChip(chip === 'nearest' ? 'all' : 'nearest')}
          style={[styles.nearestChip, chip === 'nearest' && styles.nearestChipOn]}
        >
          <Text style={[styles.nearestChipText, chip === 'nearest' && styles.nearestChipTextOn]}>Nearest</Text>
        </Pressable>
        {chip === 'nearest' ? (
          <Pressable onPress={() => router.push('/(customer)/location' as any)}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: gourmeatColors.primary }}>Set location</Text>
          </Pressable>
        ) : null}
      </View>

      {kitchens.length === 0 && !(isLoading || cooksLoading) ? (
        <Text style={styles.empty} testID="category-kitchens-empty">
          No kitchens listed for this category yet.
        </Text>
      ) : (isLoading || cooksLoading) && kitchens.length === 0 ? (
        <SHCSkeletonKitchenList count={3} />
      ) : null}
    </>
  );

  const renderKitchen = useCallback(
    (c: Record<string, unknown>) => {
      const cookId = String(c.id || c.slug || '');
      const cookName = String(c.display_name || c.name || 'Home kitchen');
      return (
        <View style={{ marginBottom: shcSpacing.sm }}>
          <SHCTiffinKitchenCard
            cookId={cookId}
            cookName={cookName}
            area={c.area ? String(c.area) : undefined}
            tagline={c.story ? String(c.story).slice(0, 80) : `${title} home cooking`}
            rating={coerceRating(c.rating)}
            reviewCount={c.review_count != null ? Number(c.review_count) : undefined}
            coverUri={getCookKitchenHeroUrl(cookId)}
            onPress={() => {
              const slug = c.slug || c.id;
              if (slug) router.push(`/(customer)/cook/${slug}` as any);
            }}
            testID={`category-kitchen-${cookId}`}
          />
        </View>
      );
    },
    [router, title]
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="category-explore-screen">
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="category-back-btn"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1} testID="category-title">
          {title}
        </Text>
        <Pressable onPress={openFilters} style={styles.backBtn} testID="category-filter-btn" accessibilityLabel="Filters">
          <Text style={styles.backText}>☰</Text>
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <VirtualRowFlashList
        data={kitchens}
        testID="category-kitchen-list"
        keyExtractor={(c) => String(c.id || c.slug || '')}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{
          paddingHorizontal: shcSpacing.md,
          paddingTop: shcSpacing.md,
          paddingBottom: contentPadSafe(insets.bottom),
        }}
        renderItem={renderKitchen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: shcSpacing.sm,
    paddingBottom: shcSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E0D8',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 32, fontWeight: '300', color: gourmeatColors.text, lineHeight: 36 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: gourmeatColors.text,
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: gourmeatColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  nearestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
  },
  nearestChipOn: { borderColor: gourmeatColors.primary, backgroundColor: gourmeatColors.primary },
  nearestChipText: { fontSize: 12, fontWeight: '700', color: gourmeatColors.text },
  nearestChipTextOn: { color: '#fff' },
  offerBanner: {
    backgroundColor: gourmeatColors.primary || '#F87048',
    borderRadius: shcRadii.lg,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.md,
  },
  offerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  offerSub: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.92)', marginTop: 6, lineHeight: 18 },
  dishRail: { gap: shcSpacing.sm, paddingBottom: shcSpacing.md },
  dishCardWrap: { width: 168 },
  empty: {
    fontSize: 13,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    marginBottom: shcSpacing.md,
    lineHeight: 18,
  },
});
