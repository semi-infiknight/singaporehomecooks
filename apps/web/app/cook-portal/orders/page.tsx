'use client';

/**
 * Cook Orders — collection orders + Collaboration Board (recipe request bids).
 */
import { useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SHCOrderStatus } from '@shc/types';
import {
  getOrderStatusLabel,
  formatBidCentsAsDollars,
  isCookComplianceVerified,
  partitionCookOrders,
  parseCustomRequestDisplay,
  todayIsoInSingapore,
  monthLabelForDate,
  collectCookOrderDates,
  buildCookCalendarDays,
  filterCookOrdersByDate,
  emptyCookOrdersDayCopy,
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
  CookQuoteBuilderWeb,
  OrdersCalendarStrip,
} from '../../components/SHCWebComponents';

const NEXT_ACTIONS: Record<string, { to: SHCOrderStatus; label: string }[]> = {
  cart: [{ to: 'accepted', label: 'Accept' }, { to: 'cancelled', label: 'Decline' }],
  paid: [{ to: 'preparing', label: 'Start preparing' }],
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
  const [bidSuccess, setBidSuccess] = useState<Record<string, string>>({});
  const [bidError, setBidError] = useState('');
  const [biddingId, setBiddingId] = useState<string | null>(null);

  const todayRef = useRef(todayIsoInSingapore());
  const today = todayRef.current;
  const [selected, setSelected] = useState(today);

  const selectDay = useCallback((date: string) => {
    setSelected(date);
  }, []);

  const orderDates = useMemo(() => collectCookOrderDates(orderList), [orderList]);
  const calendarDays = useMemo(() => buildCookCalendarDays(today, orderDates), [today, orderDates]);
  const dayOrders = useMemo(
    () => filterCookOrdersByDate(orderList, selected, today),
    [orderList, selected, today]
  );
  const { needsAction: allNeedsAction, inProgress: allInProgress } = partitionCookOrders(orderList);
  const { needsAction, inProgress } = partitionCookOrders(dayOrders);
  const reqList = Array.isArray(openReqs) ? openReqs : [];
  const dayEmpty = needsAction.length === 0 && inProgress.length === 0;

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

  const handleQuote = async (
    reqId: string,
    payload: {
      line_items: Array<{ request_line_id: string; included: boolean; servings?: number; price_cents: number }>;
      message?: string;
      price_cents: number;
    }
  ) => {
    setBidError('');
    setBidSuccess((s) => {
      const next = { ...s };
      delete next[reqId];
      return next;
    });
    setBiddingId(reqId);
    try {
      await createBid.mutateAsync({
        requestId: reqId,
        priceCents: payload.price_cents,
        message: payload.message || 'Heritage HDB recipe interpretation ready.',
        lineItems: payload.line_items,
      });
      setBidSuccess((s) => ({
        ...s,
        [reqId]: `Quote sent · ${formatBidCentsAsDollars(payload.price_cents)}`,
      }));
    } catch (e) {
      setBidError((e as Error).message || 'Could not send quote. Check cook login and try again.');
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
        subtitle={[user?.name, monthLabelForDate(selected)].filter(Boolean).join(' · ')}
        badges={
          allNeedsAction.length > 0 ? (
            <span className="text-[11px] font-bold text-primary bg-secondary px-2.5 py-1 rounded-full">
              {allNeedsAction.length} need action
            </span>
          ) : allInProgress.length > 0 ? (
            <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {allInProgress.length} in progress
            </span>
          ) : undefined
        }
      />

      {!complianceOk && allNeedsAction.length > 0 && (
        <GourmeatCard className="mb-3 bg-amber-50 border-amber-200" data-testid="cook-compliance-gate-banner">
          <p className="text-sm font-bold">Upload SFA + WSQ and wait for ops verification before accepting orders.</p>
          <Link href="/cook-portal/compliance" className="inline-block mt-2 text-sm font-semibold text-primary">
            Go to Compliance →
          </Link>
        </GourmeatCard>
      )}

      <OrdersCalendarStrip
        days={calendarDays}
        selectedDate={selected}
        todayDate={today}
        onSelect={selectDay}
        testID="cook-orders-calendar-strip"
      />

      <h2 className="text-sm font-extrabold text-foreground mb-3" data-testid="cook-orders-selected-date">
        {selected === today ? 'Today' : selected}
      </h2>

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

      {dayEmpty && (
        <>
          {ordersLoading && orderList.length === 0 && (
            <div className="mb-4">
              <SHCSkeletonOrderList count={4} variant="row" />
            </div>
          )}
          {!ordersLoading && (
            <GourmeatCard className="mb-4" data-testid="cook-orders-day-empty">
              <GourmeatEmptyState
                title={emptyCookOrdersDayCopy({ isToday: selected === today }).title}
                body={emptyCookOrdersDayCopy({ isToday: selected === today }).body}
              />
            </GourmeatCard>
          )}
        </>
      )}

      <div className="flex items-center justify-between mt-8 mb-1" data-testid="cook-custom-requests-board">
        <p className="text-sm font-extrabold text-foreground">Custom requests</p>
        {reqList.length > 0 ? <SHCBadge variant="warning">{reqList.length} open</SHCBadge> : null}
      </div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        Customer dish requests. Send a quote in S$ — accepted quotes become collection orders.
      </p>
      {bidError ? (
        <p className="text-sm font-bold text-red-600 mb-2" data-testid="custom-request-quote-error">
          {bidError}
        </p>
      ) : null}
      <GourmeatCard className="mb-6 bg-[var(--shc-bento-peach)]" data-testid="cook-custom-requests-card">
        {reqList.length === 0 ? (
          <GourmeatEmptyState
            title="No open requests"
            body="Custom dish requests from customers show here for quoting."
          />
        ) : (
          reqList.map((r) => {
            const parsed = parseCustomRequestDisplay(r as Record<string, unknown>);
            return (
              <div
                key={r.id}
                className="bg-card rounded-xl p-3 mb-3 last:mb-0 shadow-[var(--shc-shadow-soft)]"
                data-testid={`collab-req-${r.id}`}
              >
                <p className="font-bold text-sm line-clamp-2">{parsed.summary}</p>
                {parsed.lines.map((line) => (
                  <p key={line.id} className="text-xs text-muted-foreground font-semibold">
                    · {line.name} ({line.servings} servings)
                  </p>
                ))}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parsed.guest_count ? <SHCMetaBadge kind="party_size">{parsed.guest_count} guests</SHCMetaBadge> : null}
                  <SHCMetaBadge kind="price">
                    Budget S$
                    {r.budget_cents != null ? (Number(r.budget_cents) / 100).toFixed(0) : '—'}
                  </SHCMetaBadge>
                  {r.date ? <SHCMetaBadge kind="date">{r.date}</SHCMetaBadge> : null}
                </div>
                {bidSuccess[r.id] ? (
                  <p className="text-xs font-bold text-green-700 mt-2" data-testid={`bid-success-${r.id}`}>
                    {bidSuccess[r.id]}
                  </p>
                ) : (
                  <CookQuoteBuilderWeb
                    request={r as Record<string, unknown>}
                    busy={biddingId === r.id}
                    onSubmit={(payload) => handleQuote(r.id, payload)}
                    testID={`quote-builder-${r.id}`}
                  />
                )}
              </div>
            );
          })
        )}
      </GourmeatCard>
    </div>
  );
}
