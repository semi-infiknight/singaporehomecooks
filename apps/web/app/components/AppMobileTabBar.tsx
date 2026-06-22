'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, ShoppingBag, Wallet } from 'lucide-react';
import { useCart } from '../../lib/useProducts';
import { summarizeCart } from '@shc/utils';
import { StickyCartBar } from './SHCWebComponents';

const TABS = [
  { href: '/', label: 'Home', icon: Home, testID: 'mobile-tab-discover', match: (p: string) => p === '/' || p.startsWith('/product') || p.startsWith('/cook') },
  { href: '/orders', label: 'Orders', icon: Receipt, testID: 'mobile-tab-orders', match: (p: string) => p.startsWith('/orders') },
  { href: '/cart', label: 'Cart', icon: ShoppingBag, testID: 'mobile-tab-cart', match: (p: string) => p === '/cart' || p === '/checkout' },
  { href: '/profile', label: 'Wallet', icon: Wallet, testID: 'mobile-tab-profile', match: (p: string) => p.startsWith('/profile') },
];

const HIDE_CART_BAR = /^\/(cart|checkout)(\/|$)/;

export function AppMobileTabBar() {
  const pathname = usePathname();
  const { data: cart } = useCart();
  const items = ((cart?.items ?? []) as Parameters<typeof summarizeCart>[0]) || [];
  const firstItem = items[0];
  const firstName =
    firstItem && typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem
      ? String((firstItem as { name?: string }).name || '')
      : undefined;
  const summary = summarizeCart(items, firstName);
  const showCartBar = summary.hasItems && !HIDE_CART_BAR.test(pathname);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-3 pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="pointer-events-auto flex flex-col gap-2">
        {showCartBar && (
          <StickyCartBar
            itemCount={summary.itemCount}
            countLabel={summary.countLabel}
            totalLabel={summary.totalLabel}
            previewName={summary.previewName}
          />
        )}
        <nav
          className="rounded-[28px] bg-[var(--shc-gourmeat-nav)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] px-2 py-2"
          data-testid="mobile-bottom-tab-bar"
          aria-label="Main"
        >
          <div className="flex items-stretch min-h-[52px]">
            {TABS.map((tab) => {
              const active = tab.match(pathname);
              const Icon = tab.icon;
              const badge = tab.href === '/cart' && summary.hasItems ? summary.badgeLabel : null;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  data-testid={tab.testID}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 relative ${
                    active ? 'text-primary' : 'text-white/55'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="relative">
                    <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} strokeWidth={active ? 2.5 : 2} aria-hidden />
                    {badge ? (
                      <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-black bg-primary text-primary-foreground rounded-full px-1">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  <span className={`text-[10px] ${active ? 'font-bold text-primary' : 'font-medium'}`}>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}