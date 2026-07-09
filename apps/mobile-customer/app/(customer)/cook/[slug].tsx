/**
 * Kitchen page — HomelyEats / Jakob’s Law restaurant IA.
 * Hero · rating · open · tags/story · menu with order path · tiffin CTA.
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCookStoreHero,
  GourmeatDishCard,
  GourmeatSectionTitle,
  GourmeatPrimaryButton,
  SHCFoodImage,
  type SHCDishCardData,
  gourmeatColors,
  shcSpacing,
  shcRadii,
} from '@shc/ui';
import {
  getDishImageUrl,
  getCookAvatarUrl,
  BENTO_ACTION_IMAGES,
  scopeProductsByKitchen,
  kitchenOpenStatus,
  kitchenTagList,
  getCollectionSlotLabel,
} from '@shc/utils';
import { useCook, useDiscovery, useAddToCart } from '../../../hooks/useProducts';
import { useGuestAuthGate } from '../../../hooks/useGuestAuthGate';
import { getHeritageArchive } from '../../../lib/api-client';

function toDish(l: Record<string, unknown>, cookName: string, rating?: number): SHCDishCardData {
  const id = String(l.id);
  return {
    id,
    name: String(l.name),
    cook_name: cookName,
    price: Number(l.price),
    cuisine: l.cuisine ? String(l.cuisine) : undefined,
    rating: rating ?? 4.8,
    halal: Boolean(l.halal),
    collection_slot: getCollectionSlotLabel(id),
    image_url: getDishImageUrl({
      id,
      cuisine: l.cuisine ? String(l.cuisine) : undefined,
      name: String(l.name),
    }),
  };
}

export default function KitchenPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: cook, isLoading } = useCook(slug || '');
  const { data: allProducts = [] } = useDiscovery('', {});
  const { requireAuth } = useGuestAuthGate();
  const addMut = useAddToCart();
  const [archive, setArchive] = useState<any[]>([]);

  const listings = useMemo(
    () =>
      scopeProductsByKitchen(allProducts as Record<string, unknown>[], {
        id: cook?.id,
        slug: slug || undefined,
        display_name: cook?.display_name,
        name: cook?.name,
      }),
    [allProducts, cook, slug]
  );

  useEffect(() => {
    if (cook?.id) {
      getHeritageArchive(cook.id).then(setArchive).catch(() => setArchive([]));
    }
  }, [cook?.id]);

  const handleAdd = useCallback(
    (productId: string) => {
      if (!requireAuth('Sign in to add dishes to your cart.')) return;
      addMut.mutate({ productId, qty: 1 });
    },
    [requireAuth, addMut]
  );

  if (isLoading || !cook) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]} testID="kitchen-page-loading">
        <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={80} rounded={shcRadii.lg} />
        <Text style={styles.loadingText}>{isLoading ? 'Loading kitchen…' : 'Kitchen not found'}</Text>
        {!isLoading && (
          <GourmeatPrimaryButton label="Back" onPress={() => router.back()} testID="kitchen-missing-back" />
        )}
      </View>
    );
  }

  const open = kitchenOpenStatus(cook as any);
  const tags = kitchenTagList({
    ...(cook as any),
    cuisine: cook.cuisine || listings[0]?.cuisine,
  });
  const colWidth = (Dimensions.get('window').width - shcSpacing.md * 2 - shcSpacing.sm) / 2;

  return (
    <View style={styles.screen} testID="kitchen-page-screen">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + shcSpacing.sm,
          paddingHorizontal: shcSpacing.md,
          paddingBottom: 120,
        }}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            testID="kitchen-back-btn"
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1} testID="kitchen-page-title">
            {cook.display_name}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <SHCCookStoreHero
          name={cook.display_name}
          area={cook.area}
          rating={cook.rating != null ? Number(cook.rating) : 4.8}
          orders={cook.orders}
          avatarUri={getCookAvatarUrl(cook.id, cook.display_name)}
          isOpen={open.isOpen}
          openDetail={open.detail}
          tags={tags}
          story={cook.story}
          testID="kitchen-page-hero"
        />

        <GourmeatSectionTitle
          title={listings.length ? `Menu · ${listings.length} dishes` : 'Menu'}
          testID="kitchen-menu-header"
        />
        {listings.length === 0 ? (
          <Text style={styles.empty} testID="kitchen-menu-empty">
            No dishes listed for this kitchen yet.
          </Text>
        ) : (
          <View style={styles.grid} testID="kitchen-menu-grid">
            {listings.map((l) => (
              <View key={String(l.id)} style={{ width: colWidth, paddingBottom: shcSpacing.md }}>
                <GourmeatDishCard
                  dish={toDish(l, cook.display_name, cook.rating != null ? Number(cook.rating) : undefined)}
                  onPress={() => router.push(`/(customer)/product/${l.id}` as any)}
                  onAddPress={() => handleAdd(String(l.id))}
                />
              </View>
            ))}
          </View>
        )}

        <View style={styles.planCard} testID="kitchen-tiffin-cta-card">
          <Text style={styles.planTitle}>Weekly tiffin from this kitchen</Text>
          <Text style={styles.planSub}>2 · 3 · 4 meals/week · flexible skip & pause</Text>
          <GourmeatPrimaryButton
            label="View tiffin plans"
            onPress={() => router.push(`/(customer)/tiffin/kitchen/${cook.id}` as any)}
            testID="kitchen-tiffin-cta"
          />
        </View>

        {archive.length > 0 && (
          <>
            <GourmeatSectionTitle title="Heritage stories" testID="kitchen-heritage-header" />
            {archive.map((a: any, i: number) => (
              <View key={i} style={styles.archiveCard}>
                <Text style={styles.archiveTitle}>{a.title}</Text>
                <Text style={styles.archiveStory} numberOfLines={4}>
                  {a.story}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {listings.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + shcSpacing.md }]}>
          <GourmeatPrimaryButton
            label="View cart"
            onPress={() => router.push('/(customer)/cart' as any)}
            testID="kitchen-order-cta"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: shcSpacing.xl, gap: shcSpacing.sm },
  loadingText: { fontWeight: '600', color: gourmeatColors.textLight },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: shcSpacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 32, fontWeight: '300', color: gourmeatColors.text, lineHeight: 36 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: gourmeatColors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  empty: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight, marginBottom: shcSpacing.md },
  planCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: 14,
    padding: shcSpacing.md,
    marginTop: shcSpacing.sm,
    marginBottom: shcSpacing.md,
    gap: 8,
  },
  planTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  planSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.88)', marginBottom: 4 },
  archiveCard: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: 12,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.sm,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
  },
  archiveTitle: { fontWeight: '800', color: gourmeatColors.text, marginBottom: 4 },
  archiveStory: { fontSize: 12, color: gourmeatColors.textLight, lineHeight: 18 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: shcSpacing.md,
    paddingTop: shcSpacing.md,
    backgroundColor: gourmeatColors.surface,
    borderTopWidth: 1,
    borderTopColor: gourmeatColors.border,
  },
});
