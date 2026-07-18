'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { accountMenuItemsSignedIn, accountMenuItemsGuest, orderIdFromNotificationType } from '@shc/utils';
import { useNotifications } from '../../lib/useOrder';
import {
  SHCCard,
  SHCButton,
  SHCSectionTitle,
  SHCPageHeader,
  AccountMenuList,
  SHCSkeletonAccountScreen,
} from '../components/SHCWebComponents';
import { WebPushOptIn } from '../components/WebPushOptIn';
import { useAuth } from '../../lib/useAuth';

export default function Profile() {
  const { user, logout, loading: authLoading } = useAuth();
  const { data: notifs = [], markRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);

  // Guest — wireframe Account: Sign Up / Log In (only after auth hydrate)
  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10" data-testid="customer-profile-screen">
        <SHCSkeletonAccountScreen />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10" data-testid="customer-profile-screen">
        <SHCPageHeader title="Account" subtitle="Sign in for orders and account tools" />
        <SHCCard className="mb-4" data-testid="guest-profile-gate">
          <p className="font-black text-foreground mb-2">You are exploring freely</p>
          <p className="text-sm font-semibold text-muted-foreground leading-relaxed mb-4">
            Discover kitchens and dishes on Home. Orders and account tools only appear after you sign in.
          </p>
          <Link href="/login" data-testid="guest-profile-signin">
            <SHCButton className="w-full">Sign Up / Log In</SHCButton>
          </Link>
        </SHCCard>
        <AccountMenuList items={accountMenuItemsGuest().filter((i) => i.id !== 'login')} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10" data-testid="customer-profile-screen">
      <div className="flex items-start justify-between mb-6">
        <SHCPageHeader title="Account" subtitle={`👋 ${user.name?.split(' ')[0] || 'there'}`} />
        <div className="relative mt-2">
          <button
            type="button"
            className="relative"
            aria-label="Notifications"
            onClick={() => {
              const next = !showNotifs;
              setShowNotifs(next);
              if (next && (notifs as Array<{ read?: boolean }>).some((n) => !n.read)) {
                markRead({ all: true });
              }
            }}
          >
            <Bell className="w-6 h-6 text-muted-foreground" aria-hidden />
            {notifs.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black bg-primary text-primary-foreground border-2 border-[var(--shc-border-brutal)] rounded-full px-1">
                {notifs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Wireframe Account menu */}
      <AccountMenuList items={accountMenuItemsSignedIn()} />

      {showNotifs && (
        <>
          <SHCSectionTitle>Notifications</SHCSectionTitle>
          <SHCCard>
            {notifs.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-3xl" aria-hidden>
                  🛎️
                </span>
                <p className="text-sm text-muted-foreground mt-2 font-semibold">All caught up</p>
              </div>
            ) : (
              <ul className="divide-y-2 divide-[var(--shc-border-brutal)]">
                {(notifs as Array<{ id?: string; type?: string; body?: string; created_at?: string; read?: boolean }>).map((n, i) => {
                  const orderId = orderIdFromNotificationType(n.type);
                  const inner = (
                    <>
                      <span aria-hidden>📬</span>
                      <span className="text-foreground font-medium flex-1">{n.body}</span>
                      {n.created_at && (
                        <span className="text-xs text-muted-foreground shrink-0">{n.created_at.slice(11, 16)}</span>
                      )}
                    </>
                  );
                  return (
                    <li key={n.id || i} className="py-3 text-sm flex items-start gap-2 first:pt-0 last:pb-0">
                      {orderId ? (
                        <Link href={`/orders/${orderId}`} className="flex items-start gap-2 flex-1 hover:underline">
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </SHCCard>
        </>
      )}

      <WebPushOptIn />

      <div className="mt-8">
        <SHCButton
          variant="outline"
          className="w-full"
          testID="logout-btn"
          onClick={async () => {
            await logout();
            window.location.href = '/login';
          }}
        >
          Log out
        </SHCButton>
      </div>
    </div>
  );
}
