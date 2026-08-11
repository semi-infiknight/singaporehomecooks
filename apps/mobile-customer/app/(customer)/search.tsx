import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCButton,
  SHCButtonText,
  GourmeatSearchBar,
  SHCDishCard,
  SHCSearchResultsPanel,
  SHCDiscoverFilterSheet,
  useSHCTray,
  type SHCDishCardData,
  shcColors,
  shcSpacing,
  contentPadSafe,
} from '@shc/ui';
import {
  getDishImageUrl,
  filterDiscoverProducts,
  discoverActiveFilterCount,
  clearedDiscoverFilters,
  buildSearchResultGroups,
  type MealTypeId,
  coerceRating,
} from '@shc/utils';
import { useCustomerConfig } from '../../hooks/useCustomerConfig';
import { useProducts, useAddToCart } from '../../hooks/useProducts';
import { useGuestAuthGate } from '../../hooks/useGuestAuthGate';
import { useDiscoverPrefs } from '../../hooks/useDiscoverPrefs';
import { VirtualDishGridFlashList } from '../../components/VirtualLists';
import { useQuery } from '@tanstack/react-query';
import { getCooks } from '../../lib/api-client';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { openTray, dismiss } = useSHCTray();
  const [q, setQ] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [mealType, setMealType] = useState<MealTypeId>('all');
  const {
    halalOnly,
    maxCal,
    vegetarianOnly,
    veganOnly,
    chickenOnly,
    excludeNuts,
    toggleHalalOnly,
    toggleLight,
    setMaxCal,
    toggleVegetarianOnly,
    toggleVeganOnly,
    toggleChickenOnly,
    toggleExcludeNuts,
  } = useDiscoverPrefs();
  const router = useRouter();
  const { data: rawResults = [] } = useProducts('');
  const { data: cooks } = useQuery({ queryKey: ['cooks'], queryFn: getCooks, staleTime: 60_000 });
  const addMut = useAddToCart();
  const { requireAuth } = useGuestAuthGate();
  const { categories, config: browseConfig } = useCustomerConfig();

  const filters = useMemo(
    () => ({
      mealType,
      cuisine,
      halalOnly,
      vegetarianOnly,
      veganOnly,
      includeIngredient: chickenOnly ? 'chicken' : undefined,
      excludeNuts,
      maxCal,
    }),
    [mealType, cuisine, halalOnly, vegetarianOnly, veganOnly, chickenOnly, excludeNuts, maxCal]
  );
  const activeFilterCount = discoverActiveFilterCount(filters);

  const results = useMemo(
    () =>
      filterDiscoverProducts(rawResults as Record<string, unknown>[], {
        query: q,
        cuisine: cuisine || undefined,
        mealType: mealType !== 'all' ? mealType : undefined,
        halalOnly: halalOnly || undefined,
        vegetarianOnly: vegetarianOnly || undefined,
        veganOnly: veganOnly || undefined,
        includeIngredient: chickenOnly ? 'chicken' : undefined,
        excludeNuts: excludeNuts || undefined,
        maxCal,
      }),
    [rawResults, q, cuisine, mealType, halalOnly, vegetarianOnly, veganOnly, chickenOnly, excludeNuts, maxCal]
  );

  const goProduct = useCallback((id: string) => router.push(`/(customer)/product/${id}` as any), [router]);

  const toDish = useCallback(
    (p: Record<string, unknown>): SHCDishCardData => ({
      id: String(p.id),
      name: String(p.name),
      cook_name: String(p.cook_name || ''),
      price: Number(p.price),
      cuisine: p.cuisine ? String(p.cuisine) : undefined,
      rating: coerceRating(p.rating),
      cook_id: p.cook_id ? String(p.cook_id) : undefined,
      cook_slug: p.cook_slug ? String(p.cook_slug) : undefined,
      area: p.area ? String(p.area) : p.cook_area ? String(p.cook_area) : undefined,
      kitchenCount: p.kitchenCount != null ? Number(p.kitchenCount) : undefined,
      kitchenLabel: p.kitchenLabel ? String(p.kitchenLabel) : undefined,
      image_url: getDishImageUrl({
        id: String(p.id),
        cuisine: p.cuisine ? String(p.cuisine) : undefined,
        name: String(p.name),
        image_url: p.image_url as string | undefined,
      }),
    }),
    []
  );

  const searchGroups = useMemo(() => {
    if (!q.trim()) return { kitchens: [], dishes: [] as ReturnType<typeof buildSearchResultGroups>['dishes'] };
    const cookList = (cooks as any[]) || [];
    const byName = new Map(
      cookList.map((c) => [
        String(c.display_name || c.name || '').toLowerCase(),
        { slug: c.slug, id: c.id, area: c.area },
      ])
    );
    const inputs = results.map((p) => {
      const cookName = String(p.cook_name || '');
      const hit = byName.get(cookName.toLowerCase()) as { slug?: string; id?: string; area?: string } | undefined;
      return {
        id: String(p.id),
        name: String(p.name),
        cook_name: cookName,
        cook_id: p.cook_id ? String(p.cook_id) : hit?.id ? String(hit.id) : undefined,
        cook_slug: p.cook_slug
          ? String(p.cook_slug)
          : hit?.slug
            ? String(hit.slug)
            : hit?.id
              ? String(hit.id)
              : undefined,
        price: Number(p.price),
        cuisine: p.cuisine ? String(p.cuisine) : undefined,
        area: p.area ? String(p.area) : hit?.area ? String(hit.area) : undefined,
        image_url: getDishImageUrl({
          id: String(p.id),
          cuisine: p.cuisine ? String(p.cuisine) : undefined,
          name: String(p.name),
          image_url: p.image_url as string | undefined,
        }),
        rating: coerceRating(p.rating),
      };
    });
    return buildSearchResultGroups(inputs, q);
  }, [results, q, cooks]);


  const cuisineOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.label || 'All' })),
    [categories]
  );

  const clearFilters = useCallback(() => {
    const cleared = clearedDiscoverFilters();
    setMealType(cleared.mealType);
    setCuisine(cleared.cuisine);
    if (halalOnly) toggleHalalOnly();
    if (vegetarianOnly) toggleVegetarianOnly();
    if (veganOnly) toggleVeganOnly();
    if (chickenOnly) toggleChickenOnly();
    if (excludeNuts) toggleExcludeNuts();
    if (maxCal != null) setMaxCal(undefined);
  }, [halalOnly, vegetarianOnly, veganOnly, chickenOnly, excludeNuts, maxCal, toggleHalalOnly, toggleVegetarianOnly, toggleVeganOnly, toggleChickenOnly, toggleExcludeNuts, setMaxCal]);

  const openFilters = useCallback(() => {
    openTray(
      { id: 'search-filters', title: 'Filters', height: 'tall' },
      () => (
        <SHCDiscoverFilterSheet
          mealTypeChips={browseConfig.meal_type_chips}
          mealType={mealType}
          onMealTypeChange={(id) => setMealType(id as MealTypeId)}
          cuisines={cuisineOptions}
          cuisine={cuisine}
          onCuisineChange={setCuisine}
          halalOnly={halalOnly}
          vegetarianOnly={vegetarianOnly}
          veganOnly={veganOnly}
          chickenOnly={chickenOnly}
          excludeNuts={excludeNuts}
          lightOnly={maxCal != null}
          maxCal={maxCal}
          onToggleHalal={toggleHalalOnly}
          onToggleVegetarian={toggleVegetarianOnly}
          onToggleVegan={toggleVeganOnly}
          onToggleChicken={toggleChickenOnly}
          onToggleExcludeNuts={toggleExcludeNuts}
          onToggleLight={toggleLight}
          onMaxCalChange={setMaxCal}
          onClear={clearFilters}
          onApply={dismiss}
          resultCount={results.length}
          activeCount={activeFilterCount}
          testID="search-filter-sheet"
        />
      )
    );
  }, [
    openTray,
    dismiss,
    mealType,
    cuisineOptions,
    cuisine,
    halalOnly,
    vegetarianOnly,
    maxCal,
    toggleHalalOnly,
    toggleVegetarianOnly,
    toggleLight,
    setMaxCal,
    clearFilters,
    results.length,
    activeFilterCount,
  ]);


  const handleAdd = useCallback(
    (id: string) => {      addMut.mutate({ productId: id, qty: 1 });
    },
    [requireAuth, addMut]
  );

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: contentPadSafe(insets.bottom) }]}
      testID="advanced-search-screen"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Advanced Search</Text>
      </View>

      <GourmeatSearchBar
        value={q}
        onChangeText={setQ}
        placeholder="Search dishes, cooks, under 450 cal…"
        onFilterPress={openFilters}
        filterCount={activeFilterCount}
        testID="search-input"
      />

      <Text style={styles.resultCount}>{results.length} results</Text>

      {q.trim() ? (
        <SHCSearchResultsPanel
          query={q}
          dishes={searchGroups.dishes.map((d) => toDish(d as unknown as Record<string, unknown>))}
          kitchens={searchGroups.kitchens}
          onDishPress={goProduct}
          onKitchenPress={(routeKey) => router.push(`/(customer)/cook/${routeKey}` as any)}
          onAddPress={handleAdd}
          onClose={() => setQ('')}
          onRequestCustom={() => router.push('/(customer)/request' as any)}
        />
      ) : (
        <VirtualDishGridFlashList
          data={results.map((item) => ({ ...item, id: String(item.id) }))}
          renderItem={(item) => (
            <SHCDishCard
              dish={toDish(item)}
              onPress={() => goProduct(String(item.id))}
              onAddPress={() => handleAdd(String(item.id))}
            />
          )}
        />
      )}

      <SHCButton variant="outline" onPress={() => router.back()} style={{ marginTop: shcSpacing.lg }}>
        <SHCButtonText>Back</SHCButtonText>
      </SHCButton>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: shcColors.background, paddingHorizontal: shcSpacing.md },
  header: { marginBottom: shcSpacing.sm },
  title: { fontSize: 24, fontWeight: '900', color: shcColors.text },
  resultCount: { fontSize: 13, fontWeight: '700', color: shcColors.textLight, marginVertical: shcSpacing.sm },
});
