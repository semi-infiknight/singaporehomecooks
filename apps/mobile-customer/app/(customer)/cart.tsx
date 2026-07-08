import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  GourmeatCard,
  GourmeatStatPill,
  GourmeatCartLineItem,
  GourmeatPrimaryButton,
  GourmeatPayButton,
  GourmeatEmptyState,
  gourmeatColors,
  gourmeatLayout,
  gourmeatShadows,
  shcSpacing,
  SHCFadeIn,
  DirectionalTabScreen,
} from '@shc/ui';
import { getDishImageUrl, summarizeCart } from '@shc/utils';
import { useCart, useClearCart } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';
import { useGuestAuthTray } from '../../hooks/useGuestAuthTray';

export default function Cart() {
  const insets = useSafeAreaInsets();
  const { data: cart, isLoading } = useCart();
  const cartData = cart ?? { items: [], cookId: null };
  const clearMut = useClearCart();
  const router = useRouter();
  const { user } = useAuth();
  const { showGuestAuthTray } = useGuestAuthTray();

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

  const summary = summarizeCart((cartData.items || []) as Parameters<typeof summarizeCart>[0]);
  const total = summary.total;
  const itemCount = summary.itemCount;

  const hasItems = cartData.items && cartData.items.length > 0;

  return (
    <DirectionalTabScreen testID="cart-tab-scene">

    <View style={styles.screen} testID="cart-screen">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + shcSpacing.md,
            paddingBottom: hasItems ? gourmeatLayout.tabBarClearance + 88 : gourmeatLayout.tabBarClearance + shcSpacing.lg,
          },
        ]}
      >
        <GourmeatScreenHeader
          title="Your Cart"
          subtitle={`${user?.name || 'Guest'} · ${itemCount} portion${itemCount !== 1 ? 's' : ''}`}
        />

        {isLoading && !cart ? (
          <View style={styles.loadingInline}>
            <Text style={{ color: gourmeatColors.textMuted }}>···</Text>
          </View>
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
            <View style={styles.summaryRow}>
              <GourmeatStatPill iconKey="restaurant" value={itemCount} label="Portions" />
              <View style={{ width: shcSpacing.sm }} />
              <GourmeatStatPill iconKey="cart" value={`S$${total.toFixed(2)}`} label="Subtotal" />
            </View>

            <GourmeatCard style={{ padding: shcSpacing.sm }}>
              <Text style={styles.itemsTitle}>Order items</Text>
              {(cartData.items || []).map((item: any, i: number) => (
                <View key={i} style={i > 0 ? styles.itemBorder : undefined}>
                  <GourmeatCartLineItem
                    name={item.name}
                    qty={item.qty}
                    price={item.price}
                    imageUri={getDishImageUrl({ id: item.product_id || item.productId, name: item.name })}
                    testID={`cart-item-${i}`}
                  />
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>S${total.toFixed(2)}</Text>
              </View>
            </GourmeatCard>

            <GourmeatPrimaryButton label="Clear cart" variant="outline" onPress={() => clearMut.mutate()} style={{ marginTop: shcSpacing.sm }} />
          </SHCFadeIn>
        )}
      </ScrollView>

      {hasItems && (
        <View
          style={[
            styles.checkoutFooter,
            { bottom: gourmeatLayout.tabBarClearance + Math.max(insets.bottom, shcSpacing.sm) },
          ]}
        >
          <GourmeatPayButton label="Checkout" amount={`S$${total.toFixed(2)}`} onPress={goCheckout} testID="proceed-checkout" />
        </View>
      )}
    </View>
  
    </DirectionalTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  checkoutFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: shcSpacing.md,
    paddingVertical: shcSpacing.sm,
    backgroundColor: gourmeatColors.surface,
    borderTopWidth: 1,
    borderTopColor: gourmeatColors.border,
    zIndex: 12,
    ...gourmeatShadows.soft,
  },
  loadingInline: { padding: shcSpacing.lg, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: shcSpacing.md },
  summaryRow: { flexDirection: 'row', marginBottom: shcSpacing.md },
  itemsTitle: { fontSize: 15, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.xs, paddingHorizontal: shcSpacing.xs },
  itemBorder: { borderTopWidth: 1, borderTopColor: gourmeatColors.border, marginHorizontal: shcSpacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: shcSpacing.sm, marginTop: shcSpacing.xs, borderTopWidth: 1, borderTopColor: gourmeatColors.border, paddingHorizontal: shcSpacing.xs },
  totalLabel: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: gourmeatColors.primary },
});