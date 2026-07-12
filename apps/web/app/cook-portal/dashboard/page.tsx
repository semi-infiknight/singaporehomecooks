'use client';

import Link from 'next/link';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { clearCookOnboardingSeen } from '../../../lib/onboarding';
import { useCookOrders, useOpenRequests } from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatOrderRow,
  SHCBadge,
  VisualBentoTile,
} from '../../components/SHCWebComponents';
import { getOrderStatusLabel } from '@shc/utils';

const QUICK_ACTIONS = [
  { href: '/cook-portal/batches', label: 'Cooking soon', image: BENTO_ACTION_IMAGES.orders, variant: 'bento-mint' as const },
  { href: '/cook-portal/listings', label: 'Listings', image: BENTO_ACTION_IMAGES.listings, variant: 'bento-peach' as const },
  { href: '/cook-portal/orders', label: 'Orders', image: BENTO_ACTION_IMAGES.orders, variant: 'bento-mint' as const },
  { href: '/cook-portal/tiffin', label: 'Tiffin', image: BENTO_ACTION_IMAGES.checkout, variant: 'bento-yellow' as const },
  { href: '/cook-portal/earnings', label: 'Earnings', image: BENTO_ACTION_IMAGES.earnings, variant: 'bento-yellow' as const },
  { href: '/cook-portal/compliance', label: 'Compliance', image: BENTO_ACTION_IMAGES.compliance, variant: 'bento-peach' as const },
];

export default function CookDashboardPage() {
  const { user } = useCookAuth();
  const { data: orders = [] } = useCookOrders();
  const { data: openReqs = [] } = useOpenRequests();

  const earnings = orders
    .filter((o: { shc_status?: string }) => o.shc_status === 'completed')
    .reduce((s: number, o: { total?: number }) => s + Math.floor((o.total || 0) * 0.85), 0);

  const reqCount = Array.isArray(openReqs) ? openReqs.length : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-dashboard">
      <GourmeatCookHeader
        title="Good morning, Chef"
        subtitle={`${user?.name} · HDB kitchen · 85% payout`}
        testID="cook-dashboard-hero"
        badges={
          <>
            <SHCBadge variant="heritage">85% payout</SHCBadge>
            <SHCBadge variant="success">S${earnings} this week</SHCBadge>
          </>
        }
      />

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
        {QUICK_ACTIONS.slice(0, 2).map((a) => (
          <VisualBentoTile
            key={a.href}
            imageUrl={a.image}
            label={a.label}
            href={a.href}
            variant={a.variant}
            badge={a.label === 'Orders' && orders.length ? orders.length : undefined}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {QUICK_ACTIONS.slice(2).map((a) => (
          <VisualBentoTile key={a.href} imageUrl={a.image} label={a.label} href={a.href} variant={a.variant} />
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