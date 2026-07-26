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
  getCookAvatarUrl,
  getDishImageUrl,
  MIND_CUISINE_CATEGORIES,
  sortByCookProximity,
  filterDiscoverProducts,
  resolveDiscoverProductsForDisplay,
  formatDropCookDate,
  formatDropOrderBy,
  formatDropPrice,
  filterCustomerCookingSoonDrops,
  getDropImageUrl,
  getCookKitchenHeroUrl,
  discoverHomeHeadline,
  discoverHomePromoCarousel,
  MEAL_TYPE_CHIPS,
  topRatedCategoryDishes,
  isPopularDish,
  DISCOVER_MODES,
  DISCOVER_OCCASIONS_NAV,
  discoverSections,
  discoverForYouRail,
  discoverActiveFilterCount,
  discoverGridHeading,
  discoverKitchensHeading,
  discoverEmptyCopy,
  occasionBrowseRoute,
  type DiscoverModeId,
  type MealTypeId,
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
  GourmeatModeSwitch,
  GourmeatSectionTitle,
  DiscoverFilterSheet,
  SearchResultsPanel,
  RequestDishHomeCTA,
  HomePromoCarousel,
  TiffinKitchenCard,
  type DishCardProduct,
} from './components/SHCWebComponents';
import { VirtualDishGrid } from './components/VirtualLists';

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
  const [mode, setMode] = useState<DiscoverModeId>('dishes');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [mealType, setMealType] = useState<MealTypeId>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  const { halalOnly, maxCal, vegetarianOnly, toggleHalalOnly, toggleLight, toggleVegetarianOnly } = useDiscoverPrefs();
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

  const filters = useMemo(
    () => ({
      mealType,
      cuisine: cuisineFilter,
      halalOnly,
      vegetarianOnly,
      maxCal,
    }),
    [mealType, cuisineFilter, halalOnly, vegetarianOnly, maxCal]
  );
  const activeFilterCount = discoverActiveFilterCount(filters);

  const filteredProducts = useMemo(() => {
    const list = filterDiscoverProducts(productList as Record<string, unknown>[], {
      query,
      cuisine: cuisineFilter || undefined,
      mealType: mealType !== 'all' ? mealType : undefined,
      halalOnly: halalOnly || undefined,
      vegetarianOnly: vegetarianOnly || undefined,
      maxCal,
    });
    return sortByCookProximity(
      list as Array<DishCardProduct & { cook_area?: string; area?: string }>,
      collectionLocation
    ) as DishCardProduct[];
  }, [productList, query, cuisineFilter, mealType, halalOnly, vegetarianOnly, maxCal, collectionLocation]);

  const isSearching = query.trim().length > 0;
  const gridProducts = useMemo(() => (isSearching ? [] : filteredProducts), [filteredProducts, isSearching]);
  const searchDishes = useMemo(
    () => (isSearching ? filteredProducts.map((p) => toDishCard(p)) : []),
    [filteredProducts, isSearching]
  );

  const forYou = useMemo(() => {
    if (isSearching) return null;
    const asCards = (items: Array<{ id: string; name: string; cook_name?: string; price: number; cuisine?: string }>) =>
      items.map((d) =>
        toDishCard({ id: d.id, name: d.name, cook_name: d.cook_name || '', price: d.price, cuisine: d.cuisine })
      ) as DishCardProduct[];
    return discoverForYouRail<DishCardProduct>({
      reorder: asCards(extractReorderDishes(orders as Record<string, unknown>[])),
      saved: asCards(favoritesToReorderDishes(favorites)),
      topRated: topRatedCategoryDishes(productList as Record<string, unknown>[], 8).map((p) =>
        toDishCard(p as DishCardProduct)
      ) as DishCardProduct[],
    });
  }, [isSearching, orders, favorites, productList]);

  const cuisineItems = MIND_CUISINE_CATEGORIES.map((c) => ({ id: c.id, label: c.label, imageUrl: c.imageUrl }));
  const headerLocation = collectionLocation ? locationLabel : 'Set collection location';
  const isGuest = !user;
  const homeGreeting = discoverHomeHeadline(user?.name, user?.email);
  const homePromos = useMemo(() => discoverHomePromoCarousel(), []);
  const cookList = (cooks as Array<Record<string, unknown>>) ?? [];
  const gridHeading = discoverGridHeading(mode, filters);
  const kitchensHeading = discoverKitchensHeading(cookList.length, Boolean(collectionLocation));
  const emptyCopy = discoverEmptyCopy(mode, filters);

  const sections = useMemo(
    () =>
      discoverSections({
        isSearching,
        isGuest,
        mode,
        hasPromos: homePromos.length > 0,
        hasForYou: Boolean(forYou),
      }),
    [isSearching, isGuest, mode, homePromos.length, forYou]
  );

  const checkPopular = useCallback(
    (product: DishCardProduct) => isPopularDish(product as Record<string, unknown>, productList as Record<string, unknown>[]),
    [productList]
  );

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

  const clearFilters = useCallback(() => {
    setMealType('all');
    setCuisineFilter('');
    if (halalOnly) toggleHalalOnly();
    if (vegetarianOnly) toggleVegetarianOnly();
    if (maxCal != null) toggleLight();
  }, [halalOnly, vegetarianOnly, maxCal, toggleHalalOnly, toggleVegetarianOnly, toggleLight]);

  const handleHomePromoPress = useCallback(
    (id: string) => {
      const promo = homePromos.find((item) => item.id === id);
      if (!promo) return;
      if (promo.occasionFilter) {
        router.push(occasionBrowseRoute(promo.occasionFilter).web);
        return;
      }
      router.push(promo.webRoute);
    },
    [homePromos, router]
  );

  const renderSection = (id: string) => {
    switch (id) {
      case 'search-results':
        return (
          <SearchResultsPanel
            query={query}
            dishes={searchDishes}
            onDishPress={goToProduct}
            onAddPress={(pid) => handleAddToCart(pid, 1)}
            onClose={() => setQuery('')}
          />
        );

      case 'guest':
        return <GuestBrowseBar onSignInClick={() => router.push('/login')} />;

      case 'promos':
        return <HomePromoCarousel promos={homePromos} onPromoPress={handleHomePromoPress} />;

      case 'cooking-soon':
        return (
          <div data-testid="home-cooking-soon-rail">
            <GourmeatSectionTitle title="Cooking this week" />
            {dropsLoading && drops.length === 0 ? (
              <SHCSkeletonCookingSoonRail />
            ) : drops.length > 0 ? (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1 snap-x">
                {(drops as any[]).slice(0, 8).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    data-testid={`home-drop-${d.id}`}
                    onClick={() => router.push(`/drops/${encodeURIComponent(d.id)}`)}
                    className="snap-start shrink-0 w-[240px] rounded-2xl border border-[var(--shc-border)] bg-card overflow-hidden text-left shadow-[var(--shc-shadow-soft)] hover:opacity-95"
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
              <div className="mt-3 rounded-2xl border border-[var(--shc-border)] bg-card p-4" data-testid="home-cooking-soon-empty">
                <p className="font-extrabold text-foreground">No open batches in the next 7 days</p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  Only batches cooking within a week appear here. Refresh after a cook posts.
                </p>
              </div>
            )}
          </div>
        );

      case 'for-you':
        return forYou ? (
          <div data-testid="home-for-you-rail">
            <GourmeatSectionTitle title={forYou.title} />
            <ZomatoDishRowRail
              title=""
              products={forYou.dishes}
              onDishPress={goToProduct}
              testID={`for-you-rail-${forYou.source}`}
            />
          </div>
        ) : null;

      case 'browse-switch':
        return (
          <div className="shc-section-stack">
            <GourmeatModeSwitch
              modes={DISCOVER_MODES}
              activeId={mode}
              onSelect={(id) => setMode(id as DiscoverModeId)}
              navAction={{
                label: DISCOVER_OCCASIONS_NAV.label,
                href: occasionBrowseRoute().web,
                testID: DISCOVER_OCCASIONS_NAV.testID,
              }}
            />
          </div>
        );

      case 'cuisine-rail':
        return (
          <GourmeatCategoryRow
            items={[{ id: '', label: 'All' }, ...cuisineItems]}
            active={cuisineFilter}
            onSelect={(id) => setCuisineFilter(id === cuisineFilter ? '' : id)}
            testID="cuisine-gourmeat-row"
          />
        );

      case 'kitchen-list':
        return (
          <div data-testid="home-kitchens-section">
            <GourmeatSectionTitle
              title={cooksLoading && cookList.length === 0 ? 'Home kitchens' : kitchensHeading.title}
              actionLabel="Tiffin plans"
              actionHref="/tiffin"
            />
            {kitchensHeading.hint && !cooksLoading ? (
              <p className="text-xs font-semibold text-muted-foreground mb-3 -mt-1">
                <Link href="/location" className="text-primary hover:underline">
                  {kitchensHeading.hint}
                </Link>
              </p>
            ) : null}
            {cooksLoading && cookList.length === 0 ? (
              <SHCSkeletonKitchenList count={3} />
            ) : cookList.length === 0 ? (
              <SHCEmptyState title={emptyCopy.title} description={emptyCopy.description} />
            ) : (
              <ul>
                {cookList.map((c) => {
                  const cid = String(c.id || c.slug || '');
                  const slug = String(c.slug || c.id || '');
                  return (
                    <li key={cid || slug}>
                      <TiffinKitchenCard
                        cookId={cid || slug}
                        cookName={String(c.display_name || c.name || 'Home kitchen')}
                        area={c.area ? String(c.area) : undefined}
                        tagline={c.story ? String(c.story).slice(0, 80) : undefined}
                        coverUri={getCookKitchenHeroUrl(cid || slug)}
                        rating={c.rating != null ? Number(c.rating) : undefined}
                        reviewCount={c.review_count != null ? Number(c.review_count) : undefined}
                        subscriberCount={c.subscriber_count != null ? Number(c.subscriber_count) : undefined}
                        onPress={() => {
                          if (cid) router.push(`/tiffin/kitchen/${encodeURIComponent(cid)}`);
                        }}
                        testID={`home-kitchen-${cid}`}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );

      case 'dish-grid':
        return (
          <div>
            <GourmeatSectionTitle title={gridHeading.title} testID="all-dishes-header" />
            <p className="text-xs font-semibold text-muted-foreground mb-3 -mt-1">{gridHeading.hint}</p>
            {isLoading && <SHCSkeletonGrid />}
            {!isLoading && gridProducts.length === 0 && (
              <SHCEmptyState
                title={emptyCopy.title}
                description={emptyCopy.description}
                action={
                  activeFilterCount > 0 ? (
                    <SHCButton variant="outline" onClick={clearFilters}>
                      Clear filters
                    </SHCButton>
                  ) : (
                    <SHCButton variant="outline" onClick={() => router.push('/request')}>
                      Request a dish
                    </SHCButton>
                  )
                }
              />
            )}
            {!isLoading && gridProducts.length > 0 && (
              <VirtualDishGrid
                products={gridProducts}
                isFavorite={isFavorite}
                isPopular={checkPopular}
                onFavoritePress={handleFavorite}
                onAddPress={(pid) => handleAddToCart(pid, 1)}
              />
            )}
          </div>
        );

      case 'request':
        return <RequestDishHomeCTA />;

      default:
        return null;
    }
  };

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
          headline={homeGreeting.headline}
          subtitle={homeGreeting.subtitle}
          locationLabel={headerLocation}
          locationHint="Collect from"
          avatarUri={user?.name ? getCookAvatarUrl(user.id, user.name) : undefined}
          locationHref="/location"
        />
      </div>
      <h1 className="hidden md:block text-3xl font-extrabold text-foreground tracking-[-0.5px] mb-1">
        {homeGreeting.headline}
      </h1>
      {homeGreeting.subtitle ? (
        <p className="hidden md:block text-sm font-semibold text-muted-foreground mb-4">{homeGreeting.subtitle}</p>
      ) : (
        <div className="hidden md:block mb-4" />
      )}

      {/* Single control surface — search + every filter, pinned so it is reachable at any scroll depth */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-background/95 backdrop-blur md:hidden">
        <GourmeatSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search kitchen, dish or cuisine"
          onFilterPress={() => setFiltersOpen(true)}
          filterCount={activeFilterCount}
        />
      </div>
      <div className="hidden md:flex justify-end mb-3">
        <SHCButton variant="outline" onClick={() => setFiltersOpen(true)} data-testid="discover-filters-desktop">
          {activeFilterCount > 0 ? `Filters · ${activeFilterCount}` : 'Filters'}
        </SHCButton>
      </div>

      {sections.map((section) => (
        <div key={section.id} data-testid={section.testID} className="shc-section-stack">
          {renderSection(section.id)}
        </div>
      ))}

      <div className="shc-section-stack text-center">
        <Link href="/content/trust" className="text-xs text-primary font-semibold hover:underline" data-testid="discover-trust-link">
          Trust &amp; Safety →
        </Link>
      </div>

      <DiscoverFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        mealTypeChips={MEAL_TYPE_CHIPS}
        mealType={mealType}
        onMealTypeChange={(id) => setMealType(id as MealTypeId)}
        cuisines={[{ id: '', label: 'All' }, ...cuisineItems]}
        cuisine={cuisineFilter}
        onCuisineChange={setCuisineFilter}
        halalOnly={halalOnly}
        vegetarianOnly={vegetarianOnly}
        lightOnly={maxCal != null}
        onToggleHalal={toggleHalalOnly}
        onToggleVegetarian={toggleVegetarianOnly}
        onToggleLight={toggleLight}
        onClear={clearFilters}
        resultCount={filteredProducts.length}
        activeCount={activeFilterCount}
      />
    </section>
  );
}
