import React, { useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { gourmeatColors } from '@shc/ui/theme';
import { TabDirectionProvider, useTabDirection } from '@shc/ui';
import { useShcI18n, getCookLayoutCopy } from '@shc/i18n';
import { CookTabBar } from '../../components/CookTabBar';

const COOK_TAB_ORDER = ['dashboard', 'orders', 'listings', 'compliance'];

function CookTabIndexSync({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { notifyTabChange } = useTabDirection();
  useEffect(() => {
    const key = COOK_TAB_ORDER.find((k) => pathname?.includes(`/${k}`) || pathname?.endsWith(k));
    if (key) notifyTabChange(key);
  }, [pathname, notifyTabChange]);
  return <>{children}</>;
}

export default function CookLayout() {
  const { locale } = useShcI18n();
  const layoutCopy = getCookLayoutCopy(locale);

  return (
    <TabDirectionProvider routeOrder={COOK_TAB_ORDER}>
    <CookTabIndexSync>
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
      <Tabs.Screen name="dashboard" options={{ title: layoutCopy.dashboard, headerShown: false }} />
      <Tabs.Screen name="orders" options={{ title: layoutCopy.ordersTab, headerShown: false }} />
      <Tabs.Screen name="listings" options={{ title: layoutCopy.listingsTab, headerShown: false }} />
      <Tabs.Screen name="compliance" options={{ title: layoutCopy.complianceTab, headerShown: false }} />

      <Tabs.Screen name="orders/[id]" options={{ href: null, title: layoutCopy.manageOrder, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="earnings" options={{ href: null, title: layoutCopy.earnings, tabBarStyle: { display: 'none' } }} />
    </Tabs>
    </CookTabIndexSync>
    </TabDirectionProvider>
  );
}
