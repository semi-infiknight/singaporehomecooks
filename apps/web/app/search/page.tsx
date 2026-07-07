'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProducts, useAddToCart } from '../../lib/useProducts';
import { useAuth } from '../../lib/useAuth';
import { useDiscoverPrefs } from '../../lib/useDiscoverPrefs';
import { useFavorites } from '../../lib/useFavorites';
import { filterDiscoverProducts } from '@shc/utils';
import { useShcI18n, getLocalizedOccasions, getOrdersListCopy } from '@shc/i18n';
import {
  GourmeatDishCard,
  GourmeatPrimaryButton,
  SHCPageHeader,
  SearchResultsDropdown,
  type DishCardProduct,
} from '../components/SHCWebComponents';

export default function SearchPage() {
  const { t, locale } = useShcI18n();
  const listCopy = getOrdersListCopy(locale);
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [occ, setOcc] = useState('');
  const { halalOnly, maxCal, toggleHalalOnly, toggleLight } = useDiscoverPrefs();
  const { data: products = [], isLoading } = useProducts('');
  const addMut = useAddToCart();
  const { toggle, isFavorite } = useFavorites();
  const occasions = getLocalizedOccasions(locale).filter((o) =>
    ['', 'Hari Raya', 'Deepavali', 'Chinese New Year'].includes(o.id)
  );

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
      <SHCPageHeader
        title={t('search.title')}
        subtitle={t('search.subtitle').replace('{name}', user?.name || listCopy.guest)}
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('nav.search_placeholder_mobile')}
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
        {occasions.map((o) => (
          <button
            key={o.id || 'all'}
            type="button"
            onClick={() => setOcc(o.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${occ === o.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
          >
            {o.id ? o.chipLabel : t('search.all_occasions')}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleHalalOnly}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${halalOnly ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
          data-testid="halal-filter"
        >
          {t('filter.halal')}
        </button>
        <button
          type="button"
          onClick={toggleLight}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${maxCal === 500 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
        >
          {t('filter.light')}
        </button>
      </div>

      <p className="text-sm font-bold text-muted-foreground mb-3">
        {isLoading ? t('orders.loading') : t('search.results_count').replace('{count}', String(results.length))}
      </p>

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

      <div className="mt-6 flex gap-3 items-center">
        <GourmeatPrimaryButton label={t('search.back')} variant="outline" onClick={() => router.back()} />
        <Link href="/" className="text-sm font-semibold text-primary">
          {t('search.discover_home')}
        </Link>
      </div>
    </div>
  );
}
