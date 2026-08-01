'use client';

/**
 * Cook Orders — collection orders calendar + day list.
 */
import { useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SHCOrderStatus } from '@shc/types';
import {
  getOrderStatusLabel,
  isCookComplianceVerified,
  partitionCookOrders,
  todayIsoInSingapore,
  monthLabelForDate,
  collectCookOrderDates,
  buildCookCalendarDays,
  filterCookOrdersByDate,
  emptyCookOrdersDayCopy,
} from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { useCookOrders, useCookTransitionOrder, useComplianceDocs } from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatOrderRow,
  GourmeatPrimaryButton,
  GourmeatActionRow,
  GourmeatCard,
  GourmeatEmptyState,
  SHCSkeletonOrderList,
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
  const { data: complianceDocs = [] } = useComplianceDocs();
  const complianceOk = isCookComplianceVerified(complianceDocs as any[]);
  const transMut = useCookTransitionOrder();

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
    </div>
  );
}
