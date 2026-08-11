import React, { useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { gourmeatColors } from '@shc/ui/theme';
import { TabDirectionProvider, useTabDirection } from '@shc/ui';
import { CookTabBar } from '../../components/CookTabBar';
import { CookAuthGate } from '../../components/CookAuthGate';
import { usePushNotificationRouting } from '../../lib/usePushNotificationRouting';

const COOK_TAB_ORDER = ['dashboard', 'orders', 'listings', 'compliance'];

function CookTabIndexSync({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { notifyTabChange } = useTabDirection();
  usePushNotificationRouting();
  useEffect(() => {
    const key = COOK_TAB_ORDER.find((k) => pathname?.includes(`/${k}`) || pathname?.endsWith(k));
    if (key) notifyTabChange(key);
  }, [pathname, notifyTabChange]);
  return <>{children}</>;
}

export default function CookLayout() {
  return (
    <CookAuthGate>
    <TabDirectionProvider routeOrder={COOK_TAB_ORDER}>
    <CookTabIndexSync>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      tabBar={(props) => <CookTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', headerShown: false }} />
      {/* Folder route: orders/index + orders/[id] (never orders.tsx + orders/ together) */}
      <Tabs.Screen name="orders" options={{ title: 'Cook Orders', headerShown: false }} />
      <Tabs.Screen name="listings" options={{ title: 'My Listings', headerShown: false }} />
      <Tabs.Screen name="compliance" options={{ title: 'Compliance', headerShown: false }} />

      <Tabs.Screen name="earnings" options={{ href: null, title: 'Earnings', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="settings" options={{ href: null, title: 'Settings', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="batches" options={{ href: null, title: 'Cooking soon', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tiffin/index" options={{ href: null, title: 'Tiffin', headerShown: false, tabBarStyle: { display: 'none' } }} />
    </Tabs>
    </CookTabIndexSync>
    </TabDirectionProvider>
    </CookAuthGate>
  );
}