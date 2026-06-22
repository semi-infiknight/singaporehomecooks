import React from 'react';
import { Tabs } from 'expo-router';
import { gourmeatColors } from '@shc/ui';
import { CookTabBar } from '../../components/CookTabBar';

export default function CookLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: gourmeatColors.background },
        headerTintColor: gourmeatColors.text,
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        sceneStyle: { paddingBottom: 88 },
      }}
      tabBar={(props) => <CookTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', headerShown: false }} />
      <Tabs.Screen name="orders" options={{ title: 'Cook Orders', headerShown: false }} />
      <Tabs.Screen name="listings" options={{ title: 'My Listings', headerShown: false }} />
      <Tabs.Screen name="compliance" options={{ title: 'Compliance', headerShown: false }} />

      <Tabs.Screen name="orders/[id]" options={{ href: null, title: 'Manage Order', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="earnings" options={{ href: null, title: 'Earnings', tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}