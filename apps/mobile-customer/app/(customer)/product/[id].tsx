import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatDiscountBadge,
  GourmeatProductStickyBar,
  GourmeatCard,
  gourmeatColors,
  gourmeatRadii,
  gourmeatShadows,
  gourmeatDiscountPercent,
  shcSpacing,
  AllergenAckCheckbox,
  SHCDishOrderingInfo,
  SHCFavoriteButton,
} from '@shc/ui';
import { getDishImageUrl } from '@shc/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useProduct, useAddToCart } from '../../../hooks/useProducts';
import { useGuestAuthGate } from '../../../hooks/useGuestAuthGate';
import { useAuth } from '../../../hooks/useAuth';
import { hydrateSession, isAuthenticated } from '../../../lib/api-client';
import { useFavorites } from '../../../hooks/useFavorites';

export default function ProductDetail() {
  const insets = useSafeAreaInsets();
  const { id, allergenAck: allergenAckParam } = useLocalSearchParams<{ id: string; allergenAck?: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id || '');
  const qc = useQueryClient();
  const addMut = useAddToCart();
  const { loading: authLoading, user } = useAuth();
  const { requireAuth } = useGuestAuthGate();
  const { isFavorite, toggle } = useFavorites();
  const [allergenAck, setAllergenAck] = useState(false);
  const [qty, setQty] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (allergenAckParam === '1') setAllergenAck(true);
  }, [allergenAckParam]);

  if (authLoading || isLoading || !product) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>{authLoading ? 'Restoring session…' : 'Loading dish…'}</Text>
      </View>
    );
  }

  const tier1 = product.allergen_tiers?.tier1 || product.allergens || [];
  const calConfidence = (product.calories_confidence as 'full' | 'category') || 'category';
  const discount = gourmeatDiscountPercent(product.id);

  const handleAdd = async () => {
    setError(null);
    await hydrateSession();
    if (!isAuthenticated() && !requireAuth('Sign in to add this dish to your cart.')) return;
    if (!allergenAck) {
      setError('Please acknowledge allergens before adding to cart.');
      return;
    }
    try {
      const cart = await addMut.mutateAsync({ productId: product.id, qty });
      qc.setQueryData(['cart'], cart);
      if (!cart?.items?.length) {
        setError('Cart did not update — try again.');
        return;
      }
      setAdded(true);
      // Brief beat so E2E can observe add-to-cart-success before tab navigation
      setTimeout(() => router.replace('/(customer)/cart' as any), 600);
    } catch (e: any) {
      setError(e?.message || 'Failed to add to cart');
    }
  };

  return (
    <View style={styles.screen} testID="product-detail-screen">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: getDishImageUrl({ id: product.id, cuisine: product.cuisine, name: product.name }) }}
            style={styles.heroImage}
            resizeMode="cover"
            testID="pdp-hero-image"
          />
          <View style={[styles.heroOverlay, { paddingTop: insets.top + shcSpacing.sm }]}>
            <View style={styles.heroTopRow}>
              <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="pdp-back-btn">
                <Text style={styles.backIcon}>←</Text>
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <GourmeatDiscountBadge percent={discount} />
                <View style={styles.iconBtn}>
                  <SHCFavoriteButton
                    active={isFavorite(product.id)}
                    onPress={() =>
                      toggle({
                        id: product.id,
                        name: product.name,
                        cook_name: product.cook_name,
                        price: product.price,
                        cuisine: product.cuisine,
                      })
                    }
                    testID="pdp-favorite-btn"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.productMetaRow}>
            {(product as { cook_slug?: string }).cook_slug ? (
              <Pressable onPress={() => router.push(`/(customer)/cook/${(product as { cook_slug: string }).cook_slug}` as any)}>
                <Text style={styles.cookLink}>{product.cook_name} ›</Text>
              </Pressable>
            ) : (
              <Text style={styles.productMeta}>{product.cook_name}</Text>
            )}
            <Text style={styles.productMeta}> · <Text style={styles.price}>S${product.price}</Text></Text>
          </View>
          <View style={styles.badgeRow}>
            {product.cuisine ? <Text style={styles.badge}>{product.cuisine}</Text> : null}
            {product.halal ? <Text style={[styles.badge, styles.badgeHalal]}>Halal</Text> : null}
            <Text style={styles.badge}>min {product.min_qty}</Text>
          </View>

          <GourmeatCard>
            <SHCDishOrderingInfo
              tier1={tier1}
              tier2={product.allergen_tiers?.tier2}
              tier3={product.allergen_tiers?.tier3}
              ingredients={product.ingredients}
              calories={product.calories}
              caloriesConfidence={calConfidence}
              heritageNote={product.heritage_note}
            />
          </GourmeatCard>

          <AllergenAckCheckbox checked={allergenAck} onChange={setAllergenAck} tier1={tier1} />
          {error && <Text style={styles.errorText} testID="pdp-add-error">{error}</Text>}
        </View>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, shcSpacing.sm) }]}>
        <GourmeatProductStickyBar
          qty={qty}
          minQty={product.min_qty}
          lineTotal={product.price * qty}
          onDecrement={() => setQty(Math.max(product.min_qty, qty - 1))}
          onIncrement={() => setQty(qty + 1)}
          onAdd={handleAdd}
          disabled={!allergenAck || addMut.isPending}
          loading={addMut.isPending}
          testID={
            added ? 'add-to-cart-success' : allergenAck && !addMut.isPending ? 'pdp-sticky-ready' : 'pdp-sticky-bar'
          }
        />
      </View>
    </View>
  );
}

const heroHeight = Math.round(Dimensions.get('window').width * 0.65);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: gourmeatColors.surface,
  },
  loadingWrap: { flex: 1, padding: shcSpacing.md, backgroundColor: gourmeatColors.background, justifyContent: 'center' },
  loadingText: { fontWeight: '600', color: gourmeatColors.textLight },
  scroll: { flex: 1 },
  heroWrap: { width: '100%', height: heroHeight, backgroundColor: gourmeatColors.surfaceAlt },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, paddingHorizontal: shcSpacing.md },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: gourmeatColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...gourmeatShadows.soft,
  },
  backIcon: { fontSize: 20, fontWeight: '700', color: gourmeatColors.text },
  body: { padding: shcSpacing.md },
  productName: { fontSize: 24, fontWeight: '800', color: gourmeatColors.text, letterSpacing: -0.3 },
  productMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 },
  productMeta: { fontSize: 14, color: gourmeatColors.textLight, fontWeight: '500' },
  cookLink: { fontSize: 14, color: gourmeatColors.primary, fontWeight: '700' },
  price: { color: gourmeatColors.primary, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: shcSpacing.md },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: gourmeatColors.textLight,
    backgroundColor: gourmeatColors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: gourmeatRadii.pill,
  },
  badgeHalal: { color: gourmeatColors.success, backgroundColor: '#E8F8EE' },
  errorText: { color: gourmeatColors.error, marginTop: shcSpacing.sm, fontWeight: '600', fontSize: 13 },
});