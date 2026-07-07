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

  GourmeatScreenHeader,

  GourmeatSearchBar,

  FilterChipRow,

  SearchResultsDropdown,

  SHCSkeletonGrid,

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



  const filterChips = [

    ...occasions.map((o) => ({

      id: o.id || 'all',

      label: o.id ? o.chipLabel : t('search.all_occasions'),

      active: occ === o.id,

    })),

    { id: 'halal', label: t('filter.halal'), active: halalOnly, testID: 'halal-filter' },

    { id: 'light', label: t('filter.light'), active: maxCal === 500 },

  ];



  return (

    <div className="max-w-3xl mx-auto px-4 py-8 pb-28">

      <GourmeatScreenHeader

        title={t('search.title')}

        subtitle={t('search.subtitle').replace('{name}', user?.name || listCopy.guest)}

        backHref="/"

        backLabel={t('search.discover_home')}

      />



      <GourmeatSearchBar

        value={q}

        onChange={setQ}

        placeholder={t('nav.search_placeholder_mobile')}

        testID="search-input"

      />



      {q.trim() && (

        <div className="relative mb-4">

          <SearchResultsDropdown

            query={q}

            products={results}

            onAdd={(id) => addMut.mutate({ productId: id, qty: 1 })}

            onClear={() => setQ('')}

            inline

          />

        </div>

      )}



      <FilterChipRow

        chips={filterChips}

        onChipClick={(id) => {

          if (id === 'halal') toggleHalalOnly();

          else if (id === 'light') toggleLight();

          else if (id === 'all') setOcc('');

          else setOcc(id);

        }}

        testID="search-filter-chips"

      />



      <p className="text-sm font-bold text-muted-foreground mb-3">

        {isLoading ? t('orders.loading') : t('search.results_count').replace('{count}', String(results.length))}

      </p>



      {isLoading ? (

        <SHCSkeletonGrid count={6} appearance="customer" />

      ) : (

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="search-results-grid">

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



      <div className="mt-6 flex gap-3 items-center">

        <GourmeatPrimaryButton label={t('search.back')} variant="outline" onClick={() => router.back()} />

        <Link href="/" className="text-sm font-semibold text-primary">

          {t('search.discover_home')}

        </Link>

      </div>

    </div>

  );

}

