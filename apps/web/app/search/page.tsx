'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProducts, useAddToCart } from '../../lib/useProducts';
import { useAuth } from '../../lib/useAuth';
import { useDiscoverPrefs } from '../../lib/useDiscoverPrefs';
import { useFavorites } from '../../lib/useFavorites';
import { filterDiscoverProducts } from '@shc/utils';
import {
  SHCButton,
  SHCPageHeader,
  GourmeatDishCard,
  SearchResultsDropdown,
  SHCSkeletonList,
  type DishCardProduct,
} from '../components/SHCWebComponents';

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [occ, setOcc] = useState('');
  const { halalOnly, maxCal, toggleHalalOnly, toggleLight } = useDiscoverPrefs();
  const { data: products = [], isLoading } = useProducts('');
  const addMut = useAddToCart();
  const { toggle, isFavorite } = useFavorites();

  const results = useMemo(
    () =>
      filterDiscoverProducts(products as Record<string, unknown>[], {
        query: q,
        occasion: occ || undefined,
        halalOnly: halalOnly || undefined,
        maxCal,
      }) as DishCardProduct[],
    [products, q, occ, halalOnly, maxCal]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-28">
      <SHCPageHeader title="Advanced Search" subtitle={`${user?.name || 'Guest'} · filters & ADD`} />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search dishes, cooks…"
        className="w-full px-4 py-3 rounded-full bg-card border border-border shadow-[var(--shc-shadow-soft)] text-sm font-medium mb-4"
        data-testid="search-input"
      />

      {q.trim() && (
        <div className="relative mb-4">
          <SearchResultsDropdown
            query={q}
            products={results}
            onAdd={(id) => addMut.mutate({ productId: id, qty: 1 })}
            onClear={() => setQ('')}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {['', 'Hari Raya', 'Deepavali', 'Chinese New Year'].map((o) => (
          <button
            key={o || 'all'}
            type="button"
            onClick={() => setOcc(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${occ === o ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
          >
            {o || 'All occasions'}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleHalalOnly}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${halalOnly ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
          data-testid="halal-filter"
        >
          Halal
        </button>
        <button
          type="button"
          onClick={toggleLight}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${maxCal === 500 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
        >
          Light (&lt;500 cal)
        </button>
      </div>

      <p className="text-sm font-bold text-muted-foreground mb-3">
        {isLoading ? 'Searching catalogue…' : `${results.length} results`}
      </p>

      {isLoading ? (
        <div data-testid="search-skeleton">
          <SHCSkeletonList count={6} rowHeight={140} />
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {results.map((p) => (
          <GourmeatDishCard
            key={p.id}
            product={p}
            isFavorite={isFavorite(p.id)}
            onFavoritePress={() =>
              toggle({
                id: p.id,
                name: p.name,
                cook_name: p.cook_name || '',
                price: Number(p.price || 0),
                cuisine: p.cuisine,
              })
            }
            onAddPress={() => {
              if (!user) router.push('/login');
              else addMut.mutate({ productId: p.id, qty: 1 });
            }}
          />
        ))}
      </div>
      )}

      <div className="mt-6 flex gap-3">
        <SHCButton variant="outline" onClick={() => router.back()}>Back</SHCButton>
        <Link href="/" className="text-sm font-semibold text-primary self-center">Discover home</Link>
      </div>
    </div>
  );
}