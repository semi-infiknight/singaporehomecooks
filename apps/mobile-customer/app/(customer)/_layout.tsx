import React, { useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { gourmeatColors } from '@shc/ui/theme';
import { TabDirectionProvider, useTabDirection } from '@shc/ui';
import { CustomerTabBar } from '../../components/CustomerTabBar';
import { usePushNotificationRouting } from '../../lib/usePushNotificationRouting';

const CUSTOMER_TAB_ORDER = ['index', 'orders/index', 'cart', 'profile/index'];

function CustomerTabIndexSync({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { notifyTabChange } = useTabDirection();
  usePushNotificationRouting('customer');
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
      }}
      tabBar={(props) => <CustomerTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Discover', headerShown: false }} />
      <Tabs.Screen name="orders/index" options={{ title: 'My Orders', headerShown: false }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', headerShown: false }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile', headerShown: false }} />

      <Tabs.Screen name="search" options={{ href: null, title: 'Advanced Search', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="occasions" options={{ href: null, title: 'Occasions', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="category/[id]" options={{ href: null, title: 'Category', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="cook/[slug]/index" options={{ href: null, title: 'Cook Profile', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="cook/[slug]/ratings" options={{ href: null, title: 'Cook Ratings', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="drops/[id]" options={{ href: null, title: 'Cooking soon', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="product/[id]" options={{ href: null, title: 'Dish', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="checkout" options={{ href: null, title: 'Checkout (PayNow)', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="orders/[id]" options={{ href: null, title: 'Your Order', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="orders/manage" options={{ href: null, title: 'Manage order', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="request" options={{ href: null, title: 'Request a Dish', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="location" options={{ href: null, title: 'Collection location', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tiffin/index" options={{ href: null, title: 'Tiffin', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tiffin/kitchen/[cookId]" options={{ href: null, title: 'Tiffin Kitchen', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tiffin/confirm" options={{ href: null, title: 'Tiffin Confirmed', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tiffin/planner" options={{ href: null, title: 'Weekly Plan', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tiffin/menu" options={{ href: null, title: 'Tiffin Menu', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tiffin/manage" options={{ href: null, title: 'Manage Tiffin', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tiffin/calendar" options={{ href: null, title: 'Tiffin Calendar', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tiffin/pause" options={{ href: null, title: 'Pause Tiffin', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tiffin/recharge" options={{ href: null, title: 'Recharge Tiffin', headerShown: false, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="tiffin/subscriptions" options={{ href: null, title: 'Tiffin Subscriptions', headerShown: false, tabBarStyle: { display: 'none' } }} />
    </Tabs>
    </CustomerTabIndexSync>
    </TabDirectionProvider>
  );
}