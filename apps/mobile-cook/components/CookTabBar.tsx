// @ts-nocheck — expo-router tab bar props; types from @react-navigation/bottom-tabs
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { GourmeatFloatingTabBar, type SHCBottomTab, useTabDirection } from '@shc/ui';

const TAB_META: Record<string, { label: string; iconKey: 'dashboard' | 'orders' | 'listings'; testID: string }> = {
  dashboard: { label: 'Home', iconKey: 'dashboard', testID: 'tab-cook-dashboard' },
  orders: { label: 'Orders', iconKey: 'orders', testID: 'tab-cook-orders' },
  listings: { label: 'Listings', iconKey: 'listings', testID: 'tab-cook-listings' },
};

const VISIBLE_TABS = new Set(Object.keys(TAB_META));

export function CookTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { notifyTabChange } = useTabDirection();
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.has(route.name));
  // Nested stack (orders/[id]) still belongs to the parent tab "orders"
  const activeRoute = state.routes[state.index];
  const activeKey =
    activeRoute?.name && VISIBLE_TABS.has(activeRoute.name)
      ? activeRoute.name
      : visibleRoutes.find((r) => r.name === 'orders') && String(activeRoute?.name || '').startsWith('orders')
        ? 'orders'
        : activeRoute?.name && VISIBLE_TABS.has(activeRoute.name.split('/')[0])
          ? activeRoute.name.split('/')[0]
          : activeRoute?.name ?? 'dashboard';

  const tabs: SHCBottomTab[] = visibleRoutes.map((route) => {
    const meta = TAB_META[route.name];
    return {
      key: route.name,
      label: meta.label,
      iconKey: meta.iconKey,
      testID: meta.testID,
    };
  });

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
      <GourmeatFloatingTabBar
        tabs={tabs}
        activeKey={VISIBLE_TABS.has(activeKey) ? activeKey : 'dashboard'}
        onTabPress={(key) => {
          notifyTabChange(key);
          // Pop nested stack when re-tapping Orders while on detail
          const alreadyFocused = state.routes[state.index]?.name === key;
          if (alreadyFocused && key === 'orders') {
            navigation.navigate(key, { screen: 'index' });
            return;
          }
          navigation.navigate(key);
        }}
        testID="cook-bottom-tab-bar"
      />
    </View>
  );
}