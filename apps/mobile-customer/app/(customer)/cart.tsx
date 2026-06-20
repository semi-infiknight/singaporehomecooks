import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
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
  shcSpacing,
  SHCFadeIn,
} from '@shc/ui';
import { getDishImageUrl, summarizeCart } from '@shc/utils';
import { useCart, useClearCart } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';

export default function Cart() {
  const insets = useSafeAreaInsets();
  const { data: cart, isLoading } = useCart();
  const cartData = cart ?? { items: [], cookId: null };
  const clearMut = useClearCart();
  const router = useRouter();
  const { user } = useAuth();

  const goCheckout = () => {
    if (!user) {
      Alert.alert('Sign in to checkout', 'Create an account or sign in to complete your order.', [
        { text: 'Keep browsing', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/(shared)/auth' as any) },
      ]);
      return;
    }
    router.push('/(customer)/checkout' as any);
  };

  const summary = summarizeCart((cartData.items || []) as Parameters<typeof summarizeCart>[0]);
  const total = summary.total;
  const itemCount = summary.itemCount;

  const hasItems = cartData.items && cartData.items.length > 0;

  return (
    <View style={styles.screen} testID="cart-screen">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: hasItems ? 100 : 80 }]}
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
        <View style={{ paddingHorizontal: shcSpacing.md, paddingBottom: Math.max(insets.bottom, shcSpacing.md) }}>
          <GourmeatPayButton label="Checkout" amount={`S$${total.toFixed(2)}`} onPress={goCheckout} testID="proceed-checkout" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  loadingInline: { padding: shcSpacing.lg, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: shcSpacing.md },
  summaryRow: { flexDirection: 'row', marginBottom: shcSpacing.md },
  itemsTitle: { fontSize: 15, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.xs, paddingHorizontal: shcSpacing.xs },
  itemBorder: { borderTopWidth: 1, borderTopColor: gourmeatColors.border, marginHorizontal: shcSpacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: shcSpacing.sm, marginTop: shcSpacing.xs, borderTopWidth: 1, borderTopColor: gourmeatColors.border, paddingHorizontal: shcSpacing.xs },
  totalLabel: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: gourmeatColors.primary },
});