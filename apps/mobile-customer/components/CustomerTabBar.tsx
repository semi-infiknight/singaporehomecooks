import React, { useCallback } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { GourmeatFloatingTabBar, GourmeatStickyCartBar, type SHCBottomTab } from '@shc/ui';
import { summarizeCart } from '@shc/utils';
import { useCart } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';

const TAB_META: Record<string, { label: string; iconKey: 'discover' | 'orders' | 'cart' | 'profile'; testID: string }> = {
  index: { label: 'Home', iconKey: 'discover', testID: 'discover-tab' },
  'orders/index': { label: 'Orders', iconKey: 'orders', testID: 'orders-tab' },
  cart: { label: 'Cart', iconKey: 'cart', testID: 'cart-tab' },
  'profile/index': { label: 'Wallet', iconKey: 'profile', testID: 'profile-tab' },
};

const VISIBLE_TABS = new Set(Object.keys(TAB_META));
const HIDE_CART_BAR = new Set(['cart', 'checkout', 'product/[id]', 'cook/[slug]', 'search', 'orders/[id]', 'request']);
const HIDE_TAB_BAR = new Set(['request', 'location', 'checkout', 'product/[id]', 'orders/[id]']);

export function CustomerTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data: cart } = useCart();

  const items = (cart?.items || []) as Parameters<typeof summarizeCart>[0];
  const firstName = items[0] && 'name' in (items[0] as object) ? String((items[0] as { name?: string }).name || '') : undefined;
  const summary = summarizeCart(items, firstName);

  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.has(route.name));
  const activeRoute = state.routes[state.index];
  const showCartBar = summary.hasItems && !HIDE_CART_BAR.has(activeRoute?.name ?? '');
  const hideTabBar = HIDE_TAB_BAR.has(activeRoute?.name ?? '');

  const tabs: SHCBottomTab[] = visibleRoutes.map((route) => {
    const meta = TAB_META[route.name];
    return {
      key: route.name,
      label: meta.label,
      iconKey: meta.iconKey,
      testID: meta.testID,
      badge: route.name === 'cart' && summary.hasItems ? summary.badgeLabel : undefined,
    };
  });

  const openCart = useCallback(() => {
    if (!user) {
      Alert.alert('Sign in to view cart', 'Browse freely — sign in to checkout and track orders.', [
        { text: 'Keep browsing', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/(shared)/auth' as any) },
      ]);
      return;
    }
    navigation.navigate('cart');
  }, [navigation, router, user]);

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
        onTabPress={(key) => navigation.navigate(key)}
        testID="bottom-tab-bar"
      />
    </View>
  );
}