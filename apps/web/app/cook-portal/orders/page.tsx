'use client';

/**
 * Cook Orders — collection orders + Collaboration Board (recipe request bids).
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SHCOrderStatus } from '@shc/types';
import { getOrderStatusLabel, parseBidDollarsToCents, formatBidCentsAsDollars } from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import {
  useCookOrders,
  useCookTransitionOrder,
  useOpenRequests,
  useCreateBid,
} from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatOrderRow,
  GourmeatPrimaryButton,
  GourmeatCard,
  GourmeatEmptyState,
  SHCBadge,
} from '../../components/SHCWebComponents';

const NEXT_ACTIONS: Record<string, { to: SHCOrderStatus; label: string }[]> = {
  paid: [{ to: 'accepted', label: 'Accept' }],
  accepted: [{ to: 'preparing', label: 'Prepare' }],
  preparing: [{ to: 'ready_for_collection', label: 'Ready' }],
  ready_for_collection: [{ to: 'collected', label: 'Collected' }],
};

export default function CookOrdersPage() {
  const router = useRouter();
  const { user } = useCookAuth();
  const { data: orders = [] } = useCookOrders();
  const { data: openReqs = [] } = useOpenRequests();
  const createBid = useCreateBid();
  const transMut = useCookTransitionOrder();
  const [bidPrices, setBidPrices] = useState<Record<string, string>>({});
  const [bidMessages, setBidMessages] = useState<Record<string, string>>({});
  const [bidSuccess, setBidSuccess] = useState<Record<string, string>>({});
  const [bidError, setBidError] = useState('');
  const [biddingId, setBiddingId] = useState<string | null>(null);

  const pendingCount = orders.filter(
    (o: { shc_status?: string }) => !['collected', 'completed'].includes(String(o.shc_status))
  ).length;

  const reqList = Array.isArray(openReqs) ? openReqs : [];

  const doTransition = async (orderId: string, to: SHCOrderStatus) => {
    try {
      await transMut.mutateAsync({ orderId, to });
    } catch (e) {
      alert((e as Error).message || 'Transition failed');
    }
  };

  const handleBid = async (reqId: string) => {
    setBidError('');
    setBidSuccess((s) => {
      const next = { ...s };
      delete next[reqId];
      return next;
    });
    const parsed = parseBidDollarsToCents(bidPrices[reqId]);
    if (!parsed.ok) {
      setBidError(parsed.message);
      return;
    }
    setBiddingId(reqId);
    try {
      await createBid.mutateAsync({
        requestId: reqId,
        priceCents: parsed.cents,
        message:
          bidMessages[reqId]?.trim() ||
          'Heritage HDB recipe interpretation ready. Flexible for your party size.',
      });
      setBidSuccess((s) => ({
        ...s,
        [reqId]: `Bid sent · ${formatBidCentsAsDollars(parsed.cents)}`,
      }));
      setBidPrices((p) => ({ ...p, [reqId]: '' }));
    } catch (e) {
      setBidError((e as Error).message || 'Could not place bid. Check cook login and try again.');
    } finally {
      setBiddingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-orders-screen">
      <GourmeatCookHeader
        title="Orders"
        subtitle={user?.name}
        badges={
          pendingCount > 0 ? (
            <span className="text-[11px] font-bold text-primary bg-secondary px-2.5 py-1 rounded-full">
              {pendingCount} active
            </span>
          ) : undefined
        }
      />

      <div className="flex items-center justify-between mb-1" data-testid="cook-collab-board">
        <p className="text-sm font-extrabold text-foreground">Collaboration Board</p>
        {reqList.length > 0 ? <SHCBadge variant="warning">{reqList.length} open</SHCBadge> : null}
      </div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        Customer recipe requests. Enter bid in S$ (e.g. 14). Accepted bids become collection orders.
      </p>
      {bidError ? (
        <p className="text-sm font-bold text-red-600 mb-2" data-testid="collab-bid-error">
          {bidError}
        </p>
      ) : null}
      <GourmeatCard className="mb-6 bg-[var(--shc-bento-peach)]" data-testid="cook-collab-card">
        {reqList.length === 0 ? (
          <GourmeatEmptyState
            title="No open requests"
            body="Custom dish requests from customers show here for bidding."
          />
        ) : (
          reqList.map(
            (r: {
              id: string;
              body?: string;
              party_size?: number;
              budget_cents?: number;
              date?: string;
            }) => (
              <div
                key={r.id}
                className="bg-card rounded-xl p-3 mb-3 last:mb-0 shadow-[var(--shc-shadow-soft)]"
                data-testid={`collab-req-${r.id}`}
              >
                <p className="font-bold text-sm line-clamp-3">{r.body || 'Custom request'}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <SHCBadge variant="heritage">{r.party_size || '?'} guests</SHCBadge>
                  <SHCBadge variant="default">
                    Budget S$
                    {r.budget_cents != null ? (Number(r.budget_cents) / 100).toFixed(0) : '—'}
                  </SHCBadge>
                  {r.date ? <SHCBadge variant="default">{r.date}</SHCBadge> : null}
                </div>
                <input
                  className="w-full mt-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold"
                  placeholder="Your bid in S$ (e.g. 14)"
                  value={bidPrices[r.id] || ''}
                  onChange={(e) => setBidPrices((p) => ({ ...p, [r.id]: e.target.value }))}
                  data-testid={`bid-price-${r.id}`}
                  inputMode="decimal"
                />
                <input
                  className="w-full mt-2 rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Message (optional)"
                  value={bidMessages[r.id] || ''}
                  onChange={(e) => setBidMessages((p) => ({ ...p, [r.id]: e.target.value }))}
                  data-testid={`bid-msg-${r.id}`}
                />
                {bidSuccess[r.id] ? (
                  <p className="text-xs font-bold text-green-700 mt-2" data-testid={`bid-success-${r.id}`}>
                    {bidSuccess[r.id]}
                  </p>
                ) : null}
                <GourmeatPrimaryButton
                  label={biddingId === r.id ? 'Sending…' : 'Place bid'}
                  className="mt-2"
                  onClick={() => handleBid(r.id)}
                  disabled={biddingId === r.id}
                  testID={`bid-btn-${r.id}`}
                />
              </div>
            )
          )
        )}
      </GourmeatCard>

      <p className="text-sm font-extrabold text-foreground mb-2">Collection orders</p>

      {orders.length === 0 && (
        <GourmeatCard>
          <GourmeatEmptyState title="No orders yet" body="New collection orders will appear here." />
        </GourmeatCard>
      )}

      {orders.map((o: Record<string, unknown>) => {
        const status = String(o.shc_status || '');
        const actions = NEXT_ACTIONS[status] || [];
        const dishName = String((o.items as { name?: string }[])?.[0]?.name || '');
        return (
          <GourmeatOrderRow
            key={String(o.id)}
            orderId={String(o.id)}
            dishName={dishName}
            productId={String((o.items as { product_id?: string }[])?.[0]?.product_id || '')}
            statusLabel={getOrderStatusLabel(status)}
            collectionDate={o.collection_date ? String(o.collection_date) : undefined}
            collectionSlot={o.collection_slot ? String(o.collection_slot) : undefined}
            total={o.total as number}
            onPress={() => router.push(`/cook-portal/orders/${o.id}`)}
            testID={`cook-order-row-${o.id}`}
            actions={
              <>
                {actions.map((a) => (
                  <GourmeatPrimaryButton
                    key={a.to}
                    label={a.label}
                    size="sm"
                    className="mr-2 mb-1"
                    testID={`cook-order-${o.id}-action-${a.to}`}
                    onClick={() => doTransition(String(o.id), a.to)}
                  />
                ))}
                <Link
                  href={`/cook-portal/orders/${o.id}`}
                  className="text-xs font-bold text-primary underline"
                >
                  Details
                </Link>
              </>
            }
          />
        );
      })}
    </div>
  );
}
