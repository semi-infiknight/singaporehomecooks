'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  cookDashboardTileImage,
  cookDashboardTiles,
  cookPortalGreeting,
  getOrderStatusLabel,
  orderIdFromNotificationType,
} from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { clearCookOnboardingSeen } from '../../../lib/onboarding';
import { useCookOrders, useOpenRequests, useCookNotifications } from '../../../lib/useCookPortal';
import { useCookConfig } from '../../../lib/useCookConfig';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatOrderRow,
  SHCBadge,
  VisualBentoTile,
  CookNotifBell,
} from '../../components/SHCWebComponents';

export default function CookDashboardPage() {
  const router = useRouter();
  const { user } = useCookAuth();
  const { config } = useCookConfig();
  const quickActions = cookDashboardTiles(config);
  const { data: orders = [] } = useCookOrders();
  const { data: openReqs = [] } = useOpenRequests();
  const { data: notifs = [], markRead } = useCookNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const greeting = cookPortalGreeting(new Date(), config.greeting);

  const earnings = orders
    .filter((o: { shc_status?: string }) => o.shc_status === 'completed')
    .reduce((s: number, o: { total?: number }) => s + Math.floor((o.total || 0) * 0.85), 0);

  const reqCount = Array.isArray(openReqs) ? openReqs.length : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-dashboard">
      <GourmeatCookHeader
        title={greeting}
        subtitle={`${user?.name || 'Chef'} · HDB kitchen`}
        testID="cook-dashboard-hero"
        action={
          <CookNotifBell
            notifications={notifs as Array<{ id?: string; body?: string; read?: boolean; type?: string }>}
            open={showNotifs}
            onToggle={() => {
              const next = !showNotifs;
              setShowNotifs(next);
              if (next && (notifs as any[]).some((n) => !n.read)) {
                markRead({ all: true });
              }
            }}
          />
        }
      />

      {showNotifs ? (
        <GourmeatCard className="mb-4" testID="cook-notifs-panel">
          <p className="font-black text-sm mb-2">Order alerts</p>
          {(notifs as any[]).length === 0 ? (
            <p className="text-xs font-semibold text-muted-foreground">
              No new alerts — paid orders will ping you here.
            </p>
          ) : (
            <ul className="space-y-2">
              {(notifs as any[]).map((n, i) => {
                const orderId = orderIdFromNotificationType(n.type);
                const row = (
                  <p className={`text-xs font-semibold ${!n.read ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {!n.read ? '● ' : ''}
                    {n.body}
                  </p>
                );
                return (
                  <li key={n.id || i}>
                    {orderId ? (
                      <button type="button" className="text-left w-full" onClick={() => router.push(`/cook-portal/orders/${orderId}`)}>
                        {row}
                      </button>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </GourmeatCard>
      ) : null}

      <Link
        href="/cook-portal/onboarding"
        onClick={() => clearCookOnboardingSeen()}
        data-testid="cook-kitchen-tour-link"
        className="block rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-peach)] p-4 mb-4 shadow-[var(--shc-shadow-brutal-sm)]"
      >
        <p className="font-black text-foreground">Kitchen setup tour</p>
        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
          Story · collection · PDPA — replay anytime
        </p>
      </Link>

      <Link
        href="/cook-portal/batches"
        data-testid="cook-batches-banner"
        className="block rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-mint)] p-4 mb-4 shadow-[var(--shc-shadow-brutal-sm)]"
      >
        <p className="font-black text-foreground">Cooking soon · post a batch</p>
        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
          Frying samosas tomorrow? Set qty + deadline — customers order from home
        </p>
      </Link>

      <Link
        href="/cook-portal/tiffin"
        data-testid="cook-tiffin-ops-banner"
        className="block rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-yellow)] p-4 mb-4 shadow-[var(--shc-shadow-brutal-sm)]"
      >
        <p className="font-black text-foreground">Tiffin kitchen OS</p>
        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
          Publish day menu · cancel kitchen day · subscriber visibility
        </p>
      </Link>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <GourmeatCard className="bg-[var(--shc-bento-mint)] text-center col-span-1">
          <p className="text-xs font-bold text-muted-foreground">This week</p>
          <p className="text-2xl font-black text-primary">S${earnings}</p>
        </GourmeatCard>
        <GourmeatCard className="bg-[var(--shc-bento-yellow)] text-center">
          <p className="text-xs font-bold text-muted-foreground">Active</p>
          <p className="text-2xl font-black">{orders.length}</p>
        </GourmeatCard>
        <GourmeatCard className="bg-[var(--shc-bento-peach)] text-center">
          <p className="text-xs font-bold text-muted-foreground">Requests</p>
          <p className="text-2xl font-black">{reqCount}</p>
        </GourmeatCard>
      </div>

      <p className="text-sm font-extrabold text-foreground mb-2">Quick actions</p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {quickActions.slice(0, 2).map((a) => (
          <VisualBentoTile
            key={a.id}
            imageUrl={cookDashboardTileImage(a)}
            label={a.label}
            href={a.web_href}
            variant={a.variant}
            badge={a.id === 'orders' && orders.length ? orders.length : undefined}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {quickActions.slice(2).map((a) => (
          <VisualBentoTile
            key={a.id}
            imageUrl={cookDashboardTileImage(a)}
            label={a.label}
            href={a.web_href}
            variant={a.variant}
          />
        ))}
      </div>

      <Link
        href="/cook-portal/orders"
        data-testid="collab-board-link"
        className="block rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-peach)] p-4 mb-6 shadow-[var(--shc-shadow-brutal-sm)]"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-black text-foreground">Collaboration Board</p>
          {reqCount > 0 ? <SHCBadge variant="warning">{reqCount} open</SHCBadge> : null}
        </div>
        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
          Recipe requests &amp; bids live under Orders — place bids in S$
        </p>
      </Link>

      <p className="text-sm font-extrabold text-foreground mb-2">Recent Orders</p>
      {orders.length === 0 ? (
        <GourmeatCard>
          <p className="text-sm text-muted-foreground text-center">No orders yet</p>
        </GourmeatCard>
      ) : (
        orders.slice(0, 4).map((o: Record<string, unknown>) => (
          <GourmeatOrderRow
            key={String(o.id)}
            orderId={String(o.id)}
            dishName={String((o.items as { name?: string }[])?.[0]?.name || '')}
            productId={String((o.items as { product_id?: string }[])?.[0]?.product_id || '')}
            statusLabel={getOrderStatusLabel(String(o.shc_status || ''))}
            collectionDate={o.collection_date ? String(o.collection_date) : undefined}
            collectionSlot={o.collection_slot ? String(o.collection_slot) : undefined}
            total={o.total as number}
            href={`/cook-portal/orders/${o.id}`}
          />
        ))
      )}

      <Link href="/" className="block text-center text-xs font-semibold text-primary mt-8">
        ← Customer app
      </Link>
    </div>
  );
}