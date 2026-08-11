import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import {
  GourmeatHomeHeader,
  GourmeatSearchBar,
  GourmeatCategoryRow,
  GourmeatDishCard,
  GourmeatSectionTitle,
  GourmeatModeSwitch,
  gourmeatColors,
  type GourmeatCategoryItem,
  type SHCDishCardData,
  shcSpacing,
  shcSectionStack,
  SHCFoodImage,
  SHCZomatoDishRowRail,
  SHCHomePromoCarousel,
  SHCRequestDishHomeCTA,
  SHCSearchNoResultsRequestCard,
  SHCTiffinKitchenCard,
  SHCDiscoverFilterSheet,
  DirectionalTabScreen,
  SHCSkeletonDishGrid,
  SHCSkeletonCookingSoonRail,
  SHCSkeletonKitchenList,
  contentPadForTabBar,
  useSHCTray,
} from '@shc/ui';
import { SHCLocationNudgeBanner } from '@shc/ui/location-ux';
import {
  BENTO_ACTION_IMAGES,
  getDishImageUrl,
  getCookKitchenHeroUrl,
  getDropImageUrl,
  getCookAvatarUrl,
  extractReorderDishes,
  favoritesToReorderDishes,
  buildCookAreaById,
  sortReorderDishesByProximity,
  sortByCookProximity,
  distanceToCookItemKm,
  formatDistanceKm,
  filterDiscoverProducts,
  formatDropCookDate,
  formatDropOrderBy,
  formatDropPrice,
  filterCustomerCookingSoonDrops,
  topRatedCategoryDishes,
  discoverSections,
  discoverActiveFilterCount,
  discoverActiveFilters,
  discoverGridHeading,
  discoverKitchensHeading,
  customerDiscoverEmptyCopy,
  customerForYouRail,
  customerIsPopularDish,
  clearedDiscoverFilters,
  coerceRating,
  buildSearchResultGroups,
  type DiscoverModeId,
  type MealTypeId,
} from '@shc/utils';
import { useProducts, useAddToCart } from '../../hooks/useProducts';
import { useCustomerLocation } from '../../hooks/useCustomerLocation';
import { useOrders, useDrops } from '../../hooks/useOrder';
import { useAuth } from '../../hooks/useAuth';
import { useGuestAuthGate } from '../../hooks/useGuestAuthGate';
import { useFavorites } from '../../hooks/useFavorites';
import { useDiscoverPrefs } from '../../hooks/useDiscoverPrefs';
import { useCustomerConfig } from '../../hooks/useCustomerConfig';
import { useQuery } from '@tanstack/react-query';
import { getCooks } from '../../lib/api-client';

function toDishCardData(product: Record<string, unknown>): SHCDishCardData {
  const id = String(product.id);
  return {
    id,
    name: String(product.name),
    cook_name: String(product.cook_name || ''),
    price: Number(product.price),
    cuisine: product.cuisine ? String(product.cuisine) : undefined,
    rating: coerceRating(product.rating),
    halal: Boolean(product.halal),
    cook_id: product.cook_id ? String(product.cook_id) : undefined,
    cook_slug: product.cook_slug ? String(product.cook_slug) : product.slug ? String(product.slug) : undefined,
    area: product.area ? String(product.area) : product.cook_area ? String(product.cook_area) : undefined,
    kitchenCount: product.kitchenCount != null ? Number(product.kitchenCount) : undefined,
    kitchenLabel: product.kitchenLabel ? String(product.kitchenLabel) : undefined,
    ...(product.collection_slot ? { collection_slot: String(product.collection_slot) } : {}),
    image_url: getDishImageUrl({
      id,
      cuisine: product.cuisine ? String(product.cuisine) : undefined,
      name: String(product.name),
      image_url: product.image_url as string | undefined,
    }),
  };
}

export default function CustomerDiscover() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const router = useRouter();
  const { openTray, dismiss } = useSHCTray();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<DiscoverModeId>('dishes');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [mealType, setMealType] = useState<MealTypeId>('all');
  const [refreshing, setRefreshing] = useState(false);
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
  const { user } = useAuth();
  const { isGuest, requireAuth } = useGuestAuthGate();
  const addMut = useAddToCart();
  const { data: orders = [] } = useOrders('customer');
  const { data: dropsRaw, isLoading: dropsLoading, refetch: refetchDrops } = useDrops();
  const drops = useMemo(
    () => filterCustomerCookingSoonDrops((dropsRaw as { cook_date?: string; status?: string }[]) || []),
    [dropsRaw]
  );
  const { favorites, toggle, isFavorite } = useFavorites();
  const { data: products, isLoading, refetch: refetchProducts } = useProducts('');
  const productList = products ?? [];
  const { data: cooks, isLoading: cooksLoading, refetch: refetchCooks } = useQuery({
    queryKey: ['cooks'],
    queryFn: getCooks,
    staleTime: 60_000,
  });
  const cookList = (cooks as any[]) ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchDrops(),
        refetchProducts(),
        refetchCooks(),
        qc.invalidateQueries({ queryKey: ['drops'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [qc, refetchCooks, refetchDrops, refetchProducts]);

  useFocusEffect(
    useCallback(() => {
      void refetchDrops();
    }, [refetchDrops])
  );

  const { proximity, proximityLabel, ready: locationReady } = useCustomerLocation();

  const sortedCookList = useMemo(
    () => (proximity ? sortByCookProximity(cookList, proximity) : cookList),
    [cookList, proximity]
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
    return proximity ? sortByCookProximity(list, proximity) : list;
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
  const searchGroups = useMemo(() => {
    if (!isSearching) return { kitchens: [], dishes: [] as ReturnType<typeof buildSearchResultGroups>['dishes'] };
    const raw = filteredProducts.map((p) => {
      const d = toDishCardData(p);
      return {
        id: d.id,
        name: d.name,
        cook_name: d.cook_name,
        cook_id: d.cook_id || (p.cook_id ? String(p.cook_id) : undefined),
        cook_slug:
          d.cook_slug ||
          (p.cook_slug ? String(p.cook_slug) : undefined) ||
          (p.cook_id ? String(p.cook_id) : undefined),
        price: d.price,
        cuisine: d.cuisine,
        area: d.area || (p.cook_area ? String(p.cook_area) : undefined),
        image_url: d.image_url,
        rating: d.rating,
      };
    });
    // Enrich cook_slug from cooks list when products only have cook_name
    const byName = new Map(
      ((cookList as any[]) || []).map((c) => [
        String(c.display_name || c.name || '').toLowerCase(),
        { slug: c.slug, id: c.id, area: c.area },
      ])
    );
    const enriched = raw.map((r) => {
      if (r.cook_slug) return r;
      const hit = byName.get(String(r.cook_name || '').toLowerCase()) as
        | { slug?: string; id?: string; area?: string }
        | undefined;
      if (!hit) return r;
      return {
        ...r,
        cook_slug: hit.slug ? String(hit.slug) : hit.id ? String(hit.id) : undefined,
        cook_id: r.cook_id || (hit.id ? String(hit.id) : undefined),
        area: r.area || (hit.area ? String(hit.area) : undefined),
      };
    });
    return buildSearchResultGroups(enriched, query);
  }, [isSearching, filteredProducts, query, cookList]);

  const searchDishes = useMemo(
    () =>
      searchGroups.dishes.map((d) => ({
        ...toDishCardData(d as unknown as Record<string, unknown>),
        kitchenCount: d.kitchenCount,
        kitchenLabel: d.kitchenLabel,
        cook_id: d.cook_id,
        cook_slug: d.cook_slug,
      })),
    [searchGroups.dishes]
  );

  const searchKitchens = searchGroups.kitchens;

  /** Dishes tab while searching uses multi-kitchen labels; otherwise full catalogue. */
  const gridProducts = useMemo(() => {
    if (!isSearching) return filteredProducts;
    if (mode !== 'dishes') return [];
    return searchDishes as unknown as Record<string, unknown>[];
  }, [isSearching, mode, filteredProducts, searchDishes]);

  const { categories, promos: homePromos, config: browseConfig } = useCustomerConfig();

  const cookAreaById = useMemo(() => buildCookAreaById(cookList, productList), [cookList, productList]);

  const forYou = useMemo(() => {
    if (isSearching) return null;
    const reorder = sortReorderDishesByProximity(
      extractReorderDishes(orders as Record<string, unknown>[], cookAreaById),
      proximity
    );
    const topRated = sortByCookProximity(
      topRatedCategoryDishes(productList as Record<string, unknown>[], 8) as Array<{ cook_area?: string }>,
      proximity
    );
    return customerForYouRail(browseConfig, {
      reorder: reorder.map((d) =>
        toDishCardData({ id: d.id, name: d.name, cook_name: d.cook_name, price: d.price, cuisine: d.cuisine })
      ),
      saved: favoritesToReorderDishes(favorites).map((d) =>
        toDishCardData({ id: d.id, name: d.name, cook_name: d.cook_name, price: d.price, cuisine: d.cuisine })
      ),
      topRated: topRated.map(toDishCardData),
    });
  }, [isSearching, orders, favorites, productList, browseConfig, proximity, cookAreaById]);

  const cuisineCategories: GourmeatCategoryItem[] = categories.map((c) => ({
    id: c.id,
    label: c.label,
    iconKey: 'restaurant' as const,
    imageUrl: c.imageUrl,
  }));

  const headerLocationLabel = proximityLabel || 'Near you';
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

  const kitchenCards = useMemo(() => {
    if (!isSearching) return sortedCookList as any[];
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

  const goToProduct = (id: string) => router.push(`/(customer)/product/${id}` as any);

  const handleAddToCart = useCallback(
    (productId: string, qty = 1) => {      addMut.mutate({ productId, qty });
    },
    [requireAuth, addMut]
  );

  const handleFavorite = useCallback(
    (item: Record<string, unknown>) => {
      const id = String(item.id);
      toggle({
        id,
        name: String(item.name),
        cook_name: String(item.cook_name || ''),
        price: Number(item.price || 0),
        cuisine: item.cuisine ? String(item.cuisine) : undefined,
      });
    },
    [toggle]
  );

  const checkPopular = useCallback(
    (item: Record<string, unknown>) =>
      customerIsPopularDish(item, productList as Record<string, unknown>[], browseConfig.popular),
    [productList, browseConfig.popular]
  );

  const clearFilters = useCallback(() => {
    const cleared = clearedDiscoverFilters();
    setMealType(cleared.mealType);
    setCuisineFilter(cleared.cuisine);
    if (halalOnly) toggleHalalOnly();
    if (vegetarianOnly) toggleVegetarianOnly();
    if (veganOnly) toggleVeganOnly();
    if (chickenOnly) toggleChickenOnly();
    if (excludeNuts) toggleExcludeNuts();
    if (maxCal != null) setMaxCal(undefined);
  }, [
    halalOnly,
    vegetarianOnly,
    veganOnly,
    chickenOnly,
    excludeNuts,
    maxCal,
    toggleHalalOnly,
    toggleVegetarianOnly,
    toggleVeganOnly,
    toggleChickenOnly,
    toggleExcludeNuts,
    setMaxCal,
    setMaxCal,
  ]);

  const openFilters = useCallback(() => {
    openTray(
      { id: 'discover-filters', title: 'Filters', height: 'tall' },
      () => (
        <SHCDiscoverFilterSheet
          mealTypeChips={browseConfig.meal_type_chips}
          mealType={mealType}
          onMealTypeChange={(id) => setMealType(id as MealTypeId)}
          cuisines={cuisineCategories.map((c) => ({ id: c.id, label: c.label }))}
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
          onApply={dismiss}
          resultCount={filteredProducts.length}
          activeCount={activeFilterCount}
        />
      )
    );
  }, [
    openTray,
    dismiss,
    mealType,
    cuisineCategories,
    cuisineFilter,
    halalOnly,
    vegetarianOnly,
    veganOnly,
    chickenOnly,
    excludeNuts,
    maxCal,
    toggleHalalOnly,
    toggleVegetarianOnly,
    toggleVeganOnly,
    toggleChickenOnly,
    toggleExcludeNuts,
    toggleLight,
    setMaxCal,
    clearFilters,
    filteredProducts.length,
    activeFilterCount,
  ]);

  const handleHomePromoPress = useCallback(
    (id: string) => {
      const promo = homePromos.find((item) => item.id === id);
      if (!promo) return;
      // Occasions browse removed from discover — use promo route only.
      router.push(promo.mobileRoute as any);
    },
    [homePromos, router]
  );

  const colWidth = (Dimensions.get('window').width - shcSpacing.md * 2 - shcSpacing.sm) / 2;

  const renderItem = useCallback(
    ({ item }: { item: Record<string, unknown> }) => (
      <View style={{ width: colWidth, paddingBottom: shcSpacing.md }}>
        <GourmeatDishCard
          dish={toDishCardData(item)}
          onPress={() => goToProduct(String(item.id))}
          onAddPress={() => handleAddToCart(String(item.id), 1)}
          isFavorite={isFavorite(String(item.id))}
          onFavoritePress={() => handleFavorite(item)}
          showPopular={checkPopular(item)}
        />
      </View>
    ),
    [colWidth, handleAddToCart, handleFavorite, isFavorite, checkPopular]
  );

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'search-results':
        // Search now uses dish-grid / kitchen-list with the mode switch (kept for safety).
        return null;

      case 'guest':
        // Guest checkout is first-class — no sign-in bar on discover.
        return null;

      case 'promos':
        return <SHCHomePromoCarousel promos={homePromos} onPromoPress={handleHomePromoPress} />;

      case 'cooking-soon':
        return (
          <View testID="home-cooking-soon-rail">
            <GourmeatSectionTitle title="Cooking this week" />
            {dropsLoading && !(Array.isArray(drops) && drops.length > 0) ? (
              <SHCSkeletonCookingSoonRail />
            ) : Array.isArray(drops) && (drops as any[]).length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: shcSpacing.md, gap: 12 }}>
                {(drops as any[]).slice(0, 8).map((d) => (
                  <Pressable
                    key={d.id}
                    testID={`home-drop-${d.id}`}
                    onPress={() => router.push(`/(customer)/drops/${d.id}` as any)}
                    style={styles.dropCard}
                  >
                    <SHCFoodImage
                      uri={getDropImageUrl({ title: d.title, image_url: d.image_url, cook_id: d.cook_id })}
                      height={96}
                      rounded={0}
                      testID={`home-drop-img-${d.id}`}
                    />
                    <View style={{ padding: 14 }}>
                      <Text style={styles.dropEyebrow}>Cooking soon</Text>
                      <Text style={styles.dropTitle} numberOfLines={1}>
                        {d.title}
                      </Text>
                      <Text style={styles.dropMeta} numberOfLines={1}>
                        {d.cook_name || 'Kitchen'} · {formatDropCookDate(d.cook_date)} · {d.collection_slot}
                      </Text>
                      <Text style={styles.dropPrice}>{formatDropPrice(d.price_cents, d.price)}</Text>
                      <Text style={styles.dropMeta}>
                        {d.remaining_qty ?? 0} left · by {formatDropOrderBy(d.order_by)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.dropEmpty} testID="home-cooking-soon-empty">
                <Text style={styles.dropEmptyTitle}>No open batches in the next 7 days</Text>
                <Text style={styles.dropEmptyBody}>
                  Only batches cooking within a week appear here. Pull to refresh after a cook posts.
                </Text>
              </View>
            )}
          </View>
        );

      case 'for-you':
        return forYou ? (
          <View testID="home-for-you-rail">
            <GourmeatSectionTitle title={forYou.title} />
            <SHCZomatoDishRowRail
              title=""
              dishes={forYou.dishes}
              onDishPress={goToProduct}
              testID={`for-you-rail-${forYou.source}`}
            />
          </View>
        ) : null;

      case 'browse-switch':
        return (
          <View style={shcSectionStack}>
            {locationReady && !proximity ? (
              <SHCLocationNudgeBanner onPress={() => router.push('/(customer)/location' as any)} />
            ) : null}
            <GourmeatModeSwitch
              modes={browseConfig.discover_modes}
              activeId={mode}
              onSelect={(id) => setMode(id as DiscoverModeId)}
            />
          </View>
        );

      case 'cuisine-rail':
        return (
          <GourmeatCategoryRow
            categories={cuisineCategories}
            selectedId={cuisineFilter}
            onSelect={(id) => setCuisineFilter(id === cuisineFilter ? '' : id)}
            testID="cuisine-gourmeat-row"
          />
        );

      case 'kitchen-list':
        return (
          <View testID="home-kitchens-section">
            <GourmeatSectionTitle
              title={
                !isSearching && cooksLoading && cookList.length === 0
                  ? 'Home kitchens'
                  : kitchensHeading.title
              }
              actionLabel={isSearching ? undefined : 'Tiffin plans'}
              onActionPress={isSearching ? undefined : () => router.push('/(customer)/tiffin' as any)}
            />
            {kitchensHeading.hint && !(cooksLoading && !isSearching) ? (
              <Pressable
                onPress={() => {
                  if (!isSearching) router.push('/(customer)/location' as any);
                }}
                style={styles.kitchenHintWrap}
                disabled={isSearching}
              >
                <Text style={styles.kitchenHint}>{kitchensHeading.hint}</Text>
              </Pressable>
            ) : null}
            {!isSearching && cooksLoading && kitchenCards.length === 0 ? (
              <SHCSkeletonKitchenList count={3} />
            ) : kitchenCards.length === 0 ? (
              isSearching ? (
                <SHCSearchNoResultsRequestCard
                  query={query}
                  onRequestPress={() => router.push('/(customer)/request' as any)}
                  testID="home-search-no-results-kitchens"
                />
              ) : (
                <View style={styles.empty}>
                  <SHCFoodImage uri={BENTO_ACTION_IMAGES.cart} height={80} rounded={16} />
                  <Text style={styles.emptyTitle}>{emptyCopy.title}</Text>
                  <Text style={styles.emptyText}>{emptyCopy.description}</Text>
                </View>
              )
            ) : (
              kitchenCards.map((c: any) => (
                <View key={c.id || c.slug} style={{ paddingHorizontal: shcSpacing.md }}>
                  <SHCTiffinKitchenCard
                    cookId={c.id || c.slug}
                    cookName={c.display_name || c.name || 'Home kitchen'}
                    area={c.area}
                    distanceKm={!isSearching && proximity ? distanceToCookItemKm(proximity, c) : null}
                    tagline={c.story ? String(c.story).slice(0, 80) : undefined}
                    rating={c.rating != null ? Number(c.rating) : undefined}
                    reviewCount={c.review_count}
                    subscriberCount={c.subscriber_count}
                    coverUri={c.cover || getCookKitchenHeroUrl(c.id || c.slug)}
                    onPress={() => {
                      const slug = c.slug || c.id;
                      if (slug) router.push(`/(customer)/cook/${slug}` as any);
                    }}
                  />
                </View>
              ))
            )}
          </View>
        );

      case 'dish-grid':
        return (
          <View>
            <GourmeatSectionTitle title={gridHeading.title} testID="all-dishes-header" />
            <Text style={styles.gridHint}>{gridHeading.hint}</Text>
            {isLoading && !isSearching && <SHCSkeletonDishGrid count={6} />}
            {gridProducts.length === 0 && !(isLoading && !isSearching) && (
              isSearching ? (
                <SHCSearchNoResultsRequestCard
                  query={query}
                  onRequestPress={() => router.push('/(customer)/request' as any)}
                  testID="home-search-no-results-dishes"
                />
              ) : (
                <View style={styles.empty}>
                  <SHCFoodImage uri={BENTO_ACTION_IMAGES.cart} height={80} rounded={16} />
                  <Text style={styles.emptyTitle}>{emptyCopy.title}</Text>
                  <Text style={styles.emptyText}>{emptyCopy.description}</Text>
                  {activeFilterCount > 0 ? (
                    <Pressable onPress={clearFilters} style={styles.clearBtn}>
                      <Text style={styles.clearBtnText}>Clear filters</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => router.push('/(customer)/request' as any)} style={styles.clearBtn}>
                      <Text style={styles.clearBtnText}>Request a dish</Text>
                    </Pressable>
                  )}
                </View>
              )
            )}
          </View>
        );

      case 'request':
        return <SHCRequestDishHomeCTA onPress={() => router.push('/(customer)/request' as any)} />;

      default:
        return null;
    }
  };

  const ListHeader = (
    <>
      <GourmeatHomeHeader
        locationLabel={headerLocationLabel}
        locationHint="Collect from"
        avatarUri={user?.name ? getCookAvatarUrl(user.id, user.name) : undefined}
        showLoginTag={isGuest}
        onProfilePress={() =>
          router.push((isGuest ? '/(shared)/auth' : '/(customer)/profile') as any)
        }
        onLocationPress={() => router.push('/(customer)/location' as any)}
        edgeInset={false}
      />

      <GourmeatSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search dish, kitchen, under 450 cal…"
        onFilterPress={openFilters}
        filterCount={activeFilterCount}
        edgeInset={false}
        testID="search-input"
      />

      {sections
        .filter((section) => section.id !== 'request')
        .map((section) => (
          <View key={section.id} testID={section.testID} style={shcSectionStack}>
            {renderSection(section.id)}
          </View>
        ))}
    </>
  );

  const ListFooter = sections.some((s) => s.id === 'request') ? (
    <View testID="discover-section-request" style={shcSectionStack}>
      {renderSection('request')}
    </View>
  ) : null;

  return (
    <DirectionalTabScreen testID="discover-tab-scene">
      <View style={[styles.screen, { paddingTop: insets.top }]} testID="customer-discover-screen">
        <View style={styles.list}>
          <FlashList
            data={gridProducts}
            extraData={mode}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            contentContainerStyle={[styles.listContent, { paddingBottom: contentPadForTabBar(insets.bottom) }]}
            testID="dish-list-container"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={gourmeatColors.primary} />
            }
          />
        </View>
      </View>
    </DirectionalTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  list: { flex: 1 },
  searchOverlay: { zIndex: 20, elevation: 12, paddingHorizontal: shcSpacing.md },
  listContent: { paddingHorizontal: shcSpacing.md },
  gridHint: {
    paddingHorizontal: shcSpacing.md,
    fontSize: 12,
    color: gourmeatColors.textLight,
    fontWeight: '600',
    marginBottom: shcSpacing.sm,
  },
  kitchenHintWrap: { paddingHorizontal: shcSpacing.md, marginBottom: shcSpacing.sm },
  kitchenHint: { fontSize: 12, fontWeight: '600', color: gourmeatColors.primary },
  dropCard: {
    width: 240,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.surface,
    overflow: 'hidden',
  },
  dropEyebrow: { fontSize: 11, fontWeight: '900', color: gourmeatColors.primary, textTransform: 'uppercase' },
  dropTitle: { marginTop: 4, fontSize: 16, fontWeight: '900', color: gourmeatColors.text },
  dropMeta: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight },
  dropPrice: { marginTop: 8, fontSize: 14, fontWeight: '800', color: gourmeatColors.primary },
  dropEmpty: {
    marginHorizontal: shcSpacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.surface,
    padding: 16,
  },
  dropEmptyTitle: { fontSize: 14, fontWeight: '800', color: gourmeatColors.text },
  dropEmptyBody: { marginTop: 6, fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight },
  empty: { alignItems: 'center', paddingVertical: shcSpacing.xl, gap: shcSpacing.sm, paddingHorizontal: shcSpacing.md },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: gourmeatColors.text, textAlign: 'center' },
  emptyText: { fontSize: 13, color: gourmeatColors.textLight, fontWeight: '500', textAlign: 'center' },
  clearBtn: {
    marginTop: shcSpacing.sm,
    paddingHorizontal: shcSpacing.lg,
    paddingVertical: shcSpacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
  },
  clearBtnText: { fontSize: 13, fontWeight: '700', color: gourmeatColors.primary },
});
