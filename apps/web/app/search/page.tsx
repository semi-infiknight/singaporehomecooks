'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { useProducts, useAddToCart } from '../../lib/useProducts';
import { useAuth } from '../../lib/useAuth';
import { useGuestAuthGate } from '../../lib/useGuestAuthGate';
import { useDiscoverPrefs } from '../../lib/useDiscoverPrefs';
import { useFavorites } from '../../lib/useFavorites';
import { getDishImageUrl, getOccasionImageUrl, productMatchesOccasion } from '@shc/utils';
import {
  SHCButton,
  GourmeatDishCard,
  GourmeatSearchBar,
  SearchResultsPanel,
  FilterChipRow,
  MindSectionTitle,
  SHCSkeletonList,
  type DishCardProduct,
} from '../components/SHCWebComponents';
import { VirtualDishGrid } from '../components/VirtualLists';

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { requireAuth } = useGuestAuthGate();
  const [q, setQ] = useState('');
  const [occ, setOcc] = useState('');
  const [cuisine, setCuisine] = useState('');
  const { halalOnly, maxCal, toggleHalalOnly, toggleLight, setMaxCal } = useDiscoverPrefs();
  const maxC = maxCal ?? 700;
  const { data: products = [], isLoading } = useProducts('');
  const addMut = useAddToCart();
  const { toggle, isFavorite } = useFavorites();

  const results = useMemo(() => {
    let list = products as Record<string, unknown>[];
    const ql = q.trim().toLowerCase();
    if (ql) {
      list = list.filter((p) => {
        const name = String(p.name || '').toLowerCase();
        const cook = String(p.cook_name || '').toLowerCase();
        const cuisineName = String(p.cuisine || '').toLowerCase();
        return (
          name.includes(ql) ||
          cook.includes(ql) ||
          cuisineName.includes(ql) ||
          String(p.id || '').toLowerCase().includes(ql)
        );
      });
    }
    if (cuisine) list = list.filter((p) => String(p.cuisine || '').toLowerCase().includes(cuisine.toLowerCase()));
    if (occ) list = list.filter((p) => productMatchesOccasion(p.occasion_tags as string[] | undefined, occ));
    if (halalOnly) list = list.filter((p) => Boolean(p.halal));
    if (maxC != null) list = list.filter((p) => ((p.calories as number) || 999) <= maxC);
    return list as DishCardProduct[];
  }, [products, q, cuisine, occ, halalOnly, maxC]);

  const searchDishes = useMemo(
    () =>
      results.map((p) => ({
        id: p.id,
        name: p.name,
        cook_name: p.cook_name || '',
        price: Number(p.price || 0),
        cuisine: p.cuisine,
        rating: p.rating != null ? Number(p.rating) : 4.8,
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

  const filterChips = [
    { id: 'halal', label: 'Halal', iconKey: 'halal' as const, active: halalOnly, testID: 'halal-filter' },
    { id: 'peranakan', label: 'Peranakan', iconKey: 'filters' as const, active: cuisine === 'Peranakan' },
    { id: 'eurasian', label: 'Eurasian', iconKey: 'filters' as const, active: cuisine === 'Eurasian' },
    { id: 'light', label: 'Light (<500 cal)', iconKey: 'light' as const, active: maxCal === 500 },
    { id: 'moderate', label: '≤550 cal', iconKey: 'moderate' as const, active: maxCal === 550 },
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

  const handleFilter = (id: string) => {
    if (id === 'halal') toggleHalalOnly();
    else if (id === 'peranakan') setCuisine(cuisine === 'Peranakan' ? '' : 'Peranakan');
    else if (id === 'eurasian') setCuisine(cuisine === 'Eurasian' ? '' : 'Eurasian');
    else if (id === 'light') setMaxCal(maxCal === 500 ? undefined : 500);
    else if (id === 'moderate') setMaxCal(maxCal === 550 ? undefined : 550);
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

      <GourmeatSearchBar value={q} onChange={setQ} placeholder="Search dishes, cooks…" testID="search-input" />

      <MindSectionTitle testID="search-occasion-title">Occasion</MindSectionTitle>
      <FilterChipRow chips={occasionChips} onChipClick={handleOccasion} testID="search-occasion-chips" />

      <MindSectionTitle testID="search-filters-title">Filters</MindSectionTitle>
      <FilterChipRow chips={filterChips} onChipClick={handleFilter} testID="search-filter-chips" />

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
    </div>
  );
}
