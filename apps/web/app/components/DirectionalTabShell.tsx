'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  TabDirectionProviderWeb,
  SHCDirectionalTabSceneWeb,
  useTabDirectionWeb,
} from './SHCWebComponents';

const CUSTOMER_TAB_ROUTES = ['/', '/orders', '/cart', '/profile'] as const;
const COOK_TAB_ROUTES = [
  '/cook-portal/dashboard',
  '/cook-portal/orders',
  '/cook-portal/listings',
  '/cook-portal/compliance',
] as const;

function resolveTabKey(pathname: string, routeOrder: readonly string[]): string | undefined {
  if (pathname === '/') return '/';
  return routeOrder.find((route) => route !== '/' && (pathname === route || pathname.startsWith(`${route}/`)));
}

function TabIndexSync({
  routeOrder,
  children,
}: {
  routeOrder: readonly string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const { notifyTabChange } = useTabDirectionWeb();

  useEffect(() => {
    const key = resolveTabKey(pathname, routeOrder);
    if (key) notifyTabChange(key);
  }, [pathname, notifyTabChange, routeOrder]);

  return <>{children}</>;
}

function resolveCustomerTabSceneTestId(pathname: string): string {
  if (pathname === '/' || pathname.startsWith('/product') || pathname.startsWith('/cook') || pathname.startsWith('/category') || pathname.startsWith('/tiffin') || pathname.startsWith('/search') || pathname.startsWith('/drops')) {
    return 'discover-tab-scene';
  }
  if (pathname === '/orders' || pathname.startsWith('/orders/') || pathname.startsWith('/chat/')) {
    return 'orders-tab-scene';
  }
  if (pathname === '/cart' || pathname === '/checkout') {
    return 'cart-tab-scene';
  }
  if (pathname.startsWith('/profile')) {
    return 'profile-tab-scene';
  }
  return 'customer-web-tab-scene';
}

function DirectionalScene({
  children,
  testID,
}: {
  children: React.ReactNode;
  testID?: string;
}) {
  const { tabIndex, prevIndex } = useTabDirectionWeb();
  return (
    <SHCDirectionalTabSceneWeb tabIndex={tabIndex} prevIndex={prevIndex} testID={testID}>
      {children}
    </SHCDirectionalTabSceneWeb>
  );
}

export function DirectionalTabShell({
  mode,
  children,
}: {
  mode: 'customer' | 'cook';
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const routeOrder = mode === 'cook' ? COOK_TAB_ROUTES : CUSTOMER_TAB_ROUTES;
  const testID =
    mode === 'cook'
      ? 'cook-web-tab-scene'
      : resolveCustomerTabSceneTestId(pathname);

  return (
    <TabDirectionProviderWeb routeOrder={[...routeOrder]}>
      <TabIndexSync routeOrder={routeOrder}>
        <DirectionalScene testID={testID}>{children}</DirectionalScene>
      </TabIndexSync>
    </TabDirectionProviderWeb>
  );
}