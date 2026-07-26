import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import {
  GourmeatCategoryRow,
  GourmeatDishCard,
  GourmeatSectionTitle,
  SHCRequestDishHomeCTA,
  SHCSkeletonDishGrid,
  SHCFoodImage,
  gourmeatColors,
  type GourmeatCategoryItem,
  type SHCDishCardData,
  shcSpacing,
  contentPadSafe,
} from '@shc/ui';
import {
  filterDiscoverProducts,
  getDishImageUrl,
  occasionBrowseCategories,
  occasionBrowseHeading,
  isPopularDish,
  BENTO_ACTION_IMAGES,
  coerceRating,
} from '@shc/utils';
import { useProducts, useAddToCart } from '../../hooks/useProducts';
import { useGuestAuthGate } from '../../hooks/useGuestAuthGate';
import { useFavorites } from '../../hooks/useFavorites';

function toDishCardData(product: Record<string, unknown>): SHCDishCardData {
  const id = String(product.id);
  return {
    id,
    name: String(product.name),
    cook_name: String(product.cook_name),
    price: Number(product.price),
    cuisine: product.cuisine ? String(product.cuisine) : undefined,
    rating: coerceRating(product.rating),
    halal: Boolean(product.halal),
    ...(product.collection_slot ? { collection_slot: String(product.collection_slot) } : {}),
    image_url: getDishImageUrl({
      id,
      cuisine: product.cuisine ? String(product.cuisine) : undefined,
      name: String(product.name),
      image_url: product.image_url as string | undefined,
    }),
  };
}

export default function OccasionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ occasion?: string }>();
  const initialOccasion = typeof params.occasion === 'string' ? params.occasion : '';
  const [occasionFilter, setOccasionFilter] = useState(initialOccasion);
  const { data: products, isLoading } = useProducts('');
  const productList = products ?? [];
  const { requireAuth } = useGuestAuthGate();
  const addMut = useAddToCart();
  const { toggle, isFavorite } = useFavorites();

  const heading = occasionBrowseHeading(occasionFilter);
  const categories: GourmeatCategoryItem[] = occasionBrowseCategories().map((c) => ({
    id: c.id,
    label: c.label,
    iconKey: 'people' as const,
    imageUrl: c.imageUrl,
  }));

  const filteredProducts = useMemo(
    () =>
      filterDiscoverProducts(productList as Record<string, unknown>[], {
        occasion: occasionFilter || undefined,
      }),
    [productList, occasionFilter]
  );

  const gridProducts = filteredProducts;
  const colWidth = (Dimensions.get('window').width - shcSpacing.md * 2 - shcSpacing.sm) / 2;

  const checkPopular = useCallback(
    (item: Record<string, unknown>) => isPopularDish(item, productList as Record<string, unknown>[]),
    [productList]
  );

  const goToProduct = (id: string) => router.push(`/(customer)/product/${id}` as any);

  const handleAddToCart = useCallback(
    (productId: string) => {
      if (!requireAuth('Browse freely — sign in to add dishes to your cart.')) return;
      addMut.mutate({ productId, qty: 1 });
    },
    [requireAuth, addMut]
  );

  const renderItem = useCallback(
    ({ item }: { item: Record<string, unknown> }) => (
      <View style={{ width: colWidth, paddingBottom: shcSpacing.md }}>
        <GourmeatDishCard
          dish={toDishCardData(item)}
          onPress={() => goToProduct(String(item.id))}
          onAddPress={() => handleAddToCart(String(item.id))}
          isFavorite={isFavorite(String(item.id))}
          onFavoritePress={() =>
            toggle({
              id: String(item.id),
              name: String(item.name),
              cook_name: String(item.cook_name || ''),
              price: Number(item.price || 0),
              cuisine: item.cuisine ? String(item.cuisine) : undefined,
            })
          }
          showPopular={checkPopular(item)}
        />
      </View>
    ),
    [colWidth, handleAddToCart, isFavorite, toggle, checkPopular]
  );

  const ListHeader = (
    <>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="occasions-back-btn">
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1} testID="occasions-title">
          {heading.title}
        </Text>
        <View style={styles.backBtn} />
      </View>
      <Text style={styles.hint}>{heading.hint}</Text>
      <GourmeatCategoryRow
        categories={categories}
        selectedId={occasionFilter}
        onSelect={setOccasionFilter}
        testID="occasion-gourmeat-row"
      />
      <GourmeatSectionTitle
        title={occasionFilter ? `${occasionFilter} dishes` : 'All occasion dishes'}
        testID="occasions-dish-header"
      />
      {isLoading && <SHCSkeletonDishGrid count={6} />}
      {gridProducts.length === 0 && !isLoading && (
        <View style={styles.empty}>
          <SHCFoodImage uri={BENTO_ACTION_IMAGES.cart} height={80} rounded={16} />
          <Text style={styles.emptyTitle}>No dishes for this occasion yet</Text>
          <Text style={styles.emptyText}>Try another occasion or request the spread you need.</Text>
          <Pressable onPress={() => router.push('/(customer)/request' as any)} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Request a dish</Text>
          </Pressable>
        </View>
      )}
    </>
  );

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top }]}
      testID="occasions-browse-screen"
    >
      <FlashList
        data={gridProducts}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          <SHCRequestDishHomeCTA onPress={() => router.push('/(customer)/request' as any)} />
        }
        contentContainerStyle={{
          paddingHorizontal: shcSpacing.md,
          paddingBottom: contentPadSafe(insets.bottom),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: shcSpacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { fontSize: 28, fontWeight: '300', color: gourmeatColors.text },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900', color: gourmeatColors.text },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    marginBottom: shcSpacing.md,
    paddingHorizontal: shcSpacing.md,
  },
  empty: { alignItems: 'center', paddingVertical: shcSpacing.xl, gap: shcSpacing.sm },
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
