import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCButton,
  SHCButtonText,
  GourmeatSearchBar,
  SHCFilterChipRow,
  SHCDishCard,
  SHCSearchResultsPanel,
  SHCMindSectionTitle,
  SHCDiscoverFilterSheet,
  useSHCTray,
  type SHCDishCardData,
  shcColors,
  shcSpacing,
  contentPadSafe,
} from '@shc/ui';
import {
  getDishImageUrl,
  getOccasionImageUrl,
  filterDiscoverProducts,
  discoverActiveFilterCount,
  clearedDiscoverFilters,
  customerOccasionCategories,
  type MealTypeId,
  coerceRating,
} from '@shc/utils';
import { useCustomerConfig } from '../../hooks/useCustomerConfig';
import { useProducts, useAddToCart } from '../../hooks/useProducts';
import { useGuestAuthGate } from '../../hooks/useGuestAuthGate';
import { useDiscoverPrefs } from '../../hooks/useDiscoverPrefs';
import { VirtualDishGridFlashList } from '../../components/VirtualLists';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { openTray, dismiss } = useSHCTray();
  const [q, setQ] = useState('');
  const [occ, setOcc] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [mealType, setMealType] = useState<MealTypeId>('all');
  const { halalOnly, maxCal, vegetarianOnly, toggleHalalOnly, toggleLight, toggleVegetarianOnly } = useDiscoverPrefs();
  const router = useRouter();
  const { data: rawResults = [] } = useProducts('');
  const addMut = useAddToCart();
  const { requireAuth } = useGuestAuthGate();
  const { categories, config: browseConfig } = useCustomerConfig();

  const filters = useMemo(
    () => ({ mealType, cuisine, halalOnly, vegetarianOnly, maxCal }),
    [mealType, cuisine, halalOnly, vegetarianOnly, maxCal]
  );
  const activeFilterCount = discoverActiveFilterCount(filters);

  const results = useMemo(
    () =>
      filterDiscoverProducts(rawResults as Record<string, unknown>[], {
        query: q,
        occasion: occ || undefined,
        cuisine: cuisine || undefined,
        mealType: mealType !== 'all' ? mealType : undefined,
        halalOnly: halalOnly || undefined,
        vegetarianOnly: vegetarianOnly || undefined,
        maxCal,
      }),
    [rawResults, q, cuisine, occ, mealType, halalOnly, vegetarianOnly, maxCal]
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
      image_url: getDishImageUrl({
        id: String(p.id),
        cuisine: p.cuisine ? String(p.cuisine) : undefined,
        name: String(p.name),
        image_url: p.image_url as string | undefined,
      }),
    }),
    []
  );

  const occasionChips = useMemo(() => {
    const opts = browseConfig.occasions.filter((o) => o.enabled);
    return [
      { id: 'any', label: 'Any', imageUrl: getOccasionImageUrl(''), active: !occ },
      ...opts.map((o) => ({
        id: o.id,
        label: o.short_label || o.label,
        imageUrl: o.image_url || getOccasionImageUrl(o.id),
        active: occ === o.id,
      })),
    ];
  }, [browseConfig.occasions, occ]);

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
    if (maxCal != null) toggleLight();
  }, [halalOnly, vegetarianOnly, maxCal, toggleHalalOnly, toggleVegetarianOnly, toggleLight]);

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
          lightOnly={maxCal != null}
          onToggleHalal={toggleHalalOnly}
          onToggleVegetarian={toggleVegetarianOnly}
          onToggleLight={toggleLight}
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
    clearFilters,
    results.length,
    activeFilterCount,
  ]);

  const handleOccasion = useCallback((id: string) => {
    setOcc(id === 'any' ? '' : id);
  }, []);

  const handleAdd = useCallback(
    (id: string) => {
      if (!requireAuth('Browse freely — sign in to add dishes to your cart.')) return;
      addMut.mutate({ productId: id, qty: 1 });
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
        placeholder="Search dishes, cooks…"
        onFilterPress={openFilters}
        filterCount={activeFilterCount}
        testID="search-input"
      />

      <SHCMindSectionTitle testID="search-occasion-title">Occasion</SHCMindSectionTitle>
      <SHCFilterChipRow chips={occasionChips} onChipPress={handleOccasion} testID="search-occasion-chips" />

      <Text style={styles.resultCount}>{results.length} results</Text>

      {q.trim() ? (
        <SHCSearchResultsPanel
          query={q}
          dishes={results.map(toDish)}
          onDishPress={goProduct}
          onAddPress={handleAdd}
          onClose={() => setQ('')}
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
