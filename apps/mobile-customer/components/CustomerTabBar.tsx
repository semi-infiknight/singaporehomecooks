// @ts-nocheck — expo-router tab bar props; types from @react-navigation/bottom-tabs
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { GourmeatFloatingTabBar, GourmeatStickyCartBar, type SHCBottomTab, useTabDirection } from '@shc/ui';
import { summarizeCart, getOrdersTabLiveCue } from '@shc/utils';
import { useCart } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrder';

const TAB_META: Record<string, { label: string; iconKey: 'discover' | 'orders' | 'cart'; testID: string }> = {
  index: { label: 'Home', iconKey: 'discover', testID: 'discover-tab' },
  'orders/index': { label: 'Orders', iconKey: 'orders', testID: 'orders-tab' },
  cart: { label: 'Cart', iconKey: 'cart', testID: 'cart-tab' },
};

const VISIBLE_TABS = new Set(Object.keys(TAB_META));
const HIDE_CART_BAR = new Set([
  'cart',
  'checkout',
  'product/[id]',
  'cook/[slug]/index',
  'cook/[slug]/ratings',
  'drops/[id]',
  'search',
  'orders/[id]',
  'request',
  'tiffin/kitchen/[cookId]',
  'tiffin/confirm',
  'tiffin/planner',
  'tiffin/manage',
]);
const HIDE_TAB_BAR = new Set([
  'profile/index',
  'request',
  'location',
  'checkout',
  'product/[id]',
  'cook/[slug]/index',
  'cook/[slug]/ratings',
  'drops/[id]',
  'orders/[id]',
  'orders/manage',
  'tiffin/kitchen/[cookId]',
  'tiffin/confirm',
  'tiffin/planner',
  'tiffin/manage',
  'tiffin/pause',
  'tiffin/recharge',
  'tiffin/subscriptions',
  'tiffin/calendar',
  'tiffin/menu',
]);

export function CustomerTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { loading: authLoading } = useAuth();
  const { notifyTabChange } = useTabDirection();
  const { data: cart } = useCart();
  const { data: orders = [] } = useOrders('customer');
  const ordersLiveCue = getOrdersTabLiveCue(
    orders as Array<{ shc_status?: string; collection_date?: string }>
  );

  // Guests browse signed-out — never show sticky cart or tab badge (web parity).
  // Guests can browse and order — cart uses device-local guest session.
  const canShowCart = !authLoading;
  const items = ((canShowCart ? cart?.items : undefined) ?? []) as Parameters<typeof summarizeCart>[0];
  const firstItem = items[0];
  const firstName =
    firstItem && typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem
      ? String((firstItem as { name?: string }).name || '')
      : undefined;
  const summary = summarizeCart(items, firstName);

  if (!state?.routes?.length) return null;

  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.has(route.name));
  const activeRoute = state.routes[state.index];
  const showCartBar = canShowCart && summary.hasItems && !HIDE_CART_BAR.has(activeRoute?.name ?? '');
  const hideTabBar = HIDE_TAB_BAR.has(activeRoute?.name ?? '');

  const tabs: SHCBottomTab[] = visibleRoutes.flatMap((route) => {
    const meta = TAB_META[route.name];
    if (!meta) return [];
    return [{
      key: route.name,
      label: meta.label,
      iconKey: meta.iconKey,
      testID: meta.testID,
      badge: route.name === 'cart' && canShowCart && summary.hasItems ? summary.badgeLabel : undefined,
      ordersLiveCue: route.name === 'orders/index' && ordersLiveCue === 'cooking' ? 'cooking' : undefined,
    }];
  });

  const openCart = useCallback(() => {
    navigation.navigate('cart');
  }, [navigation]);

  if (hideTabBar) {
    return showCartBar ? (
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          paddingBottom: Math.max(insets.bottom, 8),
          zIndex: 20,
        }}
      >
        <GourmeatStickyCartBar
          itemCount={summary.itemCount}
          countLabel={summary.countLabel}
          totalLabel={summary.totalLabel}
          previewName={summary.previewName}
          onPress={openCart}
        />
      </View>
    ) : null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        paddingBottom: Math.max(insets.bottom, 8),
        zIndex: 20,
      }}
    >
      {showCartBar && (
        <GourmeatStickyCartBar
          itemCount={summary.itemCount}
          countLabel={summary.countLabel}
          totalLabel={summary.totalLabel}
          previewName={summary.previewName}
          onPress={openCart}
        />
      )}
      <GourmeatFloatingTabBar
        tabs={tabs}
        activeKey={activeRoute?.name ?? 'index'}
        onTabPress={(key) => {
          notifyTabChange(key);
          navigation.navigate(key);
        }}
        testID="bottom-tab-bar"
      />
    </View>
  );
}