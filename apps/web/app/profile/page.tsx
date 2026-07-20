'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, ShieldCheck, User } from 'lucide-react';
import {
  accountMenuItemsSignedIn,
  accountMenuItemsGuest,
  orderIdFromNotificationType,
  BENTO_ACTION_IMAGES,
  favoritesToReorderDishes,
  getDishImageUrl,
} from '@shc/utils';
import { useNotifications } from '../../lib/useOrder';
import { useFavorites } from '../../lib/useFavorites';
import {
  SHCCard,
  SHCButton,
  AccountMenuList,
  SHCSkeletonAccountScreen,
  GourmeatScreenHeader,
  VisualBentoTile,
  ZomatoDishRowRail,
} from '../components/SHCWebComponents';
import { WebPushOptIn } from '../components/WebPushOptIn';
import { useAuth } from '../../lib/useAuth';

const QUICK_TILES = [
  { label: 'Orders', image: BENTO_ACTION_IMAGES.orders, href: '/orders', testID: 'profile-orders-tile' },
  { label: 'Tiffin', image: BENTO_ACTION_IMAGES.checkout, href: '/tiffin', testID: 'profile-tiffin-tile' },
  { label: 'Search', image: BENTO_ACTION_IMAGES.request, href: '/search', testID: 'profile-search-tile' },
];

export default function Profile() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-6 shc-tab-bar-pad" data-testid="customer-profile-screen">
          <SHCSkeletonAccountScreen />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, loading: authLoading } = useAuth();
  const { data: notifs = [], markRead } = useNotifications();
  const { favorites } = useFavorites();
  const savedDishes = favoritesToReorderDishes(favorites);
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = (notifs as Array<{ read?: boolean }>).filter((n) => !n.read).length;

  useEffect(() => {
    if (searchParams.get('showRequest') === '1') {
      router.replace('/request');
    }
  }, [searchParams, router]);

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 shc-tab-bar-pad" data-testid="customer-profile-screen">
        <SHCSkeletonAccountScreen />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 shc-tab-bar-pad" data-testid="customer-profile-screen">
        <GourmeatScreenHeader title="Account" subtitle="Sign in for orders and account tools" />
        <SHCCard
          className="mb-4 bg-[var(--shc-bento-peach)] border-2 border-[var(--shc-border-brutal)]"
          data-testid="guest-profile-gate"
        >
          <User className="w-7 h-7 text-primary mb-2" strokeWidth={2.5} aria-hidden />
          <p className="font-black text-foreground mb-2">You are exploring freely</p>
          <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
            Discover kitchens and dishes on Home. Orders and account tools only appear after you sign in.
          </p>
        </SHCCard>
        <Link href="/login" data-testid="guest-profile-signin">
          <SHCButton className="w-full mb-4">Sign Up / Log In</SHCButton>
        </Link>
        <AccountMenuList items={accountMenuItemsGuest().filter((i) => i.id !== 'login')} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 shc-tab-bar-pad" data-testid="customer-profile-screen">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <GourmeatScreenHeader title="Account" subtitle={user.name || 'You'} />
        </div>
        <button
          type="button"
          className="relative shrink-0 mt-2 p-2 rounded-lg border-2 border-[var(--shc-border-brutal)] bg-card shadow-[var(--shc-shadow-brutal-sm)]"
          aria-label="Notifications"
          data-testid="notif-bell"
          onClick={() => {
            const next = !showNotifs;
            setShowNotifs(next);
            if (next && unreadCount > 0) {
              markRead({ all: true });
            }
          }}
        >
          <Bell className="w-[22px] h-[22px] text-foreground" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center text-[9px] font-black bg-primary text-primary-foreground border-2 border-[var(--shc-border-brutal)] rounded-full px-1">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <AccountMenuList items={accountMenuItemsSignedIn()} />

      <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
        {QUICK_TILES.map((t) => (
          <VisualBentoTile
            key={t.label}
            imageUrl={t.image}
            label={t.label}
            href={t.href}
            variant="bento-mint"
            testID={t.testID}
          />
        ))}
      </div>

      {savedDishes.length > 0 && (
        <div className="mb-4">
          <p className="text-base font-extrabold text-foreground">Saved dishes</p>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Tap a dish to order again</p>
          <ZomatoDishRowRail
            title=""
            products={savedDishes.map((d) => ({
              id: d.id,
              name: d.name,
              cook_name: d.cook_name || '',
              price: d.price,
              cuisine: d.cuisine,
              image_url: getDishImageUrl({ id: d.id, name: d.name, cuisine: d.cuisine }),
            }))}
            onDishPress={(id) => router.push(`/product/${id}`)}
            testID="profile-saved-rail"
          />
        </div>
      )}

      <SHCCard className="mb-4 bg-[var(--shc-bento-peach)] border-2 border-[var(--shc-border-brutal)]">
        <ShieldCheck className="w-7 h-7 text-primary mb-2" strokeWidth={2.5} aria-hidden />
        <p className="font-black text-foreground mb-1">5-Layer Trust</p>
        <p className="text-sm font-semibold text-muted-foreground leading-relaxed mb-3">
          Verified cooks · allergen disclosure · HDB collection · PayNow escrow
        </p>
        <Link href="/content/trust" className="text-sm font-bold text-primary hover:underline" data-testid="profile-trust-link">
          Read Trust &amp; Safety →
        </Link>
      </SHCCard>

      <Link href="/orders" className="block mb-2">
        <SHCButton className="w-full">View My Orders</SHCButton>
      </Link>
      <Link href="/tiffin/subscriptions" className="block mb-2" data-testid="profile-subscriptions-link">
        <SHCButton variant="outline" className="w-full">
          My Subscriptions
        </SHCButton>
      </Link>
      <Link href="/search" className="block mb-4" data-testid="advanced-search-link">
        <SHCButton variant="outline" className="w-full">
          Advanced Search
        </SHCButton>
      </Link>

      {showNotifs && (
        <SHCCard className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-[18px] h-[18px]" aria-hidden />
            <p className="font-extrabold text-foreground">Notifications</p>
          </div>
          {notifs.length === 0 ? (
            <p className="text-sm text-muted-foreground font-semibold py-2">No events yet</p>
          ) : (
            <ul className="space-y-2">
              {(notifs as Array<{ id?: string; type?: string; body?: string; read?: boolean }>).map((n, i) => {
                const orderId = orderIdFromNotificationType(n.type);
                const row = (
                  <p className={`text-sm ${!n.read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                    {!n.read ? '● ' : ''}
                    {n.body}
                  </p>
                );
                return (
                  <li key={n.id || i}>
                    {orderId ? (
                      <Link href={`/orders/${orderId}`} data-testid={`notif-order-${orderId}`} className="hover:underline">
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SHCCard>
      )}

      <WebPushOptIn />

      <button
        type="button"
        className="w-full mt-6 py-3 rounded-xl border-2 border-[var(--shc-border-brutal)] bg-[#FEE2E2] text-[#B91C1C] font-extrabold text-sm shadow-[var(--shc-shadow-brutal-sm)] hover:opacity-95"
        data-testid="logout-btn"
        onClick={async () => {
          await logout();
          window.location.href = '/login';
        }}
      >
        Logout
      </button>
    </div>
  );
}
