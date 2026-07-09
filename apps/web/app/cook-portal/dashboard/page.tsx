'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import {
  useCookOrders,
  useOpenRequests,
  useCreateBid,
} from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatOrderRow,
  GourmeatPrimaryButton,
  SHCBadge,
  VisualBentoTile,
} from '../../components/SHCWebComponents';
import { getOrderStatusLabel } from '@shc/utils';

const QUICK_ACTIONS = [
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
  const createBid = useCreateBid();
  const [bidPrices, setBidPrices] = useState<Record<string, string>>({});
  const [collabMsg, setCollabMsg] = useState('');

  const earnings = orders
    .filter((o: { shc_status?: string }) => o.shc_status === 'completed')
    .reduce((s: number, o: { total?: number }) => s + Math.floor((o.total || 0) * 0.85), 0);

  const handleBid = async (reqId: string) => {
    const price = parseInt(bidPrices[reqId] || '1200', 10);
    await createBid.mutateAsync({
      requestId: reqId,
      priceCents: price,
      message: collabMsg || 'Heritage HDB recipe interpretation ready. Flexible for your party size.',
    });
    setCollabMsg('');
  };

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
          <p className="text-2xl font-black">{openReqs.length}</p>
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

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-extrabold text-foreground">Collaboration Board</p>
        {openReqs.length > 0 ? <SHCBadge variant="warning">{openReqs.length} open</SHCBadge> : null}
      </div>
      <GourmeatCard className="mb-6 bg-[var(--shc-bento-peach)]">
        {openReqs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No open requests</p>
        ) : (
          openReqs.map((r: { id: string; body?: string; party_size?: number; budget_cents?: number; date?: string }) => (
            <div key={r.id} className="bg-card rounded-xl p-3 mb-3 last:mb-0 shadow-[var(--shc-shadow-soft)]" data-testid={`collab-req-${r.id}`}>
              <p className="font-bold text-sm line-clamp-2">{r.body}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <SHCBadge variant="heritage">{r.party_size || '?'} guests</SHCBadge>
                <SHCBadge variant="default">
                  S${r.budget_cents ? (r.budget_cents / 100).toFixed(0) : '—'}
                </SHCBadge>
                {r.date ? <SHCBadge variant="default">{r.date}</SHCBadge> : null}
              </div>
              <input
                className="w-full mt-2 rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Bid S$ e.g. 14"
                value={bidPrices[r.id] || ''}
                onChange={(e) => setBidPrices((p) => ({ ...p, [r.id]: e.target.value }))}
              />
              <GourmeatPrimaryButton
                label="Bid"
                className="mt-2"
                onClick={() => handleBid(r.id)}
                testID={`bid-btn-${r.id}`}
              />
            </div>
          ))
        )}
      </GourmeatCard>

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