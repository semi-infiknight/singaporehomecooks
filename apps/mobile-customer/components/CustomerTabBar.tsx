// @ts-nocheck — expo-router tab bar props; types from @react-navigation/bottom-tabs
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { GourmeatFloatingTabBar, GourmeatStickyCartBar, type SHCBottomTab, useTabDirection } from '@shc/ui';
import { summarizeCart, getOrdersTabLiveCue } from '@shc/utils';
import { useCart } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import { useGuestAuthTray } from '../hooks/useGuestAuthTray';
import { useOrders } from '../hooks/useOrder';

const TAB_META: Record<string, { label: string; iconKey: 'discover' | 'orders' | 'cart' | 'profile'; testID: string }> = {
  index: { label: 'Home', iconKey: 'discover', testID: 'discover-tab' },
  'orders/index': { label: 'Orders', iconKey: 'orders', testID: 'orders-tab' },
  cart: { label: 'Cart', iconKey: 'cart', testID: 'cart-tab' },
  'profile/index': { label: 'Profile', iconKey: 'profile', testID: 'profile-tab' },
};

const VISIBLE_TABS = new Set(Object.keys(TAB_META));
const HIDE_CART_BAR = new Set([
  'cart',
  'checkout',
  'product/[id]',
  'cook/[slug]',
  'search',
  'orders/[id]',
  'request',
  'tiffin/kitchen/[cookId]',
  'tiffin/confirm',
  'tiffin/planner',
  'tiffin/manage',
]);
const HIDE_TAB_BAR = new Set([
  'request',
  'location',
  'checkout',
  'product/[id]',
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
  const { user, loading: authLoading } = useAuth();
  const { notifyTabChange } = useTabDirection();
  const { showGuestAuthTray } = useGuestAuthTray();
  const { data: cart } = useCart();
  const { data: orders = [] } = useOrders('customer');
  const ordersLiveCue = user ? getOrdersTabLiveCue(orders as Array<{ shc_status?: string; collection_date?: string }>) : null;

  // Guests browse signed-out — never show sticky cart or tab badge (web parity).
  const canShowCart = Boolean(user) && !authLoading;
  const items = (canShowCart ? cart?.items : []) as Parameters<typeof summarizeCart>[0];
  const firstName = items[0] && 'name' in (items[0] as object) ? String((items[0] as { name?: string }).name || '') : undefined;
  const summary = summarizeCart(items, firstName);

  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.has(route.name));
  const activeRoute = state.routes[state.index];
  const showCartBar = canShowCart && summary.hasItems && !HIDE_CART_BAR.has(activeRoute?.name ?? '');
  const hideTabBar = HIDE_TAB_BAR.has(activeRoute?.name ?? '');

  const tabs: SHCBottomTab[] = visibleRoutes.map((route) => {
    const meta = TAB_META[route.name];
    return {
      key: route.name,
      label: meta.label,
      iconKey: meta.iconKey,
      testID: meta.testID,
      badge: route.name === 'cart' && canShowCart && summary.hasItems ? summary.badgeLabel : undefined,
      ordersLiveCue: route.name === 'orders/index' && ordersLiveCue === 'cooking' ? 'cooking' : undefined,
    };
  });

  const openCart = useCallback(() => {
    if (!authLoading && !user) {
      showGuestAuthTray(
        'Sign in to view cart',
        'Browse freely — sign in to checkout and track orders.',
        '/(customer)/cart'
      );
      return;
    }
    navigation.navigate('cart');
  }, [navigation, showGuestAuthTray, user]);

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
          // Guest browse: Home only for free navigation; account tabs need sign-in
          if (!authLoading && !user && key !== 'index') {
            const returnTo =
              key === 'orders/index'
                ? '/(customer)/orders'
                : key === 'cart'
                  ? '/(customer)/cart'
                  : '/(customer)/profile';
            showGuestAuthTray(
              key === 'orders/index'
                ? 'Sign in to view orders'
                : key === 'cart'
                  ? 'Sign in to view cart'
                  : 'Sign in for wallet & account',
              'Browse kitchens on Home — sign in for orders, cart, and wallet.',
              returnTo
            );
            return;
          }
          notifyTabChange(key);
          navigation.navigate(key);
        }}
        testID="bottom-tab-bar"
      />
    </View>
  );
}