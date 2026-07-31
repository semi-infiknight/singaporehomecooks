'use client';

/**
 * My Orders — HomelyEats day calendar + five status card variants.
 * One-time orders + tiffin meal instances by collection date.
 */
import React, { useMemo, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  toIsoDate,
  calendarRangeAround,
  oneOffOrderToDayCard,
  tiffinMealToDayCard,
  mergeDayOrderCards,
  cardsForDate,
  collectOrderDates,
  monthLabelForDate,
  primaryActionLabel,
  buildManageOrderQuery,
  emptyOrdersDayCopy,
  type DayOrderCard,
  CUSTOM_REQUEST_COPY,
} from '@shc/utils';
import { addDaysIso, weekStartMonday } from '@shc/business-rules';
import { useOrders, useMyRequests } from '../../lib/useOrder';
import { useAuth } from '../../lib/useAuth';
import { downloadCorporateInvoicesZip } from '../../lib/api-client';
import { downloadBlobInBrowser } from '../../lib/download-pdf';
import { useTiffinMealOrders, useTiffinSubscription, useSkipTiffinMeal } from '../../lib/useTiffin';
import {
  GourmeatScreenHeader,
  SHCEmptyState,
  SHCButton,
  SHCCard,
  IllustratedEmptyState,
  SHCSkeletonOrderList,
  SHCSkeletonOrdersDayScreen,
  OrdersCalendarStrip,
  TiffinOrderStatusCard,
  type TiffinOrderCardStatus,
} from '../components/SHCWebComponents';

export default function OrdersList() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  // Stable "today" for the session so calendar days don't thrash every render
  const todayRef = useRef(toIsoDate(new Date()));
  const today = todayRef.current;
  const from = addDaysIso(weekStartMonday(), -7);
  const to = addDaysIso(weekStartMonday(), 21);

  const { data: orders, isLoading, isFetching } = useOrders();
  const { data: myRequests = [] } = useMyRequests();
  const activeRequests = (myRequests as any[]).filter((r) => r.status === 'open' || r.status === 'bidding');
  const orderList = (orders as Record<string, unknown>[]) ?? [];
  const [corpZipBusy, setCorpZipBusy] = useState(false);
  const hasCorporatePaid = useMemo(
    () =>
      orderList.some((o) => {
        if (!o.is_corporate) return false;
        const st = String(o.shc_status || '');
        return ['paid', 'accepted', 'preparing', 'ready_for_collection', 'collected', 'completed'].includes(st);
      }),
    [orderList]
  );
  const { data: mealData, isLoading: mealsLoading } = useTiffinMealOrders(from, to);
  const { data: subData } = useTiffinSubscription();
  const skipMut = useSkipTiffinMeal();

  const kitchen = (subData as any)?.kitchen || (subData as any)?.subscription;
  const cookName =
    kitchen?.cook?.display_name || kitchen?.cook_name || kitchen?.display_name || 'Tiffin kitchen';
  const dishes = (kitchen?.dishes || []) as Array<{ id: string; name: string }>;

  const allCards: DayOrderCard[] = useMemo(() => {
    const oneOff = orderList.map((o) => oneOffOrderToDayCard(o, today));
    const meals = ((mealData as any)?.meals || []) as Record<string, unknown>[];
    const tiffin = meals.map((m) => {
      const pid = String(m.product_id || '');
      const dishName = dishes.find((d) => d.id === pid)?.name;
      return tiffinMealToDayCard(m, { cookName, dishName });
    });
    return mergeDayOrderCards(oneOff, tiffin);
  }, [orderList, mealData, cookName, dishes, today]);

  const dateSet = useMemo(() => collectOrderDates(allCards), [allCards]);

  const calendarDays = useMemo(() => {
    return calendarRangeAround(today, 3, 14).map((d) => ({
      ...d,
      hasOrder: dateSet.has(d.date),
    }));
  }, [today, dateSet]);

  const [selected, setSelected] = useState(today);

  const selectDay = useCallback((date: string) => {
    setSelected(date);
  }, []);

  // Always land on today when opening Orders (page mount / revisit)
  React.useEffect(() => {
    setSelected(today);
  }, [today]);

  const dayCards = useMemo(() => cardsForDate(allCards, selected), [allCards, selected]);

  const onManage = (card: DayOrderCard) => {
    if (card.managePath === 'pay' && card.hrefOrderId) {
      router.push(`/orders/${card.hrefOrderId}?pay=1`);
      return;
    }
    // HomelyEats: Manage opens upcoming-order screen (skip / add items / slot / notes)
    if (card.status === 'scheduled' || card.status === 'indeterminate') {
      router.push(`/orders/manage?${buildManageOrderQuery(card)}`);
      return;
    }
    if (card.managePath === 'tiffin') {
      router.push('/tiffin/manage');
      return;
    }
    if (card.hrefOrderId) router.push(`/orders/${card.hrefOrderId}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 shc-tab-bar-pad md:pb-10" data-testid="customer-orders-screen">
      <GourmeatScreenHeader
        title="My orders"
        subtitle={`${monthLabelForDate(selected)}${isFetching || mealsLoading ? ' · updating…' : ''}`}
      />

      {user && activeRequests.length > 0 ? (
        <section className="mb-6" data-testid="custom-requests-section">
          <p className="text-sm font-extrabold">{CUSTOM_REQUEST_COPY.customerSectionTitle}</p>
          <p className="text-xs text-muted-foreground font-semibold mb-3">{CUSTOM_REQUEST_COPY.customerSectionHint}</p>
          <ul className="space-y-2">
            {(activeRequests as any[]).map((req) => (
              <li key={req.id}>
                <Link
                  href={`/requests/${req.id}`}
                  className="block rounded-xl border-2 border-[var(--shc-border-brutal)] p-3 bg-card hover:bg-secondary/40"
                  data-testid={`custom-request-card-${req.id}`}
                >
                  <p className="font-bold text-sm line-clamp-2">{req.body || 'Custom request'}</p>
                  <p className="text-xs text-primary font-bold mt-2">View quotes →</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {user && hasCorporatePaid ? (
        <SHCCard className="mb-4 p-4">
          <p className="text-sm font-extrabold mb-1">Corporate invoices</p>
          <p className="text-xs font-semibold text-muted-foreground mb-3">
            Download paid corporate / group orders as a ZIP for finance.
          </p>
          <SHCButton
            variant="outline"
            disabled={corpZipBusy}
            testID="corporate-invoices-zip-btn"
            onClick={async () => {
              setCorpZipBusy(true);
              try {
                const blob = await downloadCorporateInvoicesZip({ from, to });
                downloadBlobInBrowser(blob, `shc-corporate-invoices-${from}_${to}.zip`);
              } catch (e) {
                alert((e as Error).message || 'Could not download corporate invoices.');
              } finally {
                setCorpZipBusy(false);
              }
            }}
          >
            {corpZipBusy ? 'Preparing ZIP…' : 'Download corporate invoices (ZIP)'}
          </SHCButton>
        </SHCCard>
      ) : null}

      {authLoading ? (
        <SHCSkeletonOrdersDayScreen />
      ) : !user ? (
        <SHCCard>
          <SHCEmptyState
            title="Sign in to see orders"
            description="Scheduled collections and tiffin meals appear here by day."
            action={
              <Link href="/login?next=/orders" className="text-sm font-bold text-primary">
                Sign in →
              </Link>
            }
          />
        </SHCCard>
      ) : (
        <>
          <OrdersCalendarStrip
            days={calendarDays}
            selectedDate={selected}
            todayDate={today}
            onSelect={selectDay}
            testID="orders-calendar-strip"
          />

          <h2 className="text-sm font-extrabold text-foreground mb-3" data-testid="orders-selected-date">
            {selected === today ? 'Today' : selected}
          </h2>

          {(isLoading || mealsLoading) && dayCards.length === 0 && (
            <SHCSkeletonOrderList count={3} variant="card" />
          )}

          {!isLoading && !mealsLoading && dayCards.length === 0 && (
            <div data-testid="orders-day-empty">
              <IllustratedEmptyState
                kind="no_orders"
                title={emptyOrdersDayCopy({ isToday: selected === today }).title}
                action={
                  <Link href="/" className="text-sm font-bold text-primary">
                    Browse kitchens →
                  </Link>
                }
              />
            </div>
          )}

          <div className="space-y-3">
            {dayCards.map((card) => {
              const action = primaryActionLabel(card);
              return (
                <div key={card.id} className="space-y-2">
                  <TiffinOrderStatusCard
                    cookName={card.cookName}
                    planTitle={card.planTitle}
                    status={card.status as TiffinOrderCardStatus}
                    timeslot={card.timeslot}
                    menuLines={card.menuLines}
                    customizable={card.customizable && card.status === 'scheduled'}
                    menuPending={card.menuPending}
                    onManage={() => onManage(card)}
                    manageLabel={action}
                    onSkip={
                      card.kind === 'tiffin' && card.status === 'scheduled'
                        ? () => skipMut.mutate({ collectionDate: card.collectionDate })
                        : undefined
                    }
                    testID={`orders-day-card-${card.id}`}
                  />
                  {card.kind === 'one_off' && card.hrefOrderId ? (
                    <Link
                      href={`/chat/${card.hrefOrderId}`}
                      className="block text-sm font-bold text-primary pl-1"
                      data-testid={`orders-chat-link-${card.id}`}
                    >
                      Chat with cook
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] font-semibold text-muted-foreground mt-6 leading-relaxed">
            Each card is one meal collection. Tiffin plans create meals ahead of time. Statuses:
            Upcoming · Scheduled · Collected · Skipped · Canceled by kitchen.
          </p>
        </>
      )}
    </div>
  );
}
