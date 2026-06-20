import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
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
  SHCFadeIn,
  SHCFoodImage,
  SHCSearchResultsPanel,
  SHCGuestBrowseBar,
  SHCActiveOrderBanner,
  SHCZomatoDishRowRail,
  SHCHeritageStoryBanner,
  SHCFilterChipRow,
  SHCPromoRail,
} from '@shc/ui';
import {
  getOccasionImageUrl,
  BENTO_ACTION_IMAGES,
  PROMO_BANNER_IMAGES,
  getDishImageUrl,
  getCookAvatarUrl,
  MIND_CUISINE_CATEGORIES,
  getCollectionSlotLabel,
  extractReorderDishes,
  productMatchesOccasion,
  getActiveOrders,
  getOrderStatusLabel,
  favoritesToReorderDishes,
} from '@shc/utils';
import { useProducts, useAddToCart } from '../../hooks/useProducts';
import { useOrders } from '../../hooks/useOrder';
import { useAuth } from '../../hooks/useAuth';
import { useGuestAuthGate } from '../../hooks/useGuestAuthGate';
import { useFavorites } from '../../hooks/useFavorites';
import { useDiscoverPrefs } from '../../hooks/useDiscoverPrefs';

const OCCASIONS = ['Hari Raya', 'Deepavali', 'Chinese New Year', 'Family Gathering', 'Birthday', 'Wedding', 'Christmas'];

function filterDiscoverProducts(
  products: Record<string, unknown>[],
  opts: {
    query?: string;
    occasion?: string;
    cuisine?: string;
    halalOnly?: boolean;
    maxCal?: number;
  }
) {
  let list = products;
  const q = opts.query?.trim().toLowerCase();
  if (q) {
    list = list.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      const cook = String(p.cook_name || '').toLowerCase();
      const cuisine = String(p.cuisine || '').toLowerCase();
      const tags = (Array.isArray(p.occasion_tags) ? p.occasion_tags : []).map((t) => String(t).toLowerCase());
      return (
        name.includes(q) ||
        cook.includes(q) ||
        cuisine.includes(q) ||
        String(p.id || '').toLowerCase().includes(q) ||
        tags.some((t) => t.includes(q) || q.includes(t.replace(/-/g, ' ')))
      );
    });
  }
  if (opts.cuisine) list = list.filter((p) => String(p.cuisine || '') === opts.cuisine);
  if (opts.occasion) {
    list = list.filter((p) =>
      productMatchesOccasion(
        Array.isArray(p.occasion_tags) ? (p.occasion_tags as string[]) : [],
        opts.occasion
      )
    );
  }
  if (opts.halalOnly) list = list.filter((p) => Boolean(p.halal));
  if (opts.maxCal != null) list = list.filter((p) => ((p.calories as number) || 999) <= opts.maxCal!);
  return list;
}

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
    }),
  };
}

export default function CustomerDiscover() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [occasionFilter, setOccasionFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const { halalOnly, maxCal, toggleHalalOnly, toggleLight } = useDiscoverPrefs();
  const { user } = useAuth();
  const { isGuest, requireAuth } = useGuestAuthGate();
  const addMut = useAddToCart();
  const { data: orders = [] } = useOrders('customer');
  const { favorites, toggle, isFavorite } = useFavorites();
  const { data: products = [], isLoading } = useProducts('');
  const router = useRouter();

  const activeOrder = useMemo(() => getActiveOrders(orders as Record<string, unknown>[])[0], [orders]);

  const savedDishes = useMemo(() => {
    if (query.trim()) return [];
    return favoritesToReorderDishes(favorites).map((d) => ({
      ...toDishCardData({ id: d.id, name: d.name, cook_name: d.cook_name, price: d.price, cuisine: d.cuisine }),
      image_url: getDishImageUrl({ id: d.id, name: d.name, cuisine: d.cuisine }),
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

  const filteredProducts = useMemo(
    () =>
      filterDiscoverProducts(products as Record<string, unknown>[], {
        query,
        occasion: occasionFilter || undefined,
        cuisine: cuisineFilter || undefined,
        halalOnly: halalOnly || undefined,
        maxCal,
      }),
    [products, query, cuisineFilter, occasionFilter, halalOnly, maxCal]
  );

  const dishList = useMemo(() => filteredProducts.map(toDishCardData), [filteredProducts]);

  const searchDishes = useMemo(() => (query.trim() ? dishList : []), [dishList, query]);

  const reorderDishes = useMemo(() => {
    if (query.trim()) return [];
    return extractReorderDishes(orders as Record<string, unknown>[]).map((d) => ({
      ...toDishCardData({ id: d.id, name: d.name, cook_name: d.cook_name, price: d.price, cuisine: d.cuisine }),
      image_url: getDishImageUrl({ id: d.id, name: d.name, cuisine: d.cuisine }),
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

  const locationLabel = user?.name ? `${user.name.split(' ')[0]}'s area · SG` : 'Katong, Singapore';

  const ListHeader = (
    <>
      <GourmeatHomeHeader
        headline="Hungry? Order & Eat."
        locationLabel={locationLabel}
        locationHint="Collect from"
        avatarUri={user?.name ? getCookAvatarUrl(user.id, user.name) : undefined}
        onProfilePress={() => router.push('/(customer)/profile' as any)}
        onLocationPress={() => router.push('/(customer)/search' as any)}
      />

      <GourmeatSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search dishes, cooks, occasions…"
        onFilterPress={() => router.push('/(customer)/search' as any)}
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

      {!query && (
        <View style={{ paddingHorizontal: shcSpacing.md }}>
          <SHCHeritageStoryBanner
            imageUri={BENTO_ACTION_IMAGES.compliance}
            onPress={() => router.push('/(shared)/onboarding' as any)}
          />
        </View>
      )}

      {!query && (
        <View style={{ paddingHorizontal: shcSpacing.md }}>
          <SHCPromoRail
            promos={[
              { id: 'hari-raya', title: 'Hari Raya specials', subtitle: 'Order 2 weeks ahead', imageUrl: PROMO_BANNER_IMAGES.hariRaya, badge: 'Festive', iconKey: 'people' },
              { id: 'credits', title: 'Earn credits', subtitle: '4 credits ≈ S$1 off', imageUrl: PROMO_BANNER_IMAGES.credits, badge: 'Wallet', iconKey: 'profile' },
              { id: 'paynow', title: 'PayNow collection', subtitle: 'HDB pickup · no delivery', imageUrl: PROMO_BANNER_IMAGES.paynow, iconKey: 'cart' },
            ]}
            onPromoPress={(id) => {
              if (id === 'hari-raya') setOccasionFilter('Hari Raya');
              else if (id === 'credits') router.push('/(customer)/profile' as any);
              else router.push('/(shared)/onboarding' as any);
            }}
          />
        </View>
      )}

      <View style={{ paddingHorizontal: shcSpacing.md }}>
        <SHCFilterChipRow
          chips={[
            { id: 'halal', label: 'Halal', active: halalOnly },
            { id: 'light', label: 'Light (<500 cal)', active: maxCal === 500 },
          ]}
          onChipPress={(id) => {
            if (id === 'halal') toggleHalalOnly();
            if (id === 'light') toggleLight();
          }}
          testID="discover-filter-chips"
        />
      </View>

      {activeOrder && (
        <View style={{ paddingHorizontal: shcSpacing.md, marginBottom: shcSpacing.sm }}>
          <SHCActiveOrderBanner
            statusLabel={getOrderStatusLabel(String(activeOrder.shc_status || ''))}
            dishName={String((activeOrder.items as any[])?.[0]?.name || '')}
            collectionLabel={
              activeOrder.collection_date
                ? `${activeOrder.collection_date} ${activeOrder.collection_slot || ''}`
                : undefined
            }
            onPress={() => router.push(`/(customer)/orders/${activeOrder.id}` as any)}
          />
        </View>
      )}

      <GourmeatSectionTitle title="Categories" actionLabel="See all" onActionPress={() => router.push('/(customer)/search' as any)} />
      <GourmeatCategoryRow
        categories={occasionCategories}
        selectedId={occasionFilter}
        onSelect={setOccasionFilter}
      />

      {!query && reorderDishes.length > 0 && (
        <SHCFadeIn delay={80}>
          <View style={{ marginBottom: shcSpacing.section }}>
            <GourmeatSectionTitle title="Order again" />
            <SHCZomatoDishRowRail title="" dishes={reorderDishes} onDishPress={goToProduct} testID="order-again-rail" />
          </View>
        </SHCFadeIn>
      )}

      {!query && savedDishes.length > 0 && (
        <SHCFadeIn delay={100}>
          <View style={{ marginBottom: shcSpacing.section }}>
            <GourmeatSectionTitle title="Saved for you" />
            <SHCZomatoDishRowRail title="" dishes={savedDishes} onDishPress={goToProduct} testID="saved-dishes-rail" />
          </View>
        </SHCFadeIn>
      )}

      <GourmeatSectionTitle title="Explore cuisines" />
      <GourmeatCategoryRow
        categories={cuisineCategories}
        selectedId={cuisineFilter}
        onSelect={setCuisineFilter}
        testID="cuisine-gourmeat-row"
      />

      <GourmeatSectionTitle
        title={occasionFilter ? `${occasionFilter.split(' ')[0]} dishes` : 'Popular near you'}
        testID="all-dishes-header"
      />

      {isLoading && <Text style={styles.loading}>···</Text>}
      {gridProducts.length === 0 && !isLoading && (
        <View style={styles.empty}>
          <SHCFoodImage uri={BENTO_ACTION_IMAGES.cart} height={80} rounded={16} />
          <Text style={styles.emptyText}>No dishes match — try another category</Text>
        </View>
      )}
    </>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="customer-discover-screen">
      <FlashList
        data={gridProducts}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        estimatedItemSize={220}
        ListHeaderComponent={ListHeader}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        testID="dish-list-container"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  list: { flex: 1 },
  searchOverlay: { zIndex: 20, elevation: 12 },
  listContent: { paddingHorizontal: shcSpacing.md, paddingBottom: 120 },
  loading: { textAlign: 'center', fontSize: 24, marginVertical: shcSpacing.md, color: gourmeatColors.textMuted },
  empty: { alignItems: 'center', paddingVertical: shcSpacing.xl, gap: shcSpacing.sm },
  emptyText: { fontSize: 13, color: gourmeatColors.textLight, fontWeight: '500' },
});