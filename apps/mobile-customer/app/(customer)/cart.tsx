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
  shcSpacing,
  SHCFadeIn,
  DirectionalTabScreen,
} from '@shc/ui';
import { getDishImageUrl, summarizeCart } from '@shc/utils';
import { useCart, useClearCart } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';
import { useGuestAuthTray } from '../../hooks/useGuestAuthTray';
import { enforceMinimumOrder } from '@shc/business-rules';
import { useShcI18n, getCartScreenCopy } from '@shc/i18n';

export default function Cart() {
  const insets = useSafeAreaInsets();
  const { locale } = useShcI18n();
  const copy = getCartScreenCopy(locale);
  const { data: cart, isLoading } = useCart();
  const cartData = cart ?? { items: [], cookId: null };
  const clearMut = useClearCart();
  const router = useRouter();
  const { user } = useAuth();
  const { showGuestAuthTray } = useGuestAuthTray();

  const goCheckout = () => {
    if (!user) {
      showGuestAuthTray(copy.signInTitle, copy.signInBody);
      return;
    }
    router.push('/(customer)/checkout' as any);
  };

  const summary = summarizeCart((cartData.items || []) as Parameters<typeof summarizeCart>[0]);
  const total = summary.total;
  const itemCount = summary.itemCount;

  const hasItems = cartData.items && cartData.items.length > 0;
  const belowMinimum =
    hasItems &&
    !enforceMinimumOrder({
      totalCents: Math.round(total * 100),
      lines: (cartData.items || []).map((item: { price?: number }) => ({
        price_cents: Math.round(Number(item.price || 0) * 100),
      })),
    }).valid;

  return (
    <DirectionalTabScreen testID="cart-tab-scene">

    <View style={styles.screen} testID="cart-screen">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: hasItems ? 100 : 80 }]}
      >
        <GourmeatScreenHeader
          title={copy.title}
          subtitle={copy.subtitle(user?.name || copy.guest, itemCount)}
        />

        {isLoading && !cart ? (
          <View style={styles.loadingInline}>
            <Text style={{ color: gourmeatColors.textMuted }}>···</Text>
          </View>
        ) : !hasItems ? (
          <GourmeatCard>
            <GourmeatEmptyState
              title={copy.emptyTitle}
              body={copy.emptyBody}
              ctaLabel={copy.browseDishes}
              onCta={() => router.push('/(customer)/' as any)}
              testID="cart-empty-state"
            />
          </GourmeatCard>
        ) : (
          <SHCFadeIn>
            <View style={styles.summaryRow}>
              <GourmeatStatPill iconKey="restaurant" value={itemCount} label={copy.portionsLabel} />
              <View style={{ width: shcSpacing.sm }} />
              <GourmeatStatPill iconKey="cart" value={`S$${total.toFixed(2)}`} label={copy.subtotalLabel} />
            </View>

            {belowMinimum && (
              <Text style={styles.minimumHint} testID="cart-minimum-hint">
                {copy.minimumHint}
              </Text>
            )}

            <GourmeatCard style={{ padding: shcSpacing.sm }}>
              <Text style={styles.itemsTitle}>{copy.orderItems}</Text>
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
                <Text style={styles.totalLabel}>{copy.totalLabel}</Text>
                <Text style={styles.totalValue}>S${total.toFixed(2)}</Text>
              </View>
            </GourmeatCard>

            <GourmeatPrimaryButton label={copy.clearCart} variant="outline" onPress={() => clearMut.mutate()} style={{ marginTop: shcSpacing.sm }} />
          </SHCFadeIn>
        )}
      </ScrollView>

      {hasItems && (
        <View style={{ paddingHorizontal: shcSpacing.md, paddingBottom: Math.max(insets.bottom, shcSpacing.md) }}>
          <GourmeatPayButton label={copy.checkoutBtn} amount={`S$${total.toFixed(2)}`} onPress={goCheckout} testID="proceed-checkout" />
        </View>
      )}
    </View>
  
    </DirectionalTabScreen>
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
  minimumHint: {
    fontSize: 13,
    fontWeight: '600',
    color: gourmeatColors.text,
    backgroundColor: gourmeatColors.primaryLight,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    padding: shcSpacing.sm,
    marginBottom: shcSpacing.md,
  },
});
