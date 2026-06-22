import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { GourmeatFloatingTabBar, type SHCBottomTab } from '@shc/ui';

const TAB_META: Record<string, { label: string; iconKey: 'dashboard' | 'orders' | 'listings' | 'compliance'; testID: string }> = {
  dashboard: { label: 'Home', iconKey: 'dashboard', testID: 'tab-cook-dashboard' },
  orders: { label: 'Orders', iconKey: 'orders', testID: 'tab-cook-orders' },
  listings: { label: 'Listings', iconKey: 'listings', testID: 'tab-cook-listings' },
  compliance: { label: 'Docs', iconKey: 'compliance', testID: 'tab-cook-compliance' },
};

const VISIBLE_TABS = new Set(Object.keys(TAB_META));

export function CookTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.has(route.name));
  const activeRoute = state.routes[state.index];

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
        activeKey={activeRoute?.name ?? 'dashboard'}
        onTabPress={(key) => navigation.navigate(key)}
        testID="cook-bottom-tab-bar"
      />
    </View>
  );
}