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
  buildCookAreaById,
  sortReorderDishesByProximity,
  getCookAvatarUrl,
  getDishImageUrl,
  sortByCookProximity,
  distanceToCookItemKm,
  formatDistanceKm,
  filterDiscoverProducts,
  resolveDiscoverProductsForDisplay,
  formatDropCookDate,
  formatDropOrderBy,
  formatDropPrice,
  filterCustomerCookingSoonDrops,
  getDropImageUrl,
  getCookKitchenHeroUrl,
  topRatedCategoryDishes,
  coerceRating,
  discoverSections,
  discoverActiveFilterCount,
  discoverGridHeading,
  discoverKitchensHeading,
  discoverActiveFilters,
  customerDiscoverEmptyCopy,
  customerForYouRail,
  customerIsPopularDish,
  buildSearchResultGroups,
  type DiscoverModeId,
  type MealTypeId,
} from '@shc/utils';
import { useFavorites } from '../lib/useFavorites';
import { useCustomerLocation } from '../lib/useCustomerLocation';
import { useDiscoverPrefs } from '../lib/useDiscoverPrefs';
import { useCustomerConfig } from '../lib/useCustomerConfig';
import { getCooks } from '../lib/api-client';
import {
  SHCButton,
  SHCSkeletonGrid,
  SHCSkeletonCookingSoonRail,
  SHCSkeletonKitchenList,
  SHCEmptyState,
  ZomatoDishRowRail,
  GourmeatHomeHeader,
  GourmeatSearchBar,
  GourmeatCategoryRow,
  GourmeatModeSwitch,
  GourmeatSectionTitle,
  DiscoverFilterSheet,
  RequestDishHomeCTA,
  SearchNoResultsRequestCard,
  HomePromoCarousel,
  LocationNudgeBanner,
  TiffinKitchenCard,
  type DishCardProduct,
} from './components/SHCWebComponents';
import { VirtualDishGrid } from './components/VirtualLists';

function toDishCard(product: DishCardProduct): DishCardProduct & { rating?: number; image_url?: string } {
  return {
    ...product,
    rating: coerceRating(product.rating),
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
  const { proximity, proximityLabel, ready: locationReady } = useCustomerLocation();
  const {
    halalOnly,
    maxCal,
    vegetarianOnly,
    veganOnly,
    chickenOnly,
    excludeNuts,
    toggleHalalOnly,
    toggleLight,
    setMaxCal,
    toggleVegetarianOnly,
    toggleVeganOnly,
    toggleChickenOnly,
    toggleExcludeNuts,
  } = useDiscoverPrefs();
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
      veganOnly,
      includeIngredient: chickenOnly ? 'chicken' : undefined,
      excludeNuts,
      maxCal,
    }),
    [mealType, cuisineFilter, halalOnly, vegetarianOnly, veganOnly, chickenOnly, excludeNuts, maxCal]
  );
  const activeFilterCount = discoverActiveFilterCount(filters);

  const filteredProducts = useMemo(() => {
    const list = filterDiscoverProducts(productList as Record<string, unknown>[], {
      query,
      cuisine: cuisineFilter || undefined,
      mealType: mealType !== 'all' ? mealType : undefined,
      halalOnly: halalOnly || undefined,
      vegetarianOnly: vegetarianOnly || undefined,
      veganOnly: veganOnly || undefined,
      includeIngredient: chickenOnly ? 'chicken' : undefined,
      excludeNuts: excludeNuts || undefined,
      maxCal,
    });
    return sortByCookProximity(
      list as Array<DishCardProduct & { cook_area?: string; area?: string }>,
      proximity
    ) as DishCardProduct[];
  }, [
    productList,
    query,
    cuisineFilter,
    mealType,
    halalOnly,
    vegetarianOnly,
    veganOnly,
    chickenOnly,
    excludeNuts,
    maxCal,
    proximity,
  ]);

  const isSearching = query.trim().length > 0;

  const { categories: cuisineItems, promos: homePromos, config: browseConfig } = useCustomerConfig();

  const cookList = (cooks as Array<Record<string, unknown>>) ?? [];
  const cookAreaById = useMemo(() => buildCookAreaById(cookList, productList), [cookList, productList]);

  const searchGroups = useMemo(() => {
    if (!isSearching) return { kitchens: [], dishes: [] as ReturnType<typeof buildSearchResultGroups>['dishes'] };
    const byName = new Map(
      cookList.map((c) => [
        String(c.display_name || c.name || '').toLowerCase(),
        { slug: c.slug, id: c.id, area: c.area },
      ])
    );
    const inputs = filteredProducts.map((raw) => {
      const p = raw as DishCardProduct & {
        cook_slug?: string;
        area?: string;
        cook_area?: string;
      };
      const cookName = String(p.cook_name || '');
      const hit = byName.get(cookName.toLowerCase()) as { slug?: string; id?: string; area?: string } | undefined;
      return {
        id: String(p.id),
        name: String(p.name),
        cook_name: cookName,
        cook_id: p.cook_id ? String(p.cook_id) : hit?.id ? String(hit.id) : undefined,
        cook_slug: p.cook_slug
          ? String(p.cook_slug)
          : hit?.slug
            ? String(hit.slug)
            : hit?.id
              ? String(hit.id)
              : undefined,
        price: Number(p.price),
        cuisine: p.cuisine ? String(p.cuisine) : undefined,
        area: p.area ? String(p.area) : hit?.area ? String(hit.area) : p.cook_area ? String(p.cook_area) : undefined,
        image_url: getDishImageUrl({
          id: String(p.id),
          cuisine: p.cuisine ? String(p.cuisine) : undefined,
          name: String(p.name),
          image_url: p.image_url as string | undefined,
        }),
        rating: coerceRating(p.rating),
      };
    });
    return buildSearchResultGroups(inputs, query);
  }, [isSearching, filteredProducts, cookList, query]);

  const searchDishes = useMemo(
    () =>
      searchGroups.dishes.map((d) => ({
        ...toDishCard(d as DishCardProduct),
        kitchenLabel: d.kitchenLabel,
        kitchenCount: d.kitchenCount,
      })),
    [searchGroups.dishes]
  );

  const searchKitchens = searchGroups.kitchens;

  const gridProducts = useMemo(() => {
    if (!isSearching) return filteredProducts;
    if (mode !== 'dishes') return [];
    return searchDishes as typeof filteredProducts;
  }, [isSearching, mode, filteredProducts, searchDishes]);

  const forYou = useMemo(() => {
    if (isSearching) return null;
    const asCards = (items: Array<{ id: string; name: string; cook_name?: string; price: number; cuisine?: string }>) =>
      items.map((d) =>
        toDishCard({ id: d.id, name: d.name, cook_name: d.cook_name || '', price: d.price, cuisine: d.cuisine })
      ) as DishCardProduct[];
    const reorder = sortReorderDishesByProximity(
      extractReorderDishes(orders as Record<string, unknown>[], cookAreaById),
      proximity
    );
    const topRated = sortByCookProximity(
      topRatedCategoryDishes(productList as Record<string, unknown>[], 8) as Array<{ cook_area?: string }>,
      proximity
    );
    return customerForYouRail(browseConfig, {
      reorder: asCards(reorder),
      saved: asCards(favoritesToReorderDishes(favorites)),
      topRated: topRated.map((p) => toDishCard(p as DishCardProduct)) as DishCardProduct[],
    });
  }, [isSearching, orders, favorites, productList, browseConfig, proximity, cookAreaById]);

  const headerLocation = proximityLabel || 'Near you';
  const isGuest = !user;

  const sortedCookList = useMemo(
    () => sortByCookProximity(cookList, proximity),
    [cookList, proximity]
  );
  const kitchenCards = useMemo(() => {
    if (!isSearching) return sortedCookList;
    return searchKitchens.map((k) => ({
      id: k.routeKey,
      slug: k.routeKey,
      display_name: k.cook_name,
      name: k.cook_name,
      area: k.area,
      rating: k.rating,
      story:
        k.matchingDishCount === 1
          ? k.sampleDishNames[0]
          : `${k.matchingDishCount} matching dishes · ${k.sampleDishNames.slice(0, 2).join(', ')}`,
      cover: k.image_url,
    }));
  }, [isSearching, sortedCookList, searchKitchens]);
  const gridHeading = isSearching
    ? {
        title: `Dishes for “${query.trim()}”`,
        hint:
          searchDishes.some((d) => (d.kitchenCount ?? 0) > 1)
            ? 'Same dish at multiple kitchens is labelled for you'
            : 'Tap a dish for details · kitchens that cook it are under Kitchens',
      }
    : discoverGridHeading(mode, filters, Boolean(proximity));
  const kitchensHeading = isSearching
    ? {
        title:
          searchKitchens.length === 1
            ? `1 kitchen for “${query.trim()}”`
            : `${searchKitchens.length} kitchens for “${query.trim()}”`,
        hint: searchKitchens.length > 0 ? 'Tap a kitchen to open their page' : undefined,
      }
    : discoverKitchensHeading(cookList.length, Boolean(proximity));
  const emptyCopy = isSearching
    ? {
        title: mode === 'kitchens' ? 'No kitchens match that search' : 'No dishes match that search',
        description:
          mode === 'kitchens'
            ? 'Try another kitchen name, or switch to Dishes to search by food.'
            : 'Try a dish name, cuisine, or switch to Kitchens.',
      }
    : customerDiscoverEmptyCopy(browseConfig, mode, discoverActiveFilters(filters).length > 0);

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
    (product: DishCardProduct) =>
      customerIsPopularDish(product as Record<string, unknown>, productList as Record<string, unknown>[], browseConfig.popular),
    [productList, browseConfig.popular]
  );

  const goToProduct = useCallback((id: string) => router.push(`/product/${id}`), [router]);

  const handleAddToCart = useCallback(
    (productId: string, qty = 1) => {      addMut.mutate({ productId, qty });
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
    if (veganOnly) toggleVeganOnly();
    if (chickenOnly) toggleChickenOnly();
    if (excludeNuts) toggleExcludeNuts();
    if (maxCal != null) setMaxCal(undefined);
  }, [halalOnly, vegetarianOnly, veganOnly, chickenOnly, excludeNuts, maxCal, toggleHalalOnly, toggleVegetarianOnly, toggleVeganOnly, toggleChickenOnly, toggleExcludeNuts, setMaxCal]);

  const handleHomePromoPress = useCallback(
    (id: string) => {
      const promo = homePromos.find((item) => item.id === id);
      if (!promo) return;
      // Occasions browse removed from discover — use promo route only.
      router.push(promo.webRoute);
    },
    [homePromos, router]
  );

  const renderSection = (id: string) => {
    switch (id) {
      case 'search-results':
        return null;

      case 'guest':
        return null;

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
            {locationReady && !proximity ? (
              <LocationNudgeBanner onPress={() => router.push('/location')} />
            ) : null}
            <GourmeatModeSwitch
              modes={browseConfig.discover_modes}
              activeId={mode}
              onSelect={(id) => setMode(id as DiscoverModeId)}
            />
          </div>
        );

      case 'cuisine-rail':
        return (
          <GourmeatCategoryRow
            items={cuisineItems}
            active={cuisineFilter}
            onSelect={(id) => setCuisineFilter(id === cuisineFilter ? '' : id)}
            testID="cuisine-gourmeat-row"
          />
        );

      case 'kitchen-list':
        return (
          <div data-testid="home-kitchens-section">
            <GourmeatSectionTitle
              title={
                !isSearching && cooksLoading && cookList.length === 0
                  ? 'Home kitchens'
                  : kitchensHeading.title
              }
              actionLabel={isSearching ? undefined : 'Tiffin plans'}
              actionHref={isSearching ? undefined : '/tiffin'}
            />
            {kitchensHeading.hint && !(cooksLoading && !isSearching) ? (
              <p className="text-xs font-semibold text-muted-foreground mb-3 -mt-1">
                {isSearching ? (
                  kitchensHeading.hint
                ) : (
                  <Link href="/location" className="text-primary hover:underline">
                    {kitchensHeading.hint}
                  </Link>
                )}
              </p>
            ) : null}
            {!isSearching && cooksLoading && kitchenCards.length === 0 ? (
              <SHCSkeletonKitchenList count={3} />
            ) : kitchenCards.length === 0 ? (
              isSearching ? (
                <SearchNoResultsRequestCard query={query} requestHref="/request" />
              ) : (
                <SHCEmptyState title={emptyCopy.title} description={emptyCopy.description} />
              )
            ) : (
              <ul>
                {kitchenCards.map((c) => {
                  const cid = String(c.id || c.slug || '');
                  const slug = String(c.slug || c.id || '');
                  const distanceLabel =
                    !isSearching && proximity
                      ? formatDistanceKm(distanceToCookItemKm(proximity, c))
                      : null;
                  return (
                    <li key={cid || slug}>
                      <TiffinKitchenCard
                        cookId={cid || slug}
                        cookName={String(c.display_name || c.name || 'Home kitchen')}
                        area={c.area ? String(c.area) : undefined}
                        distanceKm={distanceLabel ? distanceToCookItemKm(proximity, c) : null}
                        tagline={c.story ? String(c.story).slice(0, 80) : undefined}
                        coverUri={
                          (c as { cover?: string }).cover || getCookKitchenHeroUrl(cid || slug)
                        }
                        rating={c.rating != null ? Number(c.rating) : undefined}
                        reviewCount={
                          (c as { review_count?: number }).review_count != null
                            ? Number((c as { review_count?: number }).review_count)
                            : undefined
                        }
                        subscriberCount={
                          (c as { subscriber_count?: number }).subscriber_count != null
                            ? Number((c as { subscriber_count?: number }).subscriber_count)
                            : undefined
                        }
                        onPress={() => {
                          if (slug) router.push(`/cook/${encodeURIComponent(slug)}`);
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
              isSearching ? (
                <SearchNoResultsRequestCard query={query} requestHref="/request" />
              ) : (
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
              )
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

      {/* Mobile chrome — compact location + profile; desktop uses AppHeader */}
      <div className="md:hidden">
        <GourmeatHomeHeader
          locationLabel={headerLocation}
          locationHint="Collect from"
          avatarUri={user?.name ? getCookAvatarUrl(user.id, user.name) : undefined}
          showLoginTag={isGuest}
          profileHref={isGuest ? '/login' : '/profile'}
          locationHref="/location"
        />
      </div>
      {/* Desktop: location row only (no marketing headline — more catalogue space) */}
      <div className="hidden md:block mb-3">
        <GourmeatHomeHeader
          locationLabel={headerLocation}
          locationHint="Collect from"
          avatarUri={user?.name ? getCookAvatarUrl(user.id, user.name) : undefined}
          showLoginTag={isGuest}
          profileHref={isGuest ? '/login' : '/profile'}
          locationHref="/location"
        />
      </div>

      {/* Single control surface — search + every filter, pinned so it is reachable at any scroll depth */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-background/95 backdrop-blur md:hidden">
        <GourmeatSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search dish, kitchen, under 450 cal…"
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
        mealTypeChips={browseConfig.meal_type_chips}
        mealType={mealType}
        onMealTypeChange={(id) => setMealType(id as MealTypeId)}
        cuisines={cuisineItems}
        cuisine={cuisineFilter}
        onCuisineChange={setCuisineFilter}
        halalOnly={halalOnly}
        vegetarianOnly={vegetarianOnly}
        veganOnly={veganOnly}
        chickenOnly={chickenOnly}
        excludeNuts={excludeNuts}
        lightOnly={maxCal != null}
        maxCal={maxCal}
        onToggleHalal={toggleHalalOnly}
        onToggleVegetarian={toggleVegetarianOnly}
        onToggleVegan={toggleVeganOnly}
        onToggleChicken={toggleChickenOnly}
        onToggleExcludeNuts={toggleExcludeNuts}
        onToggleLight={toggleLight}
        onMaxCalChange={setMaxCal}
        onClear={clearFilters}
        resultCount={filteredProducts.length}
        activeCount={activeFilterCount}
      />
    </section>
  );
}
