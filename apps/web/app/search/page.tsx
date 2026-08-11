'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { useProducts, useAddToCart } from '../../lib/useProducts';
import { useGuestAuthGate } from '../../lib/useGuestAuthGate';
import { useDiscoverPrefs } from '../../lib/useDiscoverPrefs';
import { useFavorites } from '../../lib/useFavorites';
import {
  getDishImageUrl,
  filterDiscoverProducts,
  discoverActiveFilterCount,
  clearedDiscoverFilters,
  type MealTypeId,
  coerceRating,
} from '@shc/utils';
import { useCustomerConfig } from '../../lib/useCustomerConfig';
import {
  SHCButton,
  GourmeatDishCard,
  GourmeatSearchBar,
  SearchResultsPanel,
  SHCSkeletonList,
  DiscoverFilterSheet,
  type DishCardProduct,
} from '../components/SHCWebComponents';
import { VirtualDishGrid } from '../components/VirtualLists';

export default function SearchPage() {
  const router = useRouter();
  const { requireAuth } = useGuestAuthGate();
  const [q, setQ] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [mealType, setMealType] = useState<MealTypeId>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  const { data: products = [], isLoading } = useProducts('');
  const addMut = useAddToCart();
  const { toggle, isFavorite } = useFavorites();

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

  const results = useMemo(() => {
    return filterDiscoverProducts(products as Record<string, unknown>[], {
      query: q,
      cuisine: cuisine || undefined,
      mealType: mealType !== 'all' ? mealType : undefined,
      halalOnly: halalOnly || undefined,
      vegetarianOnly: vegetarianOnly || undefined,
      veganOnly: veganOnly || undefined,
      includeIngredient: chickenOnly ? 'chicken' : undefined,
      excludeNuts: excludeNuts || undefined,
      maxCal,
    }) as DishCardProduct[];
  }, [products, q, cuisine, mealType, halalOnly, vegetarianOnly, veganOnly, chickenOnly, excludeNuts, maxCal]);

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

  const { categories, config: browseConfig } = useCustomerConfig();

  const cuisineOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.label || 'All' })),
    [categories]
  );

  const searchDishes = useMemo(
    () =>
      results.map((p) => ({
        id: p.id,
        name: p.name,
        cook_name: p.cook_name || '',
        price: Number(p.price || 0),
        cuisine: p.cuisine,
        rating: coerceRating(p.rating),
        image_url: getDishImageUrl({ id: p.id, cuisine: p.cuisine, name: p.name }),
      })),
    [results]
  );



  const handleAdd = (id: string) => {    addMut.mutate({ productId: id, qty: 1 });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 shc-tab-bar-pad md:pb-8" data-testid="advanced-search-screen">
      <div className="flex items-center gap-2 mb-4">
        <SearchIcon className="w-6 h-6 text-primary" aria-hidden />
        <h1 className="text-2xl font-black text-foreground">Advanced Search</h1>
      </div>

      <GourmeatSearchBar
        value={q}
        onChange={setQ}
        placeholder="Search dishes, cooks, under 450 cal…"
        testID="search-input"
        onFilterPress={() => setFiltersOpen(true)}
        filterCount={activeFilterCount}
      />

      <p className="text-sm font-bold text-muted-foreground my-3">
        {isLoading ? 'Searching catalogue…' : `${results.length} results`}
      </p>

      {q.trim() ? (
        <SearchResultsPanel
          query={q}
          dishes={searchDishes}
          onDishPress={(id) => router.push(`/product/${id}`)}
          onAddPress={handleAdd}
          onClose={() => setQ('')}
          onRequestCustom={() => router.push('/request')}
        />
      ) : isLoading ? (
        <div data-testid="search-skeleton">
          <SHCSkeletonList count={6} rowHeight={140} />
        </div>
      ) : (
        <VirtualDishGrid
          products={results}
          columns={3}
          isFavorite={isFavorite}
          onFavoritePress={(p) =>
            toggle({
              id: p.id,
              name: p.name,
              cook_name: p.cook_name || '',
              price: Number(p.price || 0),
              cuisine: p.cuisine,
            })
          }
          onAddPress={handleAdd}
        />
      )}

      <SHCButton variant="outline" className="w-full mt-6" onClick={() => router.back()}>
        Back
      </SHCButton>

      <DiscoverFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
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
        resultCount={results.length}
        activeCount={activeFilterCount}
        testID="search-filter-sheet"
      />
    </div>
  );
}
