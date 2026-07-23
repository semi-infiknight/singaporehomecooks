'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProducts, useAddToCart } from '../lib/useProducts';
import { useOrders, useDrops } from '../lib/useOrder';
import { useAuth } from '../lib/useAuth';
import { useGuestAuthGate } from '../lib/useGuestAuthGate';
import { useDiscoverSearch } from './providers';
import {
  extractReorderDishes,
  favoritesToReorderDishes,
  getOccasionImageUrl,
  getCookAvatarUrl,
  getDishImageUrl,
  MIND_CUISINE_CATEGORIES,
  sortByCookProximity,
  filterDiscoverProducts,
  resolveDiscoverProductsForDisplay,
  OFFLINE_DISCOVER_PRODUCT,
  PROMO_BANNER_IMAGES,
  formatDropCookDate,
  formatDropOrderBy,
  formatDropPrice,
  filterCustomerCookingSoonDrops,
  getDropImageUrl,
  getCookKitchenHeroUrl,
} from '@shc/utils';
import { useFavorites } from '../lib/useFavorites';
import { useCustomerLocation } from '../lib/useCustomerLocation';
import { useDiscoverPrefs } from '../lib/useDiscoverPrefs';
import { getCooks } from '../lib/api-client';
import {
  SHCButton,
  SHCSkeletonGrid,
  SHCSkeletonCookingSoonRail,
  SHCSkeletonKitchenList,
  SHCEmptyState,
  GuestBrowseBar,
  ZomatoDishRowRail,
  GourmeatHomeHeader,
  GourmeatSearchBar,
  GourmeatCategoryRow,
  GourmeatDishCard,
  GourmeatSectionTitle,
  FilterChipRow,
  SearchResultsPanel,
  RequestDishHomeCTA,
  TiffinHeroBanner,
  TiffinFilterChips,
  TiffinKitchenCard,
  PromoRail,
  type DishCardProduct,
} from './components/SHCWebComponents';
import { VirtualDishGrid } from './components/VirtualLists';

const occasions = [
  { id: '', label: 'All' },
  ...['Hari Raya', 'Deepavali', 'Chinese New Year', 'Family Gathering', 'Birthday', 'Wedding', 'Christmas'].map((o) => ({
    id: o,
    label: o === 'Chinese New Year' ? 'CNY' : o === 'Family Gathering' ? 'Family' : o.split(' ')[0],
    imageUrl: getOccasionImageUrl(o),
  })),
];

/** Order-mode tabs — one meal vs event (HomelyEats meal-type strip, adapted for SHC). */
const ORDER_MODES = [
  { id: 'popular', label: 'Popular' },
  { id: 'one-off', label: 'One meal' },
  { id: 'occasion', label: 'Events' },
];

function toDishCard(product: DishCardProduct): DishCardProduct & { rating?: number; image_url?: string } {
  return {
    ...product,
    rating: product.rating != null ? Number(product.rating) : 4.8,
    image_url: getDishImageUrl({ id: product.id, cuisine: product.cuisine, name: product.name }),
  };
}

export default function DiscoverHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { requireAuth } = useGuestAuthGate();
  const { query, setQuery } = useDiscoverSearch();
  const [occasionFilter, setOccasionFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [orderMode, setOrderMode] = useState('popular');
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const { data: products, isLoading, refetch: refetchProducts } = useProducts('');
  const productListRaw = products ?? [];
  const { data: orders = [] } = useOrders();
  const { data: dropsRaw, isLoading: dropsLoading, refetch: refetchDrops } = useDrops();
  const drops = useMemo(
    () => filterCustomerCookingSoonDrops((dropsRaw as { cook_date?: string; status?: string }[]) || []),
    [dropsRaw]
  );
  const { data: cooks, isLoading: cooksLoading, refetch: refetchCooks } = useQuery({ queryKey: ['cooks'], queryFn: getCooks, staleTime: 60_000 });
  const { favorites, toggle, isFavorite } = useFavorites();
  const { active: collectionLocation, locationLabel } = useCustomerLocation();
  const { halalOnly, maxCal, toggleHalalOnly, toggleLight } = useDiscoverPrefs();
  const addMut = useAddToCart();
  const evidenceMode = process.env.NEXT_PUBLIC_FAMILY_VALUES_EVIDENCE === '1';

  const refreshDiscover = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProducts(),
        refetchDrops(),
        refetchCooks(),
        qc.invalidateQueries({ queryKey: ['drops'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [qc, refetchCooks, refetchDrops, refetchProducts]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refetchDrops();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refetchDrops]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) pullStartY.current = e.touches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) return;
      const endY = e.changedTouches[0]?.clientY ?? 0;
      if (endY - pullStartY.current > 72) void refreshDiscover();
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [refreshDiscover, refreshing]);

  const productList = useMemo(
    () => resolveDiscoverProductsForDisplay(productListRaw as DishCardProduct[], { evidence: evidenceMode }),
    [productListRaw, evidenceMode]
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
    return favoritesToReorderDishes(favorites).map((d) =>
      toDishCard({
        id: d.id,
        name: d.name,
        cook_name: d.cook_name || '',
        price: d.price,
        cuisine: d.cuisine,
      })
    ) as DishCardProduct[];
  }, [favorites, query]);

  const reorderDishes = useMemo(() => {
    if (query.trim()) return [];
    const items = extractReorderDishes(orders as Record<string, unknown>[]);
    return items.map((d) =>
      toDishCard({
        id: d.id,
        name: d.name,
        cook_name: d.cook_name || '',
        price: d.price,
        cuisine: d.cuisine,
      })
    ) as DishCardProduct[];
  }, [orders, query]);

  const cuisineItems = MIND_CUISINE_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    imageUrl: c.imageUrl,
  }));

  const headerLocation = collectionLocation ? locationLabel : 'Set collection location';
  const isGuest = !user;
  const cookList = (cooks as Array<Record<string, unknown>>) ?? [];

  const goToProduct = useCallback((id: string) => router.push(`/product/${id}`), [router]);

  const handleAddToCart = useCallback(
    (productId: string, qty = 1) => {
      if (!requireAuth('Browse freely — sign in to add dishes to your cart.')) return;
      addMut.mutate({ productId, qty });
    },
    [addMut, requireAuth]
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
    <section
      id="discover"
      className="max-w-6xl mx-auto px-4 py-4 md:py-6 shc-tab-bar-pad md:pb-8"
      data-testid="customer-discover-screen"
    >
      {refreshing ? (
        <p className="text-center text-xs font-bold text-primary mb-2" data-testid="discover-refresh-indicator">
          Refreshing…
        </p>
      ) : null}
      {/* Mobile chrome — desktop uses AppHeader */}
      <div className="md:hidden">
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
          placeholder="Search kitchen, dish or cuisine"
          onFilterPress={() => router.push('/search')}
        />
      </div>
      <h1 className="hidden md:block text-3xl font-extrabold text-foreground tracking-[-0.5px] mb-4">
        Hungry? Order &amp; Eat.
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

      {/* ① Subscription promo only — full homepage is marketplace, not tiffin-only */}
      {!query.trim() && !promoDismissed && (
        <div className="relative" data-testid="home-tiffin-promo">
          <button
            type="button"
            onClick={() => setPromoDismissed(true)}
            className="absolute top-2.5 right-3 z-10 w-7 h-7 rounded-full bg-white/35 text-white font-extrabold text-xs"
            aria-label="Dismiss subscription promo"
            data-testid="home-promo-dismiss"
          >
            ✕
          </button>
          <button type="button" onClick={() => router.push('/tiffin')} className="w-full text-left">
            <TiffinHeroBanner
              highlight="Explore tiffin plans ✨"
              bullets={[
                'Weekly home-cooked meals from one kitchen',
                'Or keep scrolling for single dishes & events',
                'Flexible 2 · 3 · 4 meals per week',
              ]}
            />
          </button>
        </div>
      )}

      {/* ② Explore by categories — cuisine */}
      {!query.trim() && (
        <GourmeatCategoryRow
          title="Explore by categories"
          items={cuisineItems}
          active={cuisineFilter}
          onSelect={(id) => {
            setCuisineFilter(id);
            if (id) {
              router.push(`/category/${encodeURIComponent(id)}`);
            }
          }}
          testID="cuisine-gourmeat-row"
        />
      )}

      {/* ③ Most popular — one meal / event order modes */}
      {!query.trim() && (
        <div>
          <GourmeatSectionTitle title="Most popular choices" testID="most-popular-header" />
          <div className="mb-2" data-testid="home-order-mode-chips">
            <TiffinFilterChips
              chips={ORDER_MODES}
              activeId={orderMode}
              onSelect={(id) => {
                setOrderMode(id);
                if (id === 'one-off') setOccasionFilter('');
              }}
            />
          </div>
          {(orderMode === 'popular' || orderMode === 'one-off') && reorderDishes.length > 0 && (
            <ZomatoDishRowRail title="" products={reorderDishes} onDishPress={goToProduct} testID="order-again-rail" />
          )}
          {orderMode === 'occasion' && (
            <GourmeatCategoryRow items={occasions} active={occasionFilter} onSelect={setOccasionFilter} />
          )}
        </div>
      )}

      {/* Offer — encourage subscription without taking over the page */}
      {!query.trim() && (
        <button
          type="button"
          data-testid="home-offer-card"
          onClick={() => router.push('/tiffin')}
          className="w-full text-left rounded-2xl shc-bg-offer text-white p-4 shc-section-stack"
        >
          <p className="font-black text-base">Subscribe for weekly tiffin</p>
          <p className="text-xs font-semibold opacity-90 mt-1">
            Banner only — below you can still order one dish or a full occasion spread.
          </p>
        </button>
      )}

      {/* Event / occasion rail — one-off party ordering */}
      {!query.trim() && (
          <PromoRail
            promos={[
              {
                id: 'hari-raya',
                title: 'Hari Raya spreads',
                subtitle: 'Order for the open house',
                imageUrl: PROMO_BANNER_IMAGES.hariRaya,
                badge: 'Event',
                iconKey: 'people',
              },
              {
                id: 'cny',
                title: 'CNY reunion',
                subtitle: 'Plan 2 weeks ahead',
                imageUrl: PROMO_BANNER_IMAGES.family,
                badge: 'Event',
                iconKey: 'people',
              },
              {
                id: 'request',
                title: 'Request a dish',
                subtitle: 'Custom occasion menu',
                imageUrl: PROMO_BANNER_IMAGES.request,
                badge: 'Custom',
                iconKey: 'discover',
              },
            ]}
            onPromoPress={(id) => {
              if (id === 'hari-raya') setOccasionFilter('Hari Raya');
              else if (id === 'cny') setOccasionFilter('Chinese New Year');
              else router.push('/request');
            }}
          />
      )}

      {/* Cooking soon — skeleton while fetching; empty only when settled */}
      {!query.trim() && (
        <div data-testid="home-cooking-soon-rail">
          <GourmeatSectionTitle title="Cooking soon near you" />
          {dropsLoading && !(Array.isArray(drops) && drops.length > 0) ? (
            <SHCSkeletonCookingSoonRail />
          ) : Array.isArray(drops) && drops.length > 0 ? (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1 snap-x">
              {(drops as any[]).slice(0, 8).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  data-testid={`home-drop-${d.id}`}
                  onClick={() => router.push(`/drops/${encodeURIComponent(d.id)}`)}
                  className="snap-start shrink-0 w-[240px] rounded-2xl border-2 border-[var(--shc-border)] bg-card overflow-hidden text-left shadow-[var(--shc-shadow-soft)] hover:opacity-95"
                >
                  <div className="relative h-24 w-full bg-muted">
                    <Image
                      src={getDropImageUrl({ title: d.title, image_url: d.image_url, cook_id: d.cook_id })}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="240px"
                    />
                  </div>
                  <div className="p-3.5">
                    <p className="text-[11px] font-black uppercase tracking-wide text-primary">Cooking soon</p>
                    <p className="mt-1 font-black text-base text-foreground line-clamp-1">{d.title}</p>
                    <p className="text-xs font-semibold text-muted-foreground line-clamp-1">
                      {d.cook_name || 'Kitchen'} · {formatDropCookDate(d.cook_date)} · {d.collection_slot}
                    </p>
                    <p className="mt-2 text-sm font-extrabold text-primary">{formatDropPrice(d.price_cents, d.price)}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      {d.remaining_qty ?? d.max_qty - (d.ordered_qty || 0)} left · by {formatDropOrderBy(d.order_by)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div
              className="mt-3 rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card p-4"
              data-testid="home-cooking-soon-empty"
            >
              <p className="font-extrabold text-foreground">No open batches in the next 7 days</p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                Only batches cooking within a week appear here. Refresh after a cook posts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ④ Kitchens near you — browse cooks (one-off or subscribe) */}
      {!query.trim() && (cooksLoading || cookList.length > 0) && (
        <div data-testid="home-kitchens-section">
          <GourmeatSectionTitle
            title={cooksLoading && cookList.length === 0 ? 'Kitchens near you' : `${cookList.length} kitchens near you`}
            actionLabel="Tiffin"
            actionHref="/tiffin"
          />
          {cooksLoading && cookList.length === 0 ? (
            <SHCSkeletonKitchenList count={3} />
          ) : (
            <>
          <FilterChipRow
            chips={[
              { id: 'halal', label: 'Halal', active: halalOnly },
              { id: 'light', label: 'Light', active: maxCal === 500 },
              { id: 'nearest', label: 'Nearest', active: Boolean(collectionLocation) },
            ]}
            onChipClick={(id) => {
              if (id === 'halal') toggleHalalOnly();
              if (id === 'light') toggleLight();
              if (id === 'nearest') router.push('/location');
            }}
            testID="discover-filter-chips"
          />
          <ul className="mt-3">
            {cookList.slice(0, 4).map((c) => {
              const id = String(c.id || c.slug || '');
              const name = String(c.display_name || c.name || 'Home kitchen');
              const slug = String(c.slug || c.id || '');
              return (
                <li key={id || slug}>
                  <TiffinKitchenCard
                    cookId={id || slug}
                    cookName={name}
                    area={c.area ? String(c.area) : undefined}
                    tagline={c.story ? String(c.story).slice(0, 80) : 'Heritage home cooking'}
                    coverUri={getCookKitchenHeroUrl(id || slug)}
                    rating={c.rating != null ? Number(c.rating) : 4.8}
                    reviewCount={c.review_count != null ? Number(c.review_count) : undefined}
                    subscriberCount={c.subscriber_count != null ? Number(c.subscriber_count) : undefined}
                    isOpen
                    closesAt="HDB collection"
                    onPress={() => {
                      if (slug) router.push(`/cook/${slug}`);
                    }}
                    testID={`home-kitchen-${id}`}
                  />
                </li>
              );
            })}
          </ul>
            </>
          )}
        </div>
      )}

      {!query.trim() && savedDishes.length > 0 && (
        <div className="shc-section-stack mb-4">
          <GourmeatSectionTitle title="Saved for later" />
          <ZomatoDishRowRail title="" products={savedDishes} onDishPress={goToProduct} testID="saved-dishes-rail" />
        </div>
      )}

      {evidenceMode && productList.length > 0 && (
        <div className="shc-card-gap" data-testid="evidence-dish-card">
          <GourmeatSectionTitle title="Featured dish (evidence)" />
          <GourmeatDishCard
            product={productList.find((p) => p.id === OFFLINE_DISCOVER_PRODUCT.id) ?? productList[0]}
            isFavorite={isFavorite(OFFLINE_DISCOVER_PRODUCT.id)}
            onFavoritePress={() => handleFavorite(productList[0])}
            onAddPress={() => handleAddToCart(OFFLINE_DISCOVER_PRODUCT.id, 1)}
          />
        </div>
      )}

      {/* Main grid: one-off dishes for single meal / cart */}
      <GourmeatSectionTitle
        title={
          occasionFilter
            ? `${occasionFilter.split(' ')[0]} dishes — order for your event`
            : 'Order a single dish'
        }
        testID="all-dishes-header"
      />
      <p className="text-xs font-semibold text-muted-foreground mb-3 -mt-1">
        Add to cart for one meal · switch to tiffin above for weekly plans
      </p>

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
        <VirtualDishGrid
          products={gridProducts}
          isFavorite={isFavorite}
          onFavoritePress={handleFavorite}
          onAddPress={(id) => handleAddToCart(id, 1)}
        />
      )}

      {!query.trim() && <RequestDishHomeCTA />}

      <div className="shc-section-stack text-center">
        <Link href="/content/trust" className="text-xs text-primary font-semibold hover:underline" data-testid="discover-trust-link">
          Trust &amp; Safety →
        </Link>
      </div>
    </section>
  );
}
