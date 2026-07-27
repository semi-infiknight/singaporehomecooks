'use client';

/**
 * Cook Orders — collection orders + Collaboration Board (recipe request bids).
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SHCOrderStatus } from '@shc/types';
import {
  getOrderStatusLabel,
  parseBidDollarsToCents,
  formatBidCentsAsDollars,
  isCookComplianceVerified,
  partitionCookOrders,
  shcPartySizeBadgeLabel,
} from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import {
  useCookOrders,
  useCookTransitionOrder,
  useOpenRequests,
  useCreateBid,
  useComplianceDocs,
} from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatOrderRow,
  GourmeatPrimaryButton,
  GourmeatActionRow,
  GourmeatCard,
  GourmeatEmptyState,
  SHCBadge,
  SHCMetaBadge,
  SHCSkeletonOrderList,
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
  const { data: orders, isLoading: ordersLoading } = useCookOrders();
  const orderList = (orders as any[]) ?? [];
  const { data: openReqs = [] } = useOpenRequests();
  const { data: complianceDocs = [] } = useComplianceDocs();
  const complianceOk = isCookComplianceVerified(complianceDocs as any[]);
  const createBid = useCreateBid();
  const transMut = useCookTransitionOrder();
  const [bidPrices, setBidPrices] = useState<Record<string, string>>({});
  const [bidMessages, setBidMessages] = useState<Record<string, string>>({});
  const [bidSuccess, setBidSuccess] = useState<Record<string, string>>({});
  const [bidError, setBidError] = useState('');
  const [biddingId, setBiddingId] = useState<string | null>(null);

  const { needsAction, inProgress } = partitionCookOrders(orderList);
  const reqList = Array.isArray(openReqs) ? openReqs : [];

  const doTransition = async (orderId: string, to: SHCOrderStatus) => {
    if (to === 'accepted' && !complianceOk) {
      alert('SFA and WSQ must be verified before you can accept orders. Upload certificates in Compliance.');
      return;
    }
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

  const renderOrderRow = (o: Record<string, unknown>) => {
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
          <GourmeatActionRow testID={`cook-order-actions-${o.id}`}>
            {actions.map((a) => (
              <GourmeatPrimaryButton
                key={a.to}
                label={a.label}
                size="sm"
                testID={`cook-order-${o.id}-action-${a.to}`}
                disabled={a.to === 'accepted' && !complianceOk}
                onClick={() => doTransition(String(o.id), a.to)}
              />
            ))}
            <GourmeatPrimaryButton
              label="Chat"
              size="sm"
              variant="outline"
              testID={`cook-order-${o.id}-chat`}
              onClick={() => router.push(`/cook-portal/orders/${o.id}#cook-order-chat`)}
            />
            <GourmeatPrimaryButton
              label="Details"
              size="sm"
              variant="outline"
              testID={`cook-order-${o.id}-details`}
              onClick={() => router.push(`/cook-portal/orders/${o.id}`)}
            />
          </GourmeatActionRow>
        }
      />
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-orders-screen">
      <GourmeatCookHeader
        title="Orders"
        subtitle={user?.name}
        badges={
          needsAction.length > 0 ? (
            <span className="text-[11px] font-bold text-primary bg-secondary px-2.5 py-1 rounded-full">
              {needsAction.length} need action
            </span>
          ) : inProgress.length > 0 ? (
            <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {inProgress.length} in progress
            </span>
          ) : undefined
        }
      />

      {!complianceOk && needsAction.length > 0 && (
        <GourmeatCard className="mb-3 bg-amber-50 border-amber-200" data-testid="cook-compliance-gate-banner">
          <p className="text-sm font-bold">Upload SFA + WSQ and wait for ops verification before accepting orders.</p>
          <Link href="/cook-portal/compliance" className="inline-block mt-2 text-sm font-semibold text-primary">
            Go to Compliance →
          </Link>
        </GourmeatCard>
      )}

      {needsAction.length > 0 && (
        <>
          <p className="text-sm font-extrabold text-foreground mb-2" data-testid="cook-orders-needs-action">
            Needs action
          </p>
          {needsAction.map(renderOrderRow)}
        </>
      )}

      {inProgress.length > 0 && (
        <>
          <p className="text-sm font-extrabold text-foreground mb-2 mt-4" data-testid="cook-orders-in-progress">
            In progress
          </p>
          {inProgress.map(renderOrderRow)}
        </>
      )}

      {needsAction.length === 0 && inProgress.length === 0 && (
        <>
          <p className="text-sm font-extrabold text-foreground mb-2">Collection orders</p>
          {ordersLoading && orderList.length === 0 && (
            <div className="mb-4">
              <SHCSkeletonOrderList count={4} variant="row" />
            </div>
          )}
          {!ordersLoading && orderList.length === 0 && (
            <GourmeatCard className="mb-4">
              <GourmeatEmptyState title="No orders yet" body="New collection orders will appear here." />
            </GourmeatCard>
          )}
        </>
      )}

      <div className="flex items-center justify-between mt-8 mb-1" data-testid="cook-collab-board">
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
                  <SHCMetaBadge kind="party_size">{shcPartySizeBadgeLabel(r.party_size || '?')}</SHCMetaBadge>
                  <SHCMetaBadge kind="price">
                    Budget S$
                    {r.budget_cents != null ? (Number(r.budget_cents) / 100).toFixed(0) : '—'}
                  </SHCMetaBadge>
                  {r.date ? <SHCMetaBadge kind="date">{r.date}</SHCMetaBadge> : null}
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
    </div>
  );
}
