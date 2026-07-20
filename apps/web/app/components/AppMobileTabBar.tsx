'use client';

import React, { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '../../lib/useProducts';
import { useAuth } from '../../lib/useAuth';
import { useOrders } from '../../lib/useOrder';
import { summarizeCart, getOrdersTabLiveCue } from '@shc/utils';
import { hideMobileTabBar, hideMobileStickyCart } from '../../lib/mobile-chrome';
import { useGuestAuthTray } from '../../lib/useGuestAuthTray';
import { StickyCartBar, GourmeatFloatingTabBar, type GourmeatBottomTab } from './SHCWebComponents';

const TAB_ROUTES: Array<{
  key: string;
  href: string;
  label: string;
  iconKey: GourmeatBottomTab['iconKey'];
  testID: string;
  match: (p: string) => boolean;
  needsAuth?: boolean;
}> = [
  {
    key: 'index',
    href: '/',
    label: 'Home',
    iconKey: 'discover',
    testID: 'discover-tab',
    match: (p) =>
      p === '/' ||
      p.startsWith('/product') ||
      p.startsWith('/cook') ||
      p.startsWith('/category') ||
      p.startsWith('/tiffin'),
  },
  {
    key: 'orders/index',
    href: '/orders',
    label: 'Orders',
    iconKey: 'orders',
    testID: 'orders-tab',
    match: (p) => p === '/orders' || p.startsWith('/orders/'),
    needsAuth: true,
  },
  {
    key: 'cart',
    href: '/cart',
    label: 'Cart',
    iconKey: 'cart',
    testID: 'cart-tab',
    match: (p) => p === '/cart' || p === '/checkout',
    needsAuth: true,
  },
  {
    key: 'profile/index',
    href: '/profile',
    label: 'Profile',
    iconKey: 'profile',
    testID: 'profile-tab',
    match: (p) => p.startsWith('/profile'),
    needsAuth: true,
  },
];

function resolveActiveKey(pathname: string): string {
  const hit = TAB_ROUTES.find((tab) => tab.match(pathname));
  return hit?.key ?? 'index';
}

export function AppMobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showGuestAuthTray } = useGuestAuthTray();
  const { data: cart } = useCart();
  const { data: orders = [] } = useOrders();
  const ordersLiveCue = user ? getOrdersTabLiveCue(orders as Array<{ shc_status?: string; collection_date?: string }>) : null;

  const canShowCart = Boolean(user) && !authLoading;
  const rawItems = canShowCart ? cart?.items : undefined;
  const items = Array.isArray(rawItems) ? rawItems : [];
  const firstItem = items[0];
  const firstName =
    firstItem && typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem
      ? String((firstItem as { name?: string }).name || '')
      : undefined;
  const summary = summarizeCart(items, firstName);

  const tabBarHidden = hideMobileTabBar(pathname);
  const cartBarHidden = hideMobileStickyCart(pathname);
  const showCartBar = canShowCart && summary.hasItems && !cartBarHidden;

  const tabs: GourmeatBottomTab[] = useMemo(
    () =>
      TAB_ROUTES.map((tab) => ({
        key: tab.key,
        href: tab.href,
        label: tab.label,
        iconKey: tab.iconKey,
        testID: tab.testID,
        badge: tab.key === 'cart' && canShowCart && summary.hasItems ? summary.badgeLabel : undefined,
        ordersLiveCue: tab.key === 'orders/index' && ordersLiveCue === 'cooking' ? 'cooking' : undefined,
        needsAuth: tab.needsAuth,
      })),
    [canShowCart, ordersLiveCue, summary.badgeLabel, summary.hasItems]
  );

  const activeKey = resolveActiveKey(pathname);

  if (tabBarHidden && !showCartBar) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-4 pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="pointer-events-auto flex flex-col gap-2">
        {showCartBar && (
          <StickyCartBar
            itemCount={summary.itemCount}
            countLabel={summary.countLabel}
            totalLabel={summary.totalLabel}
            previewName={summary.previewName}
          />
        )}
        {!tabBarHidden && (
          <GourmeatFloatingTabBar
            tabs={tabs}
            activeKey={activeKey}
            onTabPress={(key) => {
              const tab = TAB_ROUTES.find((t) => t.key === key);
              if (!tab) return;
              if (tab.needsAuth && !authLoading && !user) {
                const title =
                  tab.key === 'orders/index'
                    ? 'Sign in to view orders'
                    : tab.key === 'cart'
                      ? 'Sign in to view cart'
                      : 'Sign in for wallet & account';
                showGuestAuthTray(
                  title,
                  'Browse kitchens on Home — sign in for orders, cart, and wallet.',
                  tab.href
                );
                return;
              }
              router.push(tab.href);
            }}
          />
        )}
      </div>
    </div>
  );
}
