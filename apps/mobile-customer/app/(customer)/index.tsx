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
  gourmeatColors,
  type GourmeatCategoryItem,
  type SHCDishCardData,
  shcSpacing,
  shcSectionStack,
  SHCFoodImage,
  SHCSearchResultsPanel,
  SHCGuestBrowseBar,
  SHCZomatoDishRowRail,
  SHCFilterChipRow,
  SHCPromoRail,
  SHCRequestDishHomeCTA,
  SHCTiffinHeroBanner,
  SHCTiffinKitchenCard,
  SHCTiffinFilterChips,
  DirectionalTabScreen,
  SHCSkeletonDishGrid,
  SHCSkeletonCookingSoonRail,
  SHCSkeletonKitchenList,
  contentPadForTabBar,
} from '@shc/ui';
import {
  getOccasionImageUrl,
  BENTO_ACTION_IMAGES,
  PROMO_BANNER_IMAGES,
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
    rating: product.rating ? Number(product.rating) : 4.8,
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

/** Order-mode tabs under popular — one meal vs event/occasion (HomelyEats meal-type strip). */
const ORDER_MODES = [
  { id: 'popular', label: 'Popular' },
  { id: 'one-off', label: 'One meal' },
  { id: 'occasion', label: 'Events' },
];

export default function CustomerDiscover() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [occasionFilter, setOccasionFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [orderMode, setOrderMode] = useState('popular');
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { halalOnly, maxCal, toggleHalalOnly, toggleLight } = useDiscoverPrefs();
  const { user } = useAuth();
  const { isGuest, requireAuth } = useGuestAuthGate();
  const addMut = useAddToCart();
  const { data: orders = [] } = useOrders('customer');
  const { data: dropsRaw, isLoading: dropsLoading, refetch: refetchDrops } = useDrops();
  /** Customer: only batches cooking within next 7 days */
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

  // Re-fetch Cooking soon every time Home tab gains focus
  useFocusEffect(
    useCallback(() => {
      void refetchDrops();
    }, [refetchDrops])
  );
  const { active: collectionLocation, locationLabel } = useCustomerLocation();
  const router = useRouter();

  const savedDishes = useMemo(() => {
    if (query.trim()) return [];
    return favoritesToReorderDishes(favorites).map((d) => ({
      ...toDishCardData({ id: d.id, name: d.name, cook_name: d.cook_name, price: d.price, cuisine: d.cuisine }),
      image_url: getDishImageUrl({
        id: d.id,
        name: d.name,
        cuisine: d.cuisine,
        image_url: (d as { image_url?: string }).image_url,
      }),
    }));
  }, [favorites, query]);

  const goToProduct = (id: string) => router.push(`/(customer)/product/${id}` as any);

  const handleAddToCart = useCallback(
    (productId: string, qty = 1) => {
      if (!requireAuth('Browse freely — sign in to add dishes to your cart.')) return;
      addMut.mutate({ productId, qty });
    },
    [requireAuth, addMut]
  );

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

  const filteredProducts = useMemo(() => {
    const list = filterDiscoverProducts(productList as Record<string, unknown>[], {
      query,
      occasion: occasionFilter || undefined,
      cuisine: cuisineFilter || undefined,
      halalOnly: halalOnly || undefined,
      maxCal,
    });
    return collectionLocation?.lat != null && collectionLocation?.lng != null
      ? sortByCookProximity(list, { lat: collectionLocation.lat, lng: collectionLocation.lng })
      : list;
  }, [productList, query, cuisineFilter, occasionFilter, halalOnly, maxCal, collectionLocation]);

  const dishList = useMemo(() => filteredProducts.map(toDishCardData), [filteredProducts]);

  const searchDishes = useMemo(() => (query.trim() ? dishList : []), [dishList, query]);

  const reorderDishes = useMemo(() => {
    if (query.trim()) return [];
    return extractReorderDishes(orders as Record<string, unknown>[]).map((d) => ({
      ...toDishCardData({ id: d.id, name: d.name, cook_name: d.cook_name, price: d.price, cuisine: d.cuisine }),
      image_url: getDishImageUrl({
        id: d.id,
        name: d.name,
        cuisine: d.cuisine,
        image_url: (d as { image_url?: string }).image_url,
      }),
    }));
  }, [orders, query]);

  const colWidth = (Dimensions.get('window').width - shcSpacing.md * 2 - shcSpacing.sm) / 2;

  const gridProducts = useMemo(() => (query.trim() ? [] : filteredProducts), [filteredProducts, query]);

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

  const renderItem = useCallback(
    ({ item }: { item: Record<string, unknown> }) => (
      <View style={{ width: colWidth, paddingBottom: shcSpacing.md }}>
        <GourmeatDishCard
          dish={toDishCardData(item)}
          onPress={() => goToProduct(String(item.id))}
          onAddPress={() => handleAddToCart(String(item.id), 1)}
          isFavorite={isFavorite(String(item.id))}
          onFavoritePress={() => handleFavorite(item)}
        />
      </View>
    ),
    [colWidth, handleAddToCart, handleFavorite, isFavorite]
  );

  const headerLocationLabel = collectionLocation ? locationLabel : 'Set collection location';

  const ListFooter = !query.trim() ? (
    <SHCRequestDishHomeCTA onPress={() => router.push('/(customer)/request' as any)} />
  ) : null;

  const ListHeader = (
    <>
      {/* Full marketplace homepage — subscription is only a banner, not the whole page */}
      <GourmeatHomeHeader
        headline="Hungry? Order & Eat."
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
        onFilterPress={() => router.push('/(customer)/search' as any)}
        edgeInset={false}
        testID="search-input"
      />

      {query.trim().length > 0 && (
        <View style={[styles.searchOverlay, { paddingHorizontal: shcSpacing.md }]}>
          <SHCSearchResultsPanel
            query={query}
            dishes={searchDishes}
            onDishPress={goToProduct}
            onAddPress={(id) => handleAddToCart(id, 1)}
            onClose={() => setQuery('')}
          />
        </View>
      )}

      {isGuest && (
        <SHCGuestBrowseBar onSignInPress={() => router.push('/(shared)/auth' as any)} />
      )}

      {/* ① Subscription promo only — encourages tiffin; rest of page is one-off / events */}
      {!query && !promoDismissed && (
        <View testID="home-tiffin-promo" style={styles.promoWrap}>
            <Pressable onPress={() => setPromoDismissed(true)} style={styles.promoClose} hitSlop={12} testID="home-promo-dismiss">
              <Text style={styles.promoCloseText}>✕</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(customer)/tiffin' as any)}>
              <SHCTiffinHeroBanner
                title="No time to cook?"
                highlight="Explore tiffin plans ✨"
                bullets={[
                  'Weekly home-cooked meals from one kitchen',
                  'Or keep scrolling to order single dishes & events',
                  'Flexible 2 · 3 · 4 meals per week',
                ]}
              />
            </Pressable>
        </View>
      )}

      {/* ② Explore by categories — cuisine */}
      {!query && (
        <GourmeatCategoryRow
          title="Explore by categories"
          categories={cuisineCategories}
          selectedId={cuisineFilter}
          onSelect={(id) => {
            setCuisineFilter(id);
            if (id) {
              router.push(`/(customer)/category/${encodeURIComponent(id)}` as any);
            }
          }}
          testID="cuisine-gourmeat-row"
        />
      )}

      {/* ③ Most popular for one meal / event orders */}
      {!query && (
        <View>
          <GourmeatSectionTitle title="Most popular choices" testID="most-popular-header" />
          <View style={{ marginBottom: shcSpacing.sm }}>
            <SHCTiffinFilterChips
              chips={ORDER_MODES}
              activeId={orderMode}
              onSelect={(id) => {
                setOrderMode(id);
                if (id === 'occasion') {
                  /* keep occasion row visible; soft-focus events */
                } else if (id === 'one-off') {
                  setOccasionFilter('');
                }
              }}
            />
          </View>
          {(orderMode === 'popular' || orderMode === 'one-off') && reorderDishes.length > 0 && (
            <SHCZomatoDishRowRail
              title=""
              dishes={reorderDishes}
              onDishPress={goToProduct}
              testID="order-again-rail"
            />
          )}
          {orderMode === 'occasion' && (
            <GourmeatCategoryRow
              categories={occasionCategories}
              selectedId={occasionFilter}
              onSelect={setOccasionFilter}
            />
          )}
        </View>
      )}

      {/* Offer — weekly tiffin subscription */}
      {!query && (
        <Pressable
          style={styles.offerCard}
          testID="home-offer-card"
          onPress={() => router.push('/(customer)/tiffin' as any)}
        >
          <Text style={styles.offerTitle}>Subscribe for weekly tiffin</Text>
          <Text style={styles.offerSub}>
            Banner only — below you can still order one dish or a full occasion spread.
          </Text>
        </Pressable>
      )}

      {/* Event / occasion rail */}
      {!query && (
        <SHCPromoRail
            promos={[
              { id: 'hari-raya', title: 'Hari Raya spreads', subtitle: 'Order for the open house', imageUrl: PROMO_BANNER_IMAGES.hariRaya, badge: 'Event', iconKey: 'people' },
              { id: 'cny', title: 'CNY reunion', subtitle: 'Plan 2 weeks ahead', imageUrl: PROMO_BANNER_IMAGES.family, badge: 'Event', iconKey: 'people' },
              { id: 'request', title: 'Request a dish', subtitle: 'Custom occasion menu', imageUrl: PROMO_BANNER_IMAGES.request, badge: 'Custom', iconKey: 'discover' },
            ]}
            onPromoPress={(id) => {
              if (id === 'hari-raya') setOccasionFilter('Hari Raya');
              else if (id === 'cny') setOccasionFilter('Chinese New Year');
              else router.push('/(customer)/request' as any);
            }}
        />
      )}

      {/* Cooking soon — skeleton while fetching; empty only when settled */}
      {!query && (
        <View testID="home-cooking-soon-rail">
          <GourmeatSectionTitle title="Cooking soon near you" />
          {dropsLoading && !(Array.isArray(drops) && drops.length > 0) ? (
            <SHCSkeletonCookingSoonRail />
          ) : Array.isArray(drops) && (drops as any[]).length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: shcSpacing.md, gap: 12 }}>
              {(drops as any[]).slice(0, 8).map((d) => (
                <Pressable
                  key={d.id}
                  testID={`home-drop-${d.id}`}
                  onPress={() => router.push(`/(customer)/drops/${d.id}` as any)}
                  style={{
                    width: 240,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: gourmeatColors.border,
                    backgroundColor: gourmeatColors.surface,
                    overflow: 'hidden',
                  }}
                >
                  <SHCFoodImage
                    uri={getDropImageUrl({ title: d.title, image_url: d.image_url, cook_id: d.cook_id })}
                    height={96}
                    rounded={0}
                    testID={`home-drop-img-${d.id}`}
                  />
                  <View style={{ padding: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: gourmeatColors.primary, textTransform: 'uppercase' }}>
                    Cooking soon
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '900', color: gourmeatColors.text }} numberOfLines={1}>
                    {d.title}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight }} numberOfLines={1}>
                    {d.cook_name || 'Kitchen'} · {formatDropCookDate(d.cook_date)} · {d.collection_slot}
                  </Text>
                  <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '800', color: gourmeatColors.primary }}>
                    {formatDropPrice(d.price_cents, d.price)}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: gourmeatColors.textLight }}>
                    {d.remaining_qty ?? 0} left · by {formatDropOrderBy(d.order_by)}
                  </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View
              style={{
                marginHorizontal: shcSpacing.md,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: gourmeatColors.border,
                backgroundColor: gourmeatColors.surface,
                padding: 16,
              }}
              testID="home-cooking-soon-empty"
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: gourmeatColors.text }}>No open batches in the next 7 days</Text>
              <Text style={{ marginTop: 6, fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight }}>
                Only batches cooking within a week appear here. Pull to refresh after a cook posts.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ④ Kitchens near you — browse cooks (one-off or subscribe) */}
      {!query && (cooksLoading || cookList.length > 0) && (
        <View testID="home-kitchens-section">
          <GourmeatSectionTitle
            title={cooksLoading && cookList.length === 0 ? 'Kitchens near you' : `${cookList.length} kitchens near you`}
            actionLabel="Tiffin"
            onActionPress={() => router.push('/(customer)/tiffin' as any)}
          />
          {cooksLoading && cookList.length === 0 ? (
            <SHCSkeletonKitchenList count={3} />
          ) : (
            <>
              <View style={{ paddingHorizontal: shcSpacing.md }}>
                <SHCFilterChipRow
                  chips={[
                    { id: 'halal', label: 'Halal', active: halalOnly },
                    { id: 'light', label: 'Light', active: maxCal === 500 },
                    { id: 'nearest', label: 'Nearest', active: Boolean(collectionLocation) },
                  ]}
                  onChipPress={(id) => {
                    if (id === 'halal') toggleHalalOnly();
                    if (id === 'light') toggleLight();
                    if (id === 'nearest') router.push('/(customer)/location' as any);
                  }}
                  testID="discover-filter-chips"
                />
              </View>
              {cookList.slice(0, 4).map((c: any) => (
                <View key={c.id || c.slug} style={{ paddingHorizontal: shcSpacing.md }}>
                  <SHCTiffinKitchenCard
                    cookId={c.id || c.slug}
                    cookName={c.display_name || c.name || 'Home kitchen'}
                    area={c.area}
                    tagline={c.story ? String(c.story).slice(0, 80) : 'Heritage home cooking'}
                    rating={c.rating != null ? Number(c.rating) : 4.8}
                    reviewCount={c.review_count}
                    subscriberCount={c.subscriber_count}
                    coverUri={getCookKitchenHeroUrl(c.id || c.slug)}
                    isOpen
                    closesAt="HDB collection"
                    onPress={() => {
                      const slug = c.slug || c.id;
                      if (slug) router.push(`/(customer)/cook/${slug}` as any);
                    }}
                  />
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {!query && savedDishes.length > 0 && (
        <View>
          <GourmeatSectionTitle title="Saved for later" />
          <SHCZomatoDishRowRail title="" dishes={savedDishes} onDishPress={goToProduct} testID="saved-dishes-rail" />
        </View>
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
      <Text style={styles.gridHint}>Add to cart for one meal · switch to tiffin above for weekly plans</Text>

      {isLoading && <SHCSkeletonDishGrid count={6} />}
      {gridProducts.length === 0 && !isLoading && (
        <View style={styles.empty}>
          <SHCFoodImage uri={BENTO_ACTION_IMAGES.cart} height={80} rounded={16} />
          <Text style={styles.emptyText}>No dishes match — try another category</Text>
        </View>
      )}
    </>
  );

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
  searchOverlay: { zIndex: 20, elevation: 12 },
  listContent: { paddingHorizontal: shcSpacing.md },
  loading: { textAlign: 'center', fontSize: 24, marginVertical: shcSpacing.md, color: gourmeatColors.textMuted },
  empty: { alignItems: 'center', paddingVertical: shcSpacing.xl, gap: shcSpacing.sm },
  emptyText: { fontSize: 13, color: gourmeatColors.textLight, fontWeight: '500' },
  offerCard: {
    ...shcSectionStack,
    backgroundColor: '#1E3A5F',
    borderRadius: 14,
    padding: shcSpacing.md,
  },
  offerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  offerSub: { fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 4, lineHeight: 17 },
  promoWrap: { position: 'relative' },
  promoClose: {
    position: 'absolute',
    top: 10,
    right: 14,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCloseText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  gridHint: {
    paddingHorizontal: shcSpacing.md,
    fontSize: 12,
    color: gourmeatColors.textLight,
    fontWeight: '600',
    marginBottom: shcSpacing.sm,
  },
});