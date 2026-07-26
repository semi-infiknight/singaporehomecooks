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
  SHCFoodImage,
  SHCSearchResultsPanel,
  SHCGuestBrowseBar,
  SHCZomatoDishRowRail,
  SHCHomePromoCarousel,
  SHCRequestDishHomeCTA,
  SHCTiffinKitchenCard,
  SHCDiscoverFilterSheet,
  DirectionalTabScreen,
  SHCSkeletonDishGrid,
  SHCSkeletonCookingSoonRail,
  SHCSkeletonKitchenList,
  contentPadForTabBar,
  useSHCTray,
} from '@shc/ui';
import {
  getOccasionImageUrl,
  BENTO_ACTION_IMAGES,
  getDishImageUrl,
  getCookKitchenHeroUrl,
  getDropImageUrl,
  getCookAvatarUrl,
  MIND_CUISINE_CATEGORIES,
  getCollectionSlotLabel,
  extractReorderDishes,
  favoritesToReorderDishes,
  sortByCookProximity,
  filterDiscoverProducts,
  formatDropCookDate,
  formatDropOrderBy,
  formatDropPrice,
  filterCustomerCookingSoonDrops,
  discoverHomeHeadline,
  discoverHomePromoCarousel,
  MEAL_TYPE_CHIPS,
  topRatedCategoryDishes,
  isPopularDish,
  DISCOVER_MODES,
  discoverSections,
  discoverForYouRail,
  discoverActiveFilterCount,
  discoverGridHeading,
  discoverKitchensHeading,
  discoverEmptyCopy,
  clearedDiscoverFilters,
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
import { useQuery } from '@tanstack/react-query';
import { getCooks } from '../../lib/api-client';

const OCCASIONS = ['Hari Raya', 'Deepavali', 'Chinese New Year', 'Family Gathering', 'Birthday', 'Wedding', 'Christmas'];

function toDishCardData(product: Record<string, unknown>): SHCDishCardData {
  const id = String(product.id);
  return {
    id,
    name: String(product.name),
    cook_name: String(product.cook_name),
    price: Number(product.price),
    cuisine: product.cuisine ? String(product.cuisine) : undefined,
    rating: product.rating != null ? Number(product.rating) : undefined,
    halal: Boolean(product.halal),
    collection_slot: getCollectionSlotLabel(id),
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
  const [occasionFilter, setOccasionFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [mealType, setMealType] = useState<MealTypeId>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { halalOnly, maxCal, vegetarianOnly, toggleHalalOnly, toggleLight, toggleVegetarianOnly } = useDiscoverPrefs();
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

  const { active: collectionLocation, locationLabel } = useCustomerLocation();

  const filters = useMemo(
    () => ({
      mealType,
      cuisine: cuisineFilter,
      occasion: mode === 'occasions' ? occasionFilter : '',
      halalOnly,
      vegetarianOnly,
      maxCal,
    }),
    [mealType, cuisineFilter, occasionFilter, mode, halalOnly, vegetarianOnly, maxCal]
  );
  const activeFilterCount = discoverActiveFilterCount(filters);

  const filteredProducts = useMemo(() => {
    const list = filterDiscoverProducts(productList as Record<string, unknown>[], {
      query,
      occasion: filters.occasion || undefined,
      cuisine: cuisineFilter || undefined,
      mealType: mealType !== 'all' ? mealType : undefined,
      halalOnly: halalOnly || undefined,
      vegetarianOnly: vegetarianOnly || undefined,
      maxCal,
    });
    return collectionLocation?.lat != null && collectionLocation?.lng != null
      ? sortByCookProximity(list, { lat: collectionLocation.lat, lng: collectionLocation.lng })
      : list;
  }, [productList, query, cuisineFilter, filters.occasion, mealType, halalOnly, vegetarianOnly, maxCal, collectionLocation]);

  const isSearching = query.trim().length > 0;
  const gridProducts = useMemo(() => (isSearching ? [] : filteredProducts), [filteredProducts, isSearching]);
  const dishList = useMemo(() => filteredProducts.map(toDishCardData), [filteredProducts]);
  const searchDishes = useMemo(() => (isSearching ? dishList : []), [dishList, isSearching]);

  const forYou = useMemo(() => {
    if (isSearching) return null;
    return discoverForYouRail<SHCDishCardData>({
      reorder: extractReorderDishes(orders as Record<string, unknown>[]).map((d) =>
        toDishCardData({ id: d.id, name: d.name, cook_name: d.cook_name, price: d.price, cuisine: d.cuisine })
      ),
      saved: favoritesToReorderDishes(favorites).map((d) =>
        toDishCardData({ id: d.id, name: d.name, cook_name: d.cook_name, price: d.price, cuisine: d.cuisine })
      ),
      topRated: topRatedCategoryDishes(productList as Record<string, unknown>[], 8).map(toDishCardData),
    });
  }, [isSearching, orders, favorites, productList]);

  const occasionCategories: GourmeatCategoryItem[] = [
    { id: '', label: 'All', iconKey: 'restaurant' },
    ...OCCASIONS.map((o) => ({
      id: o,
      label:
        o === 'Chinese New Year' ? 'CNY' : o === 'Family Gathering' ? 'Family' : o.length > 12 ? o.split(' ')[0] : o,
      iconKey: 'people' as const,
      imageUrl: getOccasionImageUrl(o),
    })),
  ];

  const cuisineCategories: GourmeatCategoryItem[] = MIND_CUISINE_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    iconKey: 'restaurant' as const,
    imageUrl: c.imageUrl,
  }));

  const headerLocationLabel = collectionLocation ? locationLabel : 'Set collection location';
  const homeGreeting = discoverHomeHeadline(user?.name, user?.email);
  const homePromos = useMemo(() => discoverHomePromoCarousel(), []);
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

  const goToProduct = (id: string) => router.push(`/(customer)/product/${id}` as any);

  const handleAddToCart = useCallback(
    (productId: string, qty = 1) => {
      if (!requireAuth('Browse freely — sign in to add dishes to your cart.')) return;
      addMut.mutate({ productId, qty });
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
    (item: Record<string, unknown>) => isPopularDish(item, productList as Record<string, unknown>[]),
    [productList]
  );

  const clearFilters = useCallback(() => {
    const cleared = clearedDiscoverFilters();
    setMealType(cleared.mealType);
    setCuisineFilter(cleared.cuisine);
    setOccasionFilter(cleared.occasion);
    if (halalOnly) toggleHalalOnly();
    if (vegetarianOnly) toggleVegetarianOnly();
    if (maxCal != null) toggleLight();
  }, [halalOnly, vegetarianOnly, maxCal, toggleHalalOnly, toggleVegetarianOnly, toggleLight]);

  const openFilters = useCallback(() => {
    openTray(
      { id: 'discover-filters', title: 'Filters', height: 'tall' },
      () => (
        <SHCDiscoverFilterSheet
          mealTypeChips={MEAL_TYPE_CHIPS}
          mealType={mealType}
          onMealTypeChange={(id) => setMealType(id as MealTypeId)}
          cuisines={[{ id: '', label: 'All' }, ...cuisineCategories.map((c) => ({ id: c.id, label: c.label }))]}
          cuisine={cuisineFilter}
          onCuisineChange={setCuisineFilter}
          halalOnly={halalOnly}
          vegetarianOnly={vegetarianOnly}
          lightOnly={maxCal != null}
          onToggleHalal={toggleHalalOnly}
          onToggleVegetarian={toggleVegetarianOnly}
          onToggleLight={toggleLight}
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
    maxCal,
    toggleHalalOnly,
    toggleVegetarianOnly,
    toggleLight,
    clearFilters,
    filteredProducts.length,
    activeFilterCount,
  ]);

  const handleHomePromoPress = useCallback(
    (id: string) => {
      const promo = homePromos.find((item) => item.id === id);
      if (!promo) return;
      if (promo.occasionFilter) {
        setMode('occasions');
        setOccasionFilter(promo.occasionFilter);
        return;
      }
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
        return (
          <View style={styles.searchOverlay}>
            <SHCSearchResultsPanel
              query={query}
              dishes={searchDishes}
              onDishPress={goToProduct}
              onAddPress={(id) => handleAddToCart(id, 1)}
              onClose={() => setQuery('')}
            />
          </View>
        );

      case 'guest':
        return <SHCGuestBrowseBar onSignInPress={() => router.push('/(shared)/auth' as any)} />;

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
          <GourmeatModeSwitch
            modes={DISCOVER_MODES}
            activeId={mode}
            onSelect={(id) => setMode(id as DiscoverModeId)}
          />
        );

      case 'cuisine-rail':
        return (
          <GourmeatCategoryRow
            categories={[{ id: '', label: 'All', iconKey: 'restaurant' }, ...cuisineCategories]}
            selectedId={cuisineFilter}
            onSelect={(id) => setCuisineFilter(id === cuisineFilter ? '' : id)}
            testID="cuisine-gourmeat-row"
          />
        );

      case 'occasion-rail':
        return (
          <GourmeatCategoryRow
            categories={occasionCategories}
            selectedId={occasionFilter}
            onSelect={setOccasionFilter}
            testID="occasion-gourmeat-row"
          />
        );

      case 'kitchen-list':
        return (
          <View testID="home-kitchens-section">
            <GourmeatSectionTitle
              title={cooksLoading && cookList.length === 0 ? 'Home kitchens' : kitchensHeading.title}
              actionLabel="Tiffin plans"
              onActionPress={() => router.push('/(customer)/tiffin' as any)}
            />
            {kitchensHeading.hint && !cooksLoading ? (
              <Pressable onPress={() => router.push('/(customer)/location' as any)} style={styles.kitchenHintWrap}>
                <Text style={styles.kitchenHint}>{kitchensHeading.hint}</Text>
              </Pressable>
            ) : null}
            {cooksLoading && cookList.length === 0 ? (
              <SHCSkeletonKitchenList count={3} />
            ) : cookList.length === 0 ? (
              <View style={styles.empty}>
                <SHCFoodImage uri={BENTO_ACTION_IMAGES.cart} height={80} rounded={16} />
                <Text style={styles.emptyTitle}>{emptyCopy.title}</Text>
                <Text style={styles.emptyText}>{emptyCopy.description}</Text>
              </View>
            ) : (
              cookList.map((c: any) => (
                <View key={c.id || c.slug} style={{ paddingHorizontal: shcSpacing.md }}>
                  <SHCTiffinKitchenCard
                    cookId={c.id || c.slug}
                    cookName={c.display_name || c.name || 'Home kitchen'}
                    area={c.area}
                    tagline={c.story ? String(c.story).slice(0, 80) : undefined}
                    rating={c.rating != null ? Number(c.rating) : undefined}
                    reviewCount={c.review_count}
                    subscriberCount={c.subscriber_count}
                    coverUri={getCookKitchenHeroUrl(c.id || c.slug)}
                    onPress={() => {
                      const id = c.id || c.slug;
                      if (id) router.push(`/(customer)/tiffin/kitchen/${id}` as any);
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
            {isLoading && <SHCSkeletonDishGrid count={6} />}
            {gridProducts.length === 0 && !isLoading && (
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
        headline={homeGreeting.headline}
        subtitle={homeGreeting.subtitle}
        locationLabel={headerLocationLabel}
        locationHint="Collect from"
        avatarUri={user?.name ? getCookAvatarUrl(user.id, user.name) : undefined}
        onProfilePress={() => router.push('/(customer)/profile' as any)}
        onLocationPress={() => router.push('/(customer)/location' as any)}
        onNotificationPress={() => router.push('/(customer)/profile' as any)}
        edgeInset={false}
      />

      <GourmeatSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search kitchen, dish or cuisine"
        onFilterPress={openFilters}
        filterCount={activeFilterCount}
        edgeInset={false}
        testID="search-input"
      />

      {sections
        .filter((section) => section.id !== 'request')
        .map((section) => (
          <View key={section.id} testID={section.testID}>
            {renderSection(section.id)}
          </View>
        ))}
    </>
  );

  const ListFooter = !isSearching ? (
    <View testID="discover-section-request">{renderSection('request')}</View>
  ) : null;

  return (
    <DirectionalTabScreen testID="discover-tab-scene">
      <View style={[styles.screen, { paddingTop: insets.top }]} testID="customer-discover-screen">
        <View style={styles.list}>
          <FlashList
            data={gridProducts}
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
