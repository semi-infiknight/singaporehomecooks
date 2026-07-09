'use client';

/**
 * My Orders — HomelyEats day calendar + five status card variants.
 * One-time orders + tiffin meal instances by collection date.
 */
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
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
  dayOrderStatusChip,
  primaryActionLabel,
  buildManageOrderQuery,
  emptyOrdersDayCopy,
  type DayOrderCard,
} from '@shc/utils';
import { addDaysIso, weekStartMonday } from '@shc/business-rules';
import { useOrders } from '../../lib/useOrder';
import { useAuth } from '../../lib/useAuth';
import { useTiffinMealOrders, useTiffinSubscription, useSkipTiffinMeal } from '../../lib/useTiffin';
import {
  GourmeatScreenHeader,
  SHCEmptyState,
  SHCButton,
  SHCCard,
  IllustratedEmptyState,
} from '../components/SHCWebComponents';

export default function OrdersList() {
  const router = useRouter();
  const { user } = useAuth();
  // Stable "today" for the session so calendar days don't thrash every render
  const todayRef = useRef(toIsoDate(new Date()));
  const today = todayRef.current;
  const from = addDaysIso(weekStartMonday(), -7);
  const to = addDaysIso(weekStartMonday(), 21);

  const { data: orders = [], isLoading, isFetching } = useOrders();
  const { data: mealData, isLoading: mealsLoading } = useTiffinMealOrders(from, to);
  const { data: subData } = useTiffinSubscription();
  const skipMut = useSkipTiffinMeal();

  const kitchen = (subData as any)?.kitchen || (subData as any)?.subscription;
  const cookName =
    kitchen?.cook?.display_name || kitchen?.cook_name || kitchen?.display_name || 'Tiffin kitchen';
  const dishes = (kitchen?.dishes || []) as Array<{ id: string; name: string }>;

  const allCards: DayOrderCard[] = useMemo(() => {
    const oneOff = (orders as Record<string, unknown>[]).map((o) => oneOffOrderToDayCard(o, today));
    const meals = ((mealData as any)?.meals || []) as Record<string, unknown>[];
    const tiffin = meals.map((m) => {
      const pid = String(m.product_id || '');
      const dishName = dishes.find((d) => d.id === pid)?.name;
      return tiffinMealToDayCard(m, { cookName, dishName });
    });
    return mergeDayOrderCards(oneOff, tiffin);
  }, [orders, mealData, cookName, dishes, today]);

  const dateSet = useMemo(() => collectOrderDates(allCards), [allCards]);

  const calendarDays = useMemo(() => {
    return calendarRangeAround(today, 3, 14).map((d) => ({
      ...d,
      hasOrder: dateSet.has(d.date),
    }));
  }, [today, dateSet]);

  const [selected, setSelected] = useState(today);
  /** Once the user taps a day, never auto-reset selection on data refetch. */
  const userPickedRef = useRef(false);
  const didInitSelectRef = useRef(false);

  const selectDay = useCallback((date: string) => {
    userPickedRef.current = true;
    setSelected(date);
  }, []);

  // Initial auto-select only (today if has meals, else first day with meals) — do not fight user taps
  useEffect(() => {
    if (userPickedRef.current || didInitSelectRef.current) return;
    if (isLoading || mealsLoading) return;
    didInitSelectRef.current = true;
    if (dateSet.has(today)) {
      setSelected(today);
      return;
    }
    const next = calendarDays.find((d) => d.hasOrder);
    if (next) setSelected(next.date);
  }, [dateSet, today, calendarDays, isLoading, mealsLoading]);

  const dayCards = useMemo(() => cardsForDate(allCards, selected), [allCards, selected]);

  const onManage = (card: DayOrderCard) => {
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-10" data-testid="customer-orders-screen">
      <GourmeatScreenHeader
        title="My orders"
        subtitle={`${monthLabelForDate(selected)}${isFetching || mealsLoading ? ' · updating…' : ''}`}
      />

      {!user ? (
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
          {/* Horizontal calendar */}
          <div
            className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide"
            data-testid="orders-calendar-strip"
          >
            {calendarDays.map((d) => {
              const active = d.date === selected;
              return (
                <button
                  key={d.date}
                  type="button"
                  data-testid={`orders-cal-day-${d.date}`}
                  onClick={() => selectDay(d.date)}
                  className={`shrink-0 w-12 min-w-[3rem] rounded-xl border-2 py-2 text-center cursor-pointer touch-manipulation relative z-10 ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : d.hasOrder
                        ? 'border-primary/40 bg-card hover:border-primary'
                        : 'border-[var(--shc-border-brutal)] bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="text-[10px] font-bold opacity-80">{d.label}</div>
                  <div className="text-base font-black tabular-nums">{d.dayNum}</div>
                  {d.hasOrder ? <div className="w-1 h-1 rounded-full bg-current mx-auto mt-1" /> : null}
                </button>
              );
            })}
          </div>

          <h2 className="text-sm font-extrabold text-foreground mb-3" data-testid="orders-selected-date">
            {selected === today ? 'Today' : selected}
          </h2>

          {(isLoading || mealsLoading) && dayCards.length === 0 && (
            <p className="text-sm font-semibold text-muted-foreground py-6">Loading meals…</p>
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
              const chip = dayOrderStatusChip(card.status);
              const action = primaryActionLabel(card);
              return (
                <div
                  key={card.id}
                  className="rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card p-4 shadow-[var(--shc-shadow-brutal-sm)]"
                  data-testid={`orders-day-card-${card.id}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-[11px] font-extrabold px-2 py-1 rounded-md"
                      style={{ background: chip.bg, color: chip.color }}
                    >
                      {chip.label}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground tabular-nums">
                      {card.timeslot}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-black text-foreground truncate">{card.cookName}</p>
                      <p className="text-sm font-semibold text-muted-foreground">{card.planTitle}</p>
                    </div>
                    {card.customizable && card.status === 'scheduled' ? (
                      <span
                        className="shrink-0 text-[10px] font-black text-primary uppercase tracking-wide"
                        data-testid="orders-customizable-tag"
                      >
                        Customizable
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 rounded-xl bg-secondary/60 border border-[var(--shc-border-brutal)]/40 p-3">
                    <p className="text-[11px] font-extrabold text-muted-foreground mb-1">
                      Today&apos;s menu
                    </p>
                    {card.menuPending ? (
                      <p className="text-sm font-semibold text-muted-foreground italic">
                        Menu yet to be updated
                      </p>
                    ) : (
                      <ul className="space-y-0.5">
                        {card.menuLines.map((line) => (
                          <li key={line} className="text-sm font-semibold">
                            · {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <SHCButton size="sm" variant="outline" onClick={() => onManage(card)}>
                      {action}
                    </SHCButton>
                    {card.kind === 'tiffin' && card.status === 'scheduled' && (
                      <SHCButton
                        size="sm"
                        variant="outline"
                        testID={`orders-skip-${card.id}`}
                        onClick={() =>
                          skipMut.mutate({ collectionDate: card.collectionDate })
                        }
                        disabled={skipMut.isPending}
                      >
                        Skip day
                      </SHCButton>
                    )}
                    {card.kind === 'one_off' && card.hrefOrderId && (
                      <Link
                        href={`/orders/${card.hrefOrderId}`}
                        className="text-xs font-bold text-primary self-center ml-auto"
                      >
                        Details →
                      </Link>
                    )}
                  </div>
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
