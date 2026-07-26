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
  getOccasionImageUrl,
  filterDiscoverProducts,
  discoverActiveFilterCount,
  clearedDiscoverFilters,
  MEAL_TYPE_CHIPS,
  MIND_CUISINE_CATEGORIES,
  type MealTypeId,
  coerceRating,
} from '@shc/utils';
import {
  SHCButton,
  GourmeatDishCard,
  GourmeatSearchBar,
  SearchResultsPanel,
  FilterChipRow,
  MindSectionTitle,
  SHCSkeletonList,
  DiscoverFilterSheet,
  type DishCardProduct,
} from '../components/SHCWebComponents';
import { VirtualDishGrid } from '../components/VirtualLists';

export default function SearchPage() {
  const router = useRouter();
  const { requireAuth } = useGuestAuthGate();
  const [q, setQ] = useState('');
  const [occ, setOcc] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [mealType, setMealType] = useState<MealTypeId>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { halalOnly, maxCal, vegetarianOnly, toggleHalalOnly, toggleLight, toggleVegetarianOnly } = useDiscoverPrefs();
  const { data: products = [], isLoading } = useProducts('');
  const addMut = useAddToCart();
  const { toggle, isFavorite } = useFavorites();

  const filters = useMemo(
    () => ({ mealType, cuisine, halalOnly, vegetarianOnly, maxCal }),
    [mealType, cuisine, halalOnly, vegetarianOnly, maxCal]
  );
  const activeFilterCount = discoverActiveFilterCount(filters);

  const results = useMemo(() => {
    return filterDiscoverProducts(products as Record<string, unknown>[], {
      query: q,
      occasion: occ || undefined,
      cuisine: cuisine || undefined,
      mealType: mealType !== 'all' ? mealType : undefined,
      halalOnly: halalOnly || undefined,
      vegetarianOnly: vegetarianOnly || undefined,
      maxCal,
    }) as DishCardProduct[];
  }, [products, q, cuisine, occ, mealType, halalOnly, vegetarianOnly, maxCal]);

  const clearFilters = useCallback(() => {
    const cleared = clearedDiscoverFilters();
    setMealType(cleared.mealType);
    setCuisine(cleared.cuisine);
    if (halalOnly) toggleHalalOnly();
    if (vegetarianOnly) toggleVegetarianOnly();
    if (maxCal != null) toggleLight();
  }, [halalOnly, vegetarianOnly, maxCal, toggleHalalOnly, toggleVegetarianOnly, toggleLight]);

  const cuisineOptions = useMemo(
    () => [{ id: '', label: 'All' }, ...MIND_CUISINE_CATEGORIES.filter((c) => c.id).map((c) => ({ id: c.id, label: c.label }))],
    []
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

  const occasionChips = [
    { id: 'any', label: 'Any', imageUrl: getOccasionImageUrl(''), active: !occ },
    { id: 'raya', label: 'Hari Raya', imageUrl: getOccasionImageUrl('Hari Raya'), active: occ === 'Hari Raya' },
    { id: 'cny', label: 'CNY', imageUrl: getOccasionImageUrl('Chinese New Year'), active: occ === 'Chinese New Year' },
    { id: 'family', label: 'Family', imageUrl: getOccasionImageUrl('Family Gathering'), active: occ === 'Family Gathering' },
    { id: 'xmas', label: 'Christmas', imageUrl: getOccasionImageUrl('Christmas'), active: occ === 'Christmas' },
  ];

  const handleOccasion = (id: string) => {
    const map: Record<string, string> = {
      any: '',
      raya: 'Hari Raya',
      cny: 'Chinese New Year',
      family: 'Family Gathering',
      xmas: 'Christmas',
    };
    setOcc(map[id] ?? '');
  };

  const handleAdd = (id: string) => {
    if (!requireAuth('Browse freely — sign in to add dishes to your cart.', '/search')) return;
    addMut.mutate({ productId: id, qty: 1 });
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
        placeholder="Search dishes, cooks…"
        testID="search-input"
        onFilterPress={() => setFiltersOpen(true)}
        filterCount={activeFilterCount}
      />

      <MindSectionTitle testID="search-occasion-title">Occasion</MindSectionTitle>
      <FilterChipRow chips={occasionChips} onChipClick={handleOccasion} testID="search-occasion-chips" />

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
        mealTypeChips={MEAL_TYPE_CHIPS}
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
        resultCount={results.length}
        activeCount={activeFilterCount}
        testID="search-filter-sheet"
      />
    </div>
  );
}
