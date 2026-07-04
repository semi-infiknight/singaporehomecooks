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
  const routeOrder = mode === 'cook' ? COOK_TAB_ROUTES : CUSTOMER_TAB_ROUTES;
  const testID = mode === 'cook' ? 'cook-web-tab-scene' : 'customer-web-tab-scene';

  return (
    <TabDirectionProviderWeb routeOrder={[...routeOrder]}>
      <TabIndexSync routeOrder={routeOrder}>
        <DirectionalScene testID={testID}>{children}</DirectionalScene>
      </TabIndexSync>
    </TabDirectionProviderWeb>
  );
}