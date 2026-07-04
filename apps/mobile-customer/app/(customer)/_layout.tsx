import React, { useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { gourmeatColors } from '@shc/ui/theme';
import { TabDirectionProvider, useTabDirection } from '@shc/ui';
import { CustomerTabBar } from '../../components/CustomerTabBar';

const CUSTOMER_TAB_ORDER = ['index', 'orders/index', 'cart', 'profile/index'];

function CustomerTabIndexSync({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { notifyTabChange } = useTabDirection();
  useEffect(() => {
    const key = CUSTOMER_TAB_ORDER.find((k) => pathname?.includes(k.replace('/index', '')) || pathname?.endsWith(k));
    if (key) notifyTabChange(key);
  }, [pathname, notifyTabChange]);
  return <>{children}</>;
}

export default function CustomerLayout() {
  return (
    <TabDirectionProvider routeOrder={CUSTOMER_TAB_ORDER}>
    <CustomerTabIndexSync>
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
        sceneStyle: { paddingBottom: 100 },
      }}
      tabBar={(props) => <CustomerTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Discover', headerShown: false }} />
      <Tabs.Screen name="orders/index" options={{ title: 'My Orders', headerShown: false }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', headerShown: false }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile', headerShown: false }} />

      <Tabs.Screen name="search" options={{ href: null, title: 'Advanced Search', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="cook/[slug]" options={{ href: null, title: 'Cook Profile', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="product/[id]" options={{ href: null, title: 'Dish', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="checkout" options={{ href: null, title: 'Checkout (PayNow)', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="orders/[id]" options={{ href: null, title: 'Your Order', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="request" options={{ href: null, title: 'Request a Dish', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="location" options={{ href: null, title: 'Collection location', headerShown: false, tabBarStyle: { display: 'none' } }} />
    </Tabs>
    </CustomerTabIndexSync>
    </TabDirectionProvider>
  );
}