'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProducts, useAddToCart } from '../lib/useProducts';
import { useOrders } from '../lib/useOrder';
import { useAuth } from '../lib/useAuth';
import { useDiscoverSearch } from './providers';
import {
  extractReorderDishes,
  getActiveOrders,
  getOrderStatusLabel,
  favoritesToReorderDishes,
  getOccasionImageUrl,
  getCookAvatarUrl,
  MIND_CUISINE_CATEGORIES,
  sortByCookProximity,
  filterDiscoverProducts,
} from '@shc/utils';
import { useFavorites } from '../lib/useFavorites';
import { useCustomerLocation } from '../lib/useCustomerLocation';
import { useDiscoverPrefs } from '../lib/useDiscoverPrefs';
import {
  SHCButton,
  SHCSkeletonGrid,
  SHCEmptyState,
  GuestBrowseBar,
  ActiveOrderBanner,
  DishRowRail,
  GourmeatHomeHeader,
  GourmeatSearchBar,
  GourmeatCategoryRow,
  GourmeatDishCard,
  GourmeatSectionTitle,
  FilterChipRow,
  SearchResultsPanel,
  PromoRail,
  RequestDishHomeCTA,
  type DishCardProduct,
} from './components/SHCWebComponents';

const occasions = [
  { id: '', label: 'All' },
  ...['Hari Raya', 'Deepavali', 'Chinese New Year', 'Family Gathering', 'Birthday', 'Christmas'].map((o) => ({
    id: o,
    label: o === 'Chinese New Year' ? 'CNY' : o === 'Family Gathering' ? 'Family' : o.split(' ')[0],
    imageUrl: getOccasionImageUrl(o),
  })),
];

function toDishCard(product: DishCardProduct): DishCardProduct & { rating?: number } {
  return {
    ...product,
    rating: product.rating != null ? Number(product.rating) : 4.8,
  };
}

export default function DiscoverHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { query, setQuery } = useDiscoverSearch();
  const [occasionFilter, setOccasionFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const { data: products = [], isLoading } = useProducts('');
  const { data: orders = [] } = useOrders();
  const { favorites, toggle, isFavorite } = useFavorites();
  const { active: collectionLocation, locationLabel } = useCustomerLocation();
  const { halalOnly, maxCal, toggleHalalOnly, toggleLight } = useDiscoverPrefs();
  const addMut = useAddToCart();
  const activeOrder = useMemo(() => getActiveOrders(orders as Record<string, unknown>[])[0], [orders]);

  const productList = products as DishCardProduct[];

  const filteredProducts = useMemo(() => {
    const list = filterDiscoverProducts(productList as Record<string, unknown>[], {
      query,
      occasion: occasionFilter || undefined,
      cuisine: cuisineFilter || undefined,
      halalOnly: halalOnly || undefined,
      maxCal,
    });
    return sortByCookProximity(
      list as Array<DishCardProduct & { cook_area?: string; area?: string }>,
      collectionLocation
    ) as DishCardProduct[];
  }, [productList, query, cuisineFilter, occasionFilter, halalOnly, maxCal, collectionLocation]);

  const gridProducts = useMemo(() => (query.trim() ? [] : filteredProducts), [filteredProducts, query]);

  const searchDishes = useMemo(() => {
    if (!query.trim()) return [];
    return filteredProducts.map((p) => toDishCard(p));
  }, [filteredProducts, query]);

  const savedDishes = useMemo(() => {
    if (query.trim()) return [];
    return favoritesToReorderDishes(favorites).map((d) => toDishCard({
      id: d.id,
      name: d.name,
      cook_name: d.cook_name || '',
      price: d.price,
      cuisine: d.cuisine,
    })) as DishCardProduct[];
  }, [favorites, query]);

  const reorderDishes = useMemo(() => {
    if (query.trim()) return [];
    const items = extractReorderDishes(orders as Record<string, unknown>[]);
    return items.map((d) => toDishCard({
      id: d.id,
      name: d.name,
      cook_name: d.cook_name || '',
      price: d.price,
      cuisine: d.cuisine,
    })) as DishCardProduct[];
  }, [orders, query]);

  const cuisineItems = MIND_CUISINE_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    imageUrl: c.imageUrl,
  }));

  const headerLocation = collectionLocation ? locationLabel : 'Set collection location';
  const isGuest = !user;

  const goToProduct = useCallback((id: string) => router.push(`/product/${id}`), [router]);

  const handleAddToCart = useCallback(
    (productId: string, qty = 1) => {
      if (!user) {
        router.push('/login');
        return;
      }
      addMut.mutate({ productId, qty });
    },
    [addMut, router, user]
  );

  const handleFavorite = useCallback(
    (item: DishCardProduct) => {
      toggle({
        id: item.id,
        name: item.name,
        cook_name: item.cook_name || '',
        price: Number(item.price || 0),
        cuisine: item.cuisine,
      });
    },
    [toggle]
  );

  return (
    <section id="discover" className="max-w-6xl mx-auto px-4 py-4 md:py-6 pb-28 md:pb-8" data-testid="customer-discover-screen">
      <GourmeatHomeHeader
        headline="Hungry? Order & Eat."
        locationLabel={headerLocation}
        locationHint="Collect from"
        avatarUri={user?.name ? getCookAvatarUrl(user.id, user.name) : undefined}
        locationHref="/location"
      />

      <GourmeatSearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search dishes, cooks, occasions…"
        onFilterPress={() => router.push('/search')}
      />

      {query.trim().length > 0 && (
        <SearchResultsPanel
          query={query}
          dishes={searchDishes}
          onDishPress={goToProduct}
          onAddPress={(id) => handleAddToCart(id, 1)}
          onClose={() => setQuery('')}
        />
      )}

      {isGuest && <GuestBrowseBar onSignInClick={() => router.push('/login')} />}

      {!query.trim() && (
        <div className="shc-section-gap mb-4">
          <PromoRail
            onPromoClick={(id) => {
              if (id === 'promo-raya') setOccasionFilter('Hari Raya');
              else if (id === 'promo-credits') router.push('/profile');
              else if (id === 'promo-paynow') router.push('/content/trust');
            }}
          />
        </div>
      )}

      <FilterChipRow
        chips={[
          { id: 'halal', label: 'Halal', active: halalOnly },
          { id: 'light', label: 'Light (<500 cal)', active: maxCal === 500 },
        ]}
        onChipClick={(id) => {
          if (id === 'halal') toggleHalalOnly();
          if (id === 'light') toggleLight();
        }}
        testID="discover-filter-chips"
      />

      {activeOrder && (
        <div className="mb-3">
          <ActiveOrderBanner
            statusLabel={getOrderStatusLabel(String(activeOrder.shc_status || ''))}
            dishName={String((activeOrder.items as any[])?.[0]?.name || '')}
            collectionLabel={
              activeOrder.collection_date
                ? `${activeOrder.collection_date} ${activeOrder.collection_slot || ''}`
                : undefined
            }
            href={`/orders/${activeOrder.id}`}
          />
        </div>
      )}

      {collectionLocation && (
        <p className="text-xs font-bold text-primary mb-2">
          Showing cooks near your collection point first
        </p>
      )}

      <GourmeatSectionTitle title="Categories" actionLabel="See all" actionHref="/search" />
      <div className="shc-section-gap">
        <GourmeatCategoryRow items={occasions} active={occasionFilter} onSelect={setOccasionFilter} />
      </div>

      {!query.trim() && reorderDishes.length > 0 && (
        <div className="shc-section-gap">
          <GourmeatSectionTitle title="Order again" />
          <DishRowRail title="" products={reorderDishes} />
        </div>
      )}

      {!query.trim() && savedDishes.length > 0 && (
        <div className="shc-section-gap">
          <GourmeatSectionTitle title="Saved for you" />
          <DishRowRail title="" products={savedDishes} />
        </div>
      )}

      <GourmeatSectionTitle title="Explore cuisines" />
      <div className="shc-section-gap">
        <GourmeatCategoryRow items={cuisineItems} active={cuisineFilter} onSelect={setCuisineFilter} testID="cuisine-gourmeat-row" />
      </div>

      <GourmeatSectionTitle
        title={occasionFilter ? `${occasionFilter.split(' ')[0]} dishes` : 'Popular near you'}
        testID="all-dishes-header"
      />

      {isLoading && <SHCSkeletonGrid />}
      {!isLoading && gridProducts.length === 0 && !query.trim() && (
        <SHCEmptyState
          title="No dishes match your search"
          description="Try a different category or clear your filters."
          action={
            <SHCButton
              variant="outline"
              onClick={() => {
                setQuery('');
                setOccasionFilter('');
                setCuisineFilter('');
              }}
            >
              Clear filters
            </SHCButton>
          }
        />
      )}

      {!isLoading && gridProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-3" data-testid="dish-list-container">
          {gridProducts.map((p) => (
            <GourmeatDishCard
              key={p.id}
              product={p}
              isFavorite={isFavorite(p.id)}
              onFavoritePress={() => handleFavorite(p)}
              onAddPress={() => handleAddToCart(p.id, 1)}
            />
          ))}
        </div>
      )}

      {!query.trim() && <RequestDishHomeCTA />}

      <div className="mt-8 text-center md:block hidden">
        <Link href="/content/trust" className="text-xs text-primary font-semibold hover:underline">
          Trust &amp; Safety →
        </Link>
      </div>
    </section>
  );
}