'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useProducts, useAddToCart } from '../lib/useProducts';
import { useOrders, useDrops } from '../lib/useOrder';
import { useAuth } from '../lib/useAuth';
import { useDiscoverSearch } from './providers';
import {
  extractReorderDishes,
  getActiveOrders,
  getOrderStatusLabel,
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
} from '@shc/utils';
import { useFavorites } from '../lib/useFavorites';
import { useCustomerLocation } from '../lib/useCustomerLocation';
import { useDiscoverPrefs } from '../lib/useDiscoverPrefs';
import { getCooks } from '../lib/api-client';
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
  const { user } = useAuth();
  const { query, setQuery } = useDiscoverSearch();
  const [occasionFilter, setOccasionFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [orderMode, setOrderMode] = useState('popular');
  const [promoDismissed, setPromoDismissed] = useState(false);
  const { data: products = [], isLoading } = useProducts('');
  const { data: orders = [] } = useOrders();
  const { data: dropsRaw = [] } = useDrops();
  const drops = useMemo(
    () => filterCustomerCookingSoonDrops(dropsRaw as { cook_date?: string; status?: string }[]),
    [dropsRaw]
  );
  const { data: cooks = [] } = useQuery({ queryKey: ['cooks'], queryFn: getCooks, staleTime: 60_000 });
  const { favorites, toggle, isFavorite } = useFavorites();
  const { active: collectionLocation, locationLabel } = useCustomerLocation();
  const { halalOnly, maxCal, toggleHalalOnly, toggleLight } = useDiscoverPrefs();
  const addMut = useAddToCart();
  const activeOrder = useMemo(() => getActiveOrders(orders as Record<string, unknown>[])[0], [orders]);

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
  const cookList = cooks as Array<Record<string, unknown>>;

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
    <section
      id="discover"
      className="max-w-6xl mx-auto px-4 py-4 md:py-6 pb-28 md:pb-8"
      data-testid="customer-discover-screen discover-home"
    >
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
        <div className="relative mb-4" data-testid="home-tiffin-promo">
          <button
            type="button"
            onClick={() => setPromoDismissed(true)}
            className="absolute top-2.5 right-3 z-10 w-7 h-7 rounded-full bg-white/35 text-white font-extrabold text-xs"
            aria-label="Dismiss subscription promo"
            data-testid="home-promo-dismiss"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={() => router.push('/tiffin')}
            className="w-full text-left rounded-2xl p-4 text-white shadow-[var(--shc-shadow-brutal-sm)]"
            style={{ background: 'var(--shc-gourmeat-primary, #F87048)' }}
          >
            <p className="font-black text-lg">No time to cook?</p>
            <p className="font-extrabold text-base opacity-95 mb-2">Explore tiffin plans ✨</p>
            <ul className="text-sm font-semibold space-y-0.5 opacity-90">
              <li>· Weekly home-cooked meals from one kitchen</li>
              <li>· Or keep scrolling for single dishes &amp; events</li>
              <li>· Flexible 2 · 3 · 4 meals per week</li>
            </ul>
          </button>
        </div>
      )}

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

      {/* ② Explore by categories — cuisine */}
      {!query.trim() && (
        <>
          <p className="text-xs font-bold text-muted-foreground text-center mb-1">Explore by categories</p>
          <div className="shc-section-gap mb-4">
            <GourmeatCategoryRow
              items={cuisineItems}
              active={cuisineFilter}
              onSelect={(id) => {
                setCuisineFilter(id);
                // Dedicated category page (HomelyEats Explore category) — not only in-place filter
                if (id) {
                  router.push(`/category/${encodeURIComponent(id)}`);
                }
              }}
              testID="cuisine-gourmeat-row"
            />
          </div>
        </>
      )}

      {/* ③ Most popular — one meal / event order modes */}
      {!query.trim() && (
        <div className="shc-section-gap mb-4">
          <GourmeatSectionTitle title="Most popular choices" testID="most-popular-header" />
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2" data-testid="home-order-mode-chips">
            {ORDER_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setOrderMode(m.id);
                  if (m.id === 'one-off') setOccasionFilter('');
                }}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold border-2 ${
                  orderMode === m.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-[var(--shc-border-brutal)]'
                }`}
              >
                {m.label}
              </button>
            ))}
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
          className="w-full text-left rounded-2xl bg-[#1E3A5F] text-white p-4 mb-4"
        >
          <p className="font-black text-base">Subscribe for weekly tiffin</p>
          <p className="text-xs font-semibold opacity-90 mt-1">
            Banner only — below you can still order one dish or a full occasion spread.
          </p>
        </button>
      )}

      {/* Event / occasion rail — one-off party ordering */}
      {!query.trim() && (
        <div className="flex gap-3 overflow-x-auto pb-2 mb-4 scrollbar-hide" data-testid="home-event-rail">
          {[
            {
              id: 'hari-raya',
              title: 'Hari Raya spreads',
              subtitle: 'Order for the open house',
              imageUrl: PROMO_BANNER_IMAGES.hariRaya,
              badge: 'Event',
            },
            {
              id: 'cny',
              title: 'CNY reunion',
              subtitle: 'Plan 2 weeks ahead',
              imageUrl: PROMO_BANNER_IMAGES.family,
              badge: 'Event',
            },
            {
              id: 'request',
              title: 'Request a dish',
              subtitle: 'Custom occasion menu',
              imageUrl: PROMO_BANNER_IMAGES.credits,
              badge: 'Custom',
            },
          ].map((promo) => (
            <button
              key={promo.id}
              type="button"
              onClick={() => {
                if (promo.id === 'hari-raya') {
                  setOrderMode('occasion');
                  setOccasionFilter('Hari Raya');
                } else if (promo.id === 'cny') {
                  setOrderMode('occasion');
                  setOccasionFilter('Chinese New Year');
                } else {
                  router.push('/request');
                }
              }}
              className="relative shrink-0 w-[260px] h-[100px] rounded-xl overflow-hidden border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] text-left"
            >
              <Image src={promo.imageUrl} alt="" fill className="object-cover" sizes="260px" />
              <div className="relative z-10 flex flex-col justify-between h-full p-3 bg-[rgba(36,24,18,0.45)]">
                <span className="self-end text-[10px] font-black bg-[var(--shc-accent)] text-foreground px-2 py-0.5 rounded border border-[var(--shc-border-brutal)]">
                  {promo.badge}
                </span>
                <div>
                  <div className="font-black text-white text-sm">{promo.title}</div>
                  <div className="text-[11px] font-semibold text-white/90 mt-0.5">{promo.subtitle}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Cooking soon — always show (empty when no open marketplace batches) */}
      {!query.trim() && (
        <div className="mb-6" data-testid="home-cooking-soon-rail">
          <GourmeatSectionTitle title="Cooking soon near you" />
          {Array.isArray(drops) && drops.length > 0 ? (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1 snap-x">
              {(drops as any[]).slice(0, 8).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  data-testid={`home-drop-${d.id}`}
                  onClick={() => router.push(`/drops/${encodeURIComponent(d.id)}`)}
                  className="snap-start shrink-0 w-[260px] rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card p-4 text-left shadow-[var(--shc-shadow-brutal-sm)] hover:opacity-95"
                >
                  <p className="text-[11px] font-black uppercase tracking-wide text-primary">Cooking soon</p>
                  <p className="mt-1 font-black text-foreground line-clamp-1">{d.title}</p>
                  <p className="text-xs font-semibold text-muted-foreground line-clamp-1">
                    {d.cook_name || 'Home kitchen'} · {formatDropCookDate(d.cook_date)} · {d.collection_slot}
                  </p>
                  <p className="mt-2 text-sm font-extrabold text-primary">{formatDropPrice(d.price_cents, d.price)}</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {d.remaining_qty ?? d.max_qty - (d.ordered_qty || 0)} left · by {formatDropOrderBy(d.order_by)}
                  </p>
                  <span className="mt-3 inline-block rounded-xl bg-primary px-3 py-1.5 text-xs font-extrabold text-primary-foreground">
                    Order
                  </span>
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
      {!query.trim() && cookList.length > 0 && (
        <div className="mb-6" data-testid="home-kitchens-section">
          <GourmeatSectionTitle
            title={`${cookList.length} kitchens near you`}
            actionLabel="Tiffin"
            actionHref="/tiffin"
          />
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
          <ul className="space-y-3 mt-3">
            {cookList.slice(0, 4).map((c) => {
              const id = String(c.id || c.slug || '');
              const name = String(c.display_name || c.name || 'Home kitchen');
              const slug = String(c.slug || c.id || '');
              const cover = getCookAvatarUrl(id, name);
              return (
                <li key={id || slug}>
                  <button
                    type="button"
                    data-testid={`home-kitchen-${id}`}
                    className="w-full text-left rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card overflow-hidden shadow-[var(--shc-shadow-brutal-sm)] hover:opacity-95 transition-opacity"
                    onClick={() => {
                      if (slug) router.push(`/cook/${slug}`);
                    }}
                  >
                    <div className="relative h-36 w-full bg-muted">
                      <Image src={cover} alt="" fill className="object-cover" sizes="640px" />
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-black text-foreground truncate flex-1">{name}</p>
                        <span className="text-xs font-bold shrink-0">
                          ★ {c.rating != null ? Number(c.rating).toFixed(1) : '4.8'}
                          {c.review_count != null ? ` (${c.review_count})` : ''}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-semibold line-clamp-1 mt-0.5">
                        {c.story ? String(c.story).slice(0, 80) : 'Heritage home cooking'}
                        {c.area ? ` · ${String(c.area)}` : ''}
                      </p>
                      <p className="text-sm font-extrabold text-green-700 mt-1">
                        Open <span className="text-muted-foreground font-semibold">· HDB collection</span>
                      </p>
                      {c.subscriber_count != null && (
                        <p className="text-xs font-semibold text-muted-foreground mt-1">
                          👤 {String(c.subscriber_count)} subscribers
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!query.trim() && savedDishes.length > 0 && (
        <div className="shc-section-gap mb-4">
          <GourmeatSectionTitle title="Saved for later" />
          <ZomatoDishRowRail title="" products={savedDishes} onDishPress={goToProduct} testID="saved-dishes-rail" />
        </div>
      )}

      {evidenceMode && productList.length > 0 && (
        <div className="mb-4" data-testid="evidence-dish-card">
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
        Add to cart for one meal · tiffin plans are in the banner above
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
