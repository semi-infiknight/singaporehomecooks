'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDaysIso, weekStartMonday } from '@shc/business-rules';
import { emptyOrdersDayCopy } from '@shc/utils';
import { useTiffinMealOrders, useTiffinSubscription, useSkipTiffinMeal, TIFFIN_DAY_LABELS } from '../../../lib/useTiffin';
import {
  SHCButton,
  SHCCard,
  SHCPageHeader,
  SHCBadge,
  IllustratedEmptyState,
} from '../../components/SHCWebComponents';

export default function TiffinCalendarPage() {
  const router = useRouter();
  const from = weekStartMonday();
  const to = addDaysIso(from, 20);
  const { data: subData } = useTiffinSubscription();
  const { data: mealData, isLoading } = useTiffinMealOrders(from, to);
  const skipMut = useSkipTiffinMeal();

  const meals = ((mealData as any)?.meals || []) as Array<{
    collection_date: string;
    status: string;
    product_id: string;
    collection_slot?: string;
    customizable?: boolean;
  }>;
  const kitchen = (subData as any)?.kitchen;
  const dishes = kitchen?.dishes || [];
  const [selected, setSelected] = useState(meals[0]?.collection_date || from);

  const days = useMemo(() => {
    const out: string[] = [];
    let c = from;
    while (c <= to) {
      out.push(c);
      c = addDaysIso(c, 1);
    }
    return out;
  }, [from, to]);

  const dayMeals = meals.filter((m) => m.collection_date === selected);

  if (isLoading) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center font-semibold text-muted-foreground">Loading calendar…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 shc-safe-bottom-pad" data-testid="tiffin-calendar-screen">
      <SHCPageHeader title="My tiffin meals" subtitle="Calendar of collection days (HomelyEats My Orders)" />

      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4" data-testid="tiffin-calendar-strip">
        {days.map((date) => {
          const d = new Date(`${date}T12:00:00.000Z`);
          const active = date === selected;
          const hasMeal = meals.some((m) => m.collection_date === date);
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(date)}
              className={`min-w-[48px] rounded-xl border-2 py-2 px-1 text-center ${
                active ? 'border-primary bg-primary text-primary-foreground' : hasMeal ? 'border-primary bg-card' : 'border-[var(--shc-border-brutal)] bg-card'
              }`}
            >
              <div className="text-[10px] font-black">{TIFFIN_DAY_LABELS[d.getUTCDay()]}</div>
              <div className="text-sm font-black">{date.slice(8)}</div>
            </button>
          );
        })}
      </div>

      {dayMeals.length === 0 ? (
        <IllustratedEmptyState
          kind="no_orders"
          title={emptyOrdersDayCopy({ isToday: false }).title}
          description="Tiffin collection days appear when you save a weekly plan."
          action={
            <SHCButton size="sm" onClick={() => router.push('/tiffin/planner')}>
              Edit weekly plan
            </SHCButton>
          }
        />
      ) : (
        dayMeals.map((m) => {
          const dish = dishes.find((d: any) => d.id === m.product_id);
          return (
            <SHCCard key={m.collection_date + m.product_id} className="mb-3" data-testid={`tiffin-order-card-${m.status}`}>
              <div className="flex flex-wrap gap-2 mb-2">
                <SHCBadge variant={m.status === 'skipped' ? 'warning' : m.status === 'delivered' ? 'success' : 'default'}>
                  {m.status}
                </SHCBadge>
                {m.customizable ? <SHCBadge variant="peach">CUSTOMIZABLE</SHCBadge> : null}
                {m.collection_slot ? <span className="text-xs font-bold text-muted-foreground">{m.collection_slot}</span> : null}
              </div>
              <p className="font-black">{kitchen?.cook?.display_name || 'Kitchen'}</p>
              <p className="text-sm text-muted-foreground font-semibold">{dish?.name || m.product_id}</p>
              {m.status === 'scheduled' ? (
                <SHCButton
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  testID="tiffin-order-skip-btn"
                  disabled={skipMut.isPending}
                  onClick={() => skipMut.mutate({ collectionDate: m.collection_date, collectionSlot: m.collection_slot })}
                >
                  Skip day
                </SHCButton>
              ) : null}
            </SHCCard>
          );
        })
      )}

      <SHCButton size="sm" variant="outline" className="mt-4" onClick={() => router.push('/tiffin/manage')}>
        Back to manage
      </SHCButton>
    </div>
  );
}
