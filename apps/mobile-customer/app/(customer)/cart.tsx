/**
 * One-time order cart — kitchen banner, items, notes, summary, proceed.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  GourmeatCard,
  GourmeatCartLineItem,
  GourmeatPayButton,
  GourmeatEmptyState,
  gourmeatColors,
  gourmeatLayout,
  shcSpacing,
  SHCFadeIn,
  SHCSkeletonList,
  DirectionalTabScreen,
} from '@shc/ui';
import {
  getDishImageUrl,
  computeOneTimeOrderSummary,
  cartKitchenLabel,
  cartCollectionHint,
  CART_WIREFRAME_LABELS,
} from '@shc/utils';
import { useCart, useClearCart } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';
import { useGuestAuthTray } from '../../hooks/useGuestAuthTray';
import { useCustomerLocation } from '../../hooks/useCustomerLocation';

export default function Cart() {
  const insets = useSafeAreaInsets();
  const { data: cart, isLoading } = useCart();
  const cartData = cart ?? { items: [], cookId: null };
  const clearMut = useClearCart();
  const router = useRouter();
  const { user } = useAuth();
  const { showGuestAuthTray } = useGuestAuthTray();
  const { locationLabel, active: collectionLocation } = useCustomerLocation();
  const [cookingNotes, setCookingNotes] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [showCooking, setShowCooking] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState('');

  const items = (cartData.items || []) as Array<Record<string, unknown>>;
  const summary = computeOneTimeOrderSummary(items as any);
  const kitchen = cartKitchenLabel(items);
  const hasItems = items.length > 0;

  const goCheckout = () => {
    if (!user) {
      showGuestAuthTray(
        'Sign in to checkout',
        'Create an account or sign in to complete your order.'
      );
      return;
    }
    router.push('/(customer)/checkout' as any);
  };

  return (
    <DirectionalTabScreen testID="cart-tab-scene">
      <View style={styles.screen} testID="cart-screen">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + shcSpacing.md,
              paddingBottom: hasItems
                ? gourmeatLayout.tabBarClearance + 100
                : gourmeatLayout.tabBarClearance + shcSpacing.lg,
            },
          ]}
        >
          <GourmeatScreenHeader title="Cart" subtitle={cartCollectionHint()} />

          {isLoading && !cart ? (
            <SHCSkeletonList count={4} rowHeight={72} testID="cart-skeleton" />
          ) : !hasItems ? (
            <GourmeatCard>
              <GourmeatEmptyState
                title="Cart is empty"
                body="Discover heritage dishes for your next occasion."
                ctaLabel="Browse dishes"
                onCta={() => router.push('/(customer)/' as any)}
                testID="cart-empty-state"
              />
            </GourmeatCard>
          ) : (
            <SHCFadeIn>
              <View style={styles.kitchenBanner} testID="cart-kitchen-banner">
                <Text style={styles.kitchenLabel}>{CART_WIREFRAME_LABELS.collection}</Text>
                <Text style={styles.kitchenName} testID="cart-kitchen-name">
                  {kitchen}
                </Text>
                <Pressable onPress={() => router.push('/(customer)/location' as any)}>
                  <Text style={styles.locText} testID="cart-collection-location">
                    📍 {collectionLocation ? locationLabel : 'Set collection location'} · Change
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>{CART_WIREFRAME_LABELS.items}</Text>
              <GourmeatCard style={{ padding: shcSpacing.sm }}>
                {items.map((item: any, i: number) => (
                  <View key={i} style={i > 0 ? styles.itemBorder : undefined}>
                    <GourmeatCartLineItem
                      name={item.name}
                      qty={item.qty}
                      price={item.price}
                      imageUri={getDishImageUrl({
                        id: item.product_id || item.productId,
                        name: item.name,
                      })}
                    />
                  </View>
                ))}
              </GourmeatCard>

              <Pressable
                style={styles.addMore}
                onPress={() => router.push('/(customer)/' as any)}
                testID="cart-add-more"
              >
                <Text style={styles.addMoreText}>+ Add more items</Text>
              </Pressable>

              <Pressable style={styles.noteToggle} onPress={() => setShowCooking((v) => !v)}>
                <Text style={styles.noteToggleText}>Add cooking instructions</Text>
              </Pressable>
              {showCooking && (
                <TextInput
                  style={styles.input}
                  multiline
                  value={cookingNotes}
                  onChangeText={setCookingNotes}
                  placeholder="e.g. less spicy"
                  placeholderTextColor={gourmeatColors.textMuted}
                />
              )}

              <Pressable style={styles.noteToggle} onPress={() => setShowCollection((v) => !v)}>
                <Text style={styles.noteToggleText}>Add collection instructions</Text>
              </Pressable>
              {showCollection && (
                <TextInput
                  style={styles.input}
                  multiline
                  value={collectionNotes}
                  onChangeText={setCollectionNotes}
                  placeholder="e.g. call when ready"
                  placeholderTextColor={gourmeatColors.textMuted}
                />
              )}

              <View style={styles.summary} testID="cart-coupon-row">
                <Text style={styles.summaryTitle}>{CART_WIREFRAME_LABELS.coupon}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, minHeight: 44, marginBottom: 0 }]}
                    value={coupon}
                    onChangeText={setCoupon}
                    placeholder="Code or Home Credits"
                    placeholderTextColor={gourmeatColors.textMuted}
                    testID="cart-coupon-input"
                  />
                  <Pressable
                    style={styles.couponBtn}
                    onPress={() => {
                      const code = coupon.trim().toUpperCase();
                      setCouponMsg(
                        !code
                          ? 'Enter a code to apply.'
                          : code === 'WELCOME' || code === 'SHC5'
                            ? 'Code noted — confirm at checkout.'
                            : 'Unknown code. Use Home Credits at checkout.'
                      );
                    }}
                    testID="cart-coupon-apply"
                  >
                    <Text style={styles.couponBtnText}>Apply</Text>
                  </Pressable>
                </View>
                {couponMsg ? <Text style={styles.cancelNote}>{couponMsg}</Text> : null}
              </View>

              <View style={styles.summary} testID="cart-order-summary">
                <Text style={styles.summaryTitle}>{CART_WIREFRAME_LABELS.bill}</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryMuted}>Item total</Text>
                  <Text style={styles.summaryVal}>{summary.itemTotalLabel}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryMuted}>Service fee</Text>
                  <Text style={styles.summaryVal}>{summary.serviceFeeLabel}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryMuted}>HDB collection</Text>
                  <Text style={[styles.summaryVal, { color: '#2E7D32' }]}>
                    {summary.collectionFeeLabel}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total amount</Text>
                  <Text style={styles.totalVal} testID="cart-total">
                    {summary.totalLabel}
                  </Text>
                </View>
                <Text style={styles.cancelNote}>{summary.cancelNote}</Text>
              </View>

              <View style={[styles.summary, styles.paynowCard]} testID="cart-payment-method">
                <Text style={styles.summaryMuted}>{CART_WIREFRAME_LABELS.payment}</Text>
                <Text style={styles.summaryTitle}>{CART_WIREFRAME_LABELS.paynow}</Text>
                <Text style={styles.cancelNote}>Transfer after order · confirm with reference</Text>
              </View>

              <Pressable onPress={() => clearMut.mutate()} style={{ marginTop: 8 }}>
                <Text style={styles.clear}>Clear cart</Text>
              </Pressable>
            </SHCFadeIn>
          )}
        </ScrollView>

        {hasItems && (
          <View
            style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) + 64 }]}
            testID="cart-checkout-bar"
          >
            <GourmeatPayButton
              label={summary.proceedLabel}
              amount={summary.totalLabel}
              onPress={goCheckout}
              testID="proceed-checkout"
            />
          </View>
        )}
      </View>
    </DirectionalTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  kitchenBanner: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.md,
  },
  kitchenLabel: { fontSize: 11, fontWeight: '700', color: gourmeatColors.textLight },
  kitchenName: { fontSize: 18, fontWeight: '900', color: gourmeatColors.text, marginTop: 2 },
  locText: { fontSize: 13, fontWeight: '700', color: gourmeatColors.primary, marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  itemBorder: { borderTopWidth: 1, borderTopColor: gourmeatColors.border },
  addMore: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  addMoreText: { fontWeight: '800', color: gourmeatColors.primary },
  noteToggle: {
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    backgroundColor: gourmeatColors.surface,
  },
  noteToggleText: { fontWeight: '700', fontSize: 14 },
  input: {
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    marginBottom: 8,
    fontWeight: '600',
    color: gourmeatColors.text,
    textAlignVertical: 'top',
  },
  summary: {
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 16,
    padding: shcSpacing.md,
    backgroundColor: gourmeatColors.surface,
    marginTop: 8,
  },
  summaryTitle: { fontWeight: '900', fontSize: 15, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryMuted: { fontWeight: '600', color: gourmeatColors.textLight, fontSize: 13 },
  summaryVal: { fontWeight: '700', fontSize: 13 },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: gourmeatColors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { fontWeight: '900', fontSize: 15 },
  totalVal: { fontWeight: '900', fontSize: 16, color: gourmeatColors.primary },
  couponBtn: {
    backgroundColor: gourmeatColors.surface,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  couponBtnText: { fontWeight: '800', fontSize: 13, color: gourmeatColors.primary },
  paynowCard: {
    borderColor: gourmeatColors.primary,
    backgroundColor: '#FFF8E8',
  },
  cancelNote: {
    fontSize: 11,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    marginTop: 10,
    lineHeight: 15,
  },
  clear: { fontWeight: '700', color: gourmeatColors.textLight, textAlign: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: shcSpacing.md,
    backgroundColor: gourmeatColors.surface,
    borderTopWidth: 1,
    borderTopColor: gourmeatColors.border,
  },
});
