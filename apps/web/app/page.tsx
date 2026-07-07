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
  favoritesToReorderDishes,
  getOccasionImageUrl,
  getCookAvatarUrl,
  getDishImageUrl,
  MIND_CUISINE_CATEGORIES,
  sortByCookProximity,
  filterDiscoverProducts,
  resolveDiscoverProductsForDisplay,
  OFFLINE_DISCOVER_PRODUCT,
  LAUNCH_PLATFORM_COUNTERS,
  type PlatformCounters,
} from '@shc/utils';
import { useFavorites } from '../lib/useFavorites';
import { useCustomerLocation } from '../lib/useCustomerLocation';
import { useDiscoverPrefs } from '../lib/useDiscoverPrefs';
import { useShcI18n, getLocalizedOccasions, getOccasionDishesTitle, getLocalizedOrderStatus, getActiveOrderBannerLabels, getRequestDishCopy, getDiscoverHomeCopy } from '@shc/i18n';
import {
  SHCButton,
  SHCSkeletonGrid,
  SHCEmptyState,
  GuestBrowseBar,
  ActiveOrderBanner,
  ZomatoDishRowRail,
  GourmeatHomeHeader,
  GourmeatSearchBar,
  GourmeatCategoryRow,
  GourmeatDishCard,
  GourmeatSectionTitle,
  FilterChipRow,
  SearchResultsPanel,
  PromoRail,
  RequestDishHomeCTA,
  TrustStrip,
  type DishCardProduct,
} from './components/SHCWebComponents';
import { usePlatformStats } from '../lib/usePlatformStats';

function toDishCard(product: DishCardProduct): DishCardProduct & { rating?: number; image_url?: string } {
  return {
    ...product,
    rating: product.rating != null ? Number(product.rating) : 4.8,
    image_url: getDishImageUrl({ id: product.id, cuisine: product.cuisine, name: product.name }),
  };
}

export default function DiscoverHome() {
  const router = useRouter();
  const { t, locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
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
  const { data: platformStats } = usePlatformStats();
  const counters: PlatformCounters = platformStats?.counters ?? LAUNCH_PLATFORM_COUNTERS;

  const occasions = useMemo(
    () =>
      getLocalizedOccasions(locale).map((o) => ({
        id: o.id,
        label: o.chipLabel,
        imageUrl: getOccasionImageUrl(o.id),
      })),
    [locale]
  );

  const evidenceMode = process.env.NEXT_PUBLIC_FAMILY_VALUES_EVIDENCE === '1';
  const productList = useMemo(
    () => resolveDiscoverProductsForDisplay(products as DishCardProduct[], { evidence: evidenceMode }),
    [products, evidenceMode]
  );

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

  const headerLocation = collectionLocation ? locationLabel : homeCopy.setLocation;
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
    <section id="discover" className="max-w-6xl mx-auto px-4 py-4 md:py-6 pb-28 md:pb-8" data-testid="customer-discover-screen discover-home">
      {/* Mobile: Gourmeat chrome (AppHeader is hidden below md). Desktop: search/location live in AppHeader. */}
      <div className="md:hidden">
        <GourmeatHomeHeader
          headline={homeCopy.headline}
          locationLabel={headerLocation}
          locationHint={homeCopy.collectFrom}
          avatarUri={user?.name ? getCookAvatarUrl(user.id, user.name) : undefined}
          locationHref="/location"
        />
        <GourmeatSearchBar
          value={query}
          onChange={setQuery}
          placeholder={homeCopy.searchPlaceholder}
          onFilterPress={() => router.push('/search')}
        />
      </div>
      <h1 className="hidden md:block text-3xl font-extrabold text-foreground tracking-[-0.5px] mb-4">
        {homeCopy.headline}
      </h1>

      {query.trim().length > 0 && (
        <SearchResultsPanel
          query={query}
          dishes={searchDishes}
          onDishPress={goToProduct}
          onAddPress={(id) => handleAddToCart(id, 1)}
          onClose={() => setQuery('')}
        />
      )}

      {isGuest && (
        <div className="md:hidden">
          <GuestBrowseBar onSignInClick={() => router.push('/login')} />
        </div>
      )}

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

      {!query.trim() && (
        <div className="shc-section-gap mb-4" data-testid="homepage-social-counters">
          <TrustStrip counters={counters} />
        </div>
      )}

      <FilterChipRow
        chips={[
          { id: 'halal', label: t('filter.halal'), active: halalOnly },
          { id: 'light', label: t('filter.light'), active: maxCal === 500 },
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
            statusLabel={getLocalizedOrderStatus(locale, String(activeOrder.shc_status || ''))}
            dishName={String((activeOrder.items as any[])?.[0]?.name || '')}
            collectionLabel={
              activeOrder.collection_date
                ? `${activeOrder.collection_date} ${activeOrder.collection_slot || ''}`
                : undefined
            }
            href={`/orders/${activeOrder.id}`}
            {...getActiveOrderBannerLabels(locale)}
          />
        </div>
      )}

      {collectionLocation && (
        <p className="text-xs font-bold text-primary mb-2">
          {t('discover.near_collection')}
        </p>
      )}

      <GourmeatSectionTitle title={t('discover.categories')} actionLabel={t('discover.see_all')} actionHref="/search" />
      <div className="shc-section-gap">
        <GourmeatCategoryRow items={occasions} active={occasionFilter} onSelect={setOccasionFilter} />
      </div>

      {!query.trim() && reorderDishes.length > 0 && (
        <div className="shc-section-gap">
          <GourmeatSectionTitle title={t('discover.order_again')} />
          <ZomatoDishRowRail title="" products={reorderDishes} onDishPress={goToProduct} testID="order-again-rail" />
        </div>
      )}

      {!query.trim() && savedDishes.length > 0 && (
        <div className="shc-section-gap">
          <GourmeatSectionTitle title={t('discover.saved_for_you')} />
          <ZomatoDishRowRail title="" products={savedDishes} onDishPress={goToProduct} testID="saved-dishes-rail" />
        </div>
      )}

      <GourmeatSectionTitle title={t('discover.explore_cuisines')} />
      <div className="shc-section-gap">
        <GourmeatCategoryRow items={cuisineItems} active={cuisineFilter} onSelect={setCuisineFilter} testID="cuisine-gourmeat-row" />
      </div>

      {evidenceMode && productList.length > 0 && (
        <div className="mb-4" data-testid="evidence-dish-card">
          <GourmeatSectionTitle title={homeCopy.evidenceTitle} />
          <GourmeatDishCard
            product={productList.find((p) => p.id === OFFLINE_DISCOVER_PRODUCT.id) ?? productList[0]}
            isFavorite={isFavorite(OFFLINE_DISCOVER_PRODUCT.id)}
            onFavoritePress={() => handleFavorite(productList[0])}
            onAddPress={() => handleAddToCart(OFFLINE_DISCOVER_PRODUCT.id, 1)}
          />
        </div>
      )}

      <GourmeatSectionTitle
        title={getOccasionDishesTitle(locale, occasionFilter)}
        testID="all-dishes-header"
      />

      {isLoading && <SHCSkeletonGrid />}
      {!isLoading && gridProducts.length === 0 && !query.trim() && (
        <SHCEmptyState
          title={homeCopy.emptyTitle}
          description={homeCopy.emptyDescription}
          action={
            <SHCButton
              variant="outline"
              onClick={() => {
                setQuery('');
                setOccasionFilter('');
                setCuisineFilter('');
              }}
            >
              {homeCopy.clearFilters}
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
          {homeCopy.trustLink}
        </Link>
      </div>
    </section>
  );
}