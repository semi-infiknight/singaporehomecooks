'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Settings2 } from 'lucide-react';
import { useProducts } from '../lib/useProducts';
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
} from '@shc/utils';
import { useFavorites } from '../lib/useFavorites';
import { useCustomerLocation } from '../lib/useCustomerLocation';
import {
  SHCButton,
  SHCSkeletonGrid,
  SHCEmptyState,
  GuestBrowseBar,
  ActiveOrderBanner,
  DishRowRail,
  GourmeatHomeHeader,
  GourmeatCategoryRow,
  GourmeatDishCard,

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

export default function DiscoverHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { query, setQuery } = useDiscoverSearch();
  const [occasionFilter, setOccasionFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const { data: products = [], isLoading } = useProducts(query, {
    occasion: occasionFilter || undefined,
  });
  const { data: orders = [] } = useOrders();
  const { favorites } = useFavorites();
  const { active: collectionLocation, locationLabel } = useCustomerLocation();
  const activeOrder = useMemo(() => getActiveOrders(orders as Record<string, unknown>[])[0], [orders]);

  const savedDishes = useMemo(() => {
    if (query) return [];
    return favoritesToReorderDishes(favorites).map((d) => ({
      id: d.id,
      name: d.name,
      cook_name: d.cook_name || '',
      price: d.price,
      cuisine: d.cuisine,
    })) as DishCardProduct[];
  }, [favorites, query]);

  const productList = products as DishCardProduct[];

  const filteredList = useMemo(() => {
    let list = productList;
    if (cuisineFilter) list = list.filter((p) => p.cuisine === cuisineFilter);
    return sortByCookProximity(
      list as Array<DishCardProduct & { cook_area?: string; area?: string }>,
      collectionLocation
    ) as DishCardProduct[];
  }, [productList, cuisineFilter, collectionLocation]);

  const reorderDishes = useMemo(() => {
    if (query) return [];
    const items = extractReorderDishes(orders as Record<string, unknown>[]);
    return items.map((d) => ({
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

  return (
    <section id="discover" className="max-w-6xl mx-auto px-4 py-4 md:py-6 pb-28 md:pb-8">
      {!user && <GuestBrowseBar onSignInClick={() => router.push('/login')} />}

      <GourmeatHomeHeader
        headline="Hungry? Order & Eat."
        locationLabel={headerLocation}
        locationHint="Collect from"
        avatarUri={user?.name ? getCookAvatarUrl(user.id, user.name) : undefined}
        locationHref="/location"
      />

      <div className="flex gap-2 mb-5">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes, cooks, occasions…"
            className="w-full pl-11 pr-4 py-3 rounded-full bg-card border border-border shadow-[var(--shc-shadow-soft)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="search-input"
          />
        </div>
        <Link
          href="/search"
          className="w-11 h-11 shrink-0 rounded-xl bg-card border border-border shadow-[var(--shc-shadow-soft)] flex items-center justify-center"
          aria-label="Advanced search"
        >
          <Settings2 className="w-5 h-5 text-foreground" />
        </Link>
      </div>

      {!query && (
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

      {activeOrder && (
        <div className="mb-4">
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

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-extrabold text-foreground">Categories</h2>
        <Link href="/search" className="text-sm font-semibold text-primary">See all</Link>
      </div>
      <div className="shc-section-gap">
        <GourmeatCategoryRow items={occasions} active={occasionFilter} onSelect={setOccasionFilter} />
      </div>

      {!query && reorderDishes.length > 0 && (
        <div className="shc-section-gap">
          <h2 className="text-lg font-extrabold text-foreground mb-3">Order again</h2>
          <DishRowRail title="" products={reorderDishes} />
        </div>
      )}

      {!query && savedDishes.length > 0 && (
        <div className="shc-section-gap">
          <h2 className="text-lg font-extrabold text-foreground mb-3">Saved for you</h2>
          <DishRowRail title="" products={savedDishes} />
        </div>
      )}

      <h2 className="text-lg font-extrabold text-foreground mb-3 mt-2">Explore cuisines</h2>
      <div className="shc-section-gap">
        <GourmeatCategoryRow items={cuisineItems} active={cuisineFilter} onSelect={setCuisineFilter} testID="cuisine-gourmeat-row" />
      </div>

      <h2 className="text-lg font-extrabold text-foreground mb-3" data-testid="all-dishes-header">
        {occasionFilter ? `${occasionFilter.split(' ')[0]} dishes` : 'Popular near you'}
      </h2>

      {isLoading && <SHCSkeletonGrid />}
      {!isLoading && filteredList.length === 0 && (
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

      {!isLoading && filteredList.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:gap-4" data-testid="dish-list-container">
          {filteredList.map((p) => (
            <GourmeatDishCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {!query && <RequestDishHomeCTA />}

      <div className="mt-8 text-center">
        <Link href="/content/trust" className="text-xs text-primary font-semibold hover:underline">
          Trust &amp; Safety →
        </Link>
      </div>
    </section>
  );
}