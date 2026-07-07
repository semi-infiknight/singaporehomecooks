// @ts-nocheck — expo-router tab bar props; types from @react-navigation/bottom-tabs
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { GourmeatFloatingTabBar, type SHCBottomTab, useTabDirection } from '@shc/ui';
import { useShcI18n } from '@shc/i18n';

const TAB_META: Record<string, { labelKey: 'cook.tab.home' | 'cook.tab.orders' | 'cook.tab.listings' | 'cook.tab.docs'; iconKey: 'dashboard' | 'orders' | 'listings' | 'compliance'; testID: string }> = {
  dashboard: { labelKey: 'cook.tab.home', iconKey: 'dashboard', testID: 'tab-cook-dashboard' },
  orders: { labelKey: 'cook.tab.orders', iconKey: 'orders', testID: 'tab-cook-orders' },
  listings: { labelKey: 'cook.tab.listings', iconKey: 'listings', testID: 'tab-cook-listings' },
  compliance: { labelKey: 'cook.tab.docs', iconKey: 'compliance', testID: 'tab-cook-compliance' },
};

const VISIBLE_TABS = new Set(Object.keys(TAB_META));

export function CookTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useShcI18n();
  const { notifyTabChange } = useTabDirection();
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.has(route.name));
  const activeRoute = state.routes[state.index];

  const tabs: SHCBottomTab[] = visibleRoutes.map((route) => {
    const meta = TAB_META[route.name];
    return {
      key: route.name,
      label: t(meta.labelKey),
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
        onTabPress={(key) => {
          notifyTabChange(key);
          navigation.navigate(key);
        }}
        testID="cook-bottom-tab-bar"
      />
    </View>
  );
}
