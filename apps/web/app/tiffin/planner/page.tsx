'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDishImageUrl } from '@shc/utils';
import Image from 'next/image';
import {
  useTiffinSubscription,
  useSaveTiffinPlan,
  useSaveTiffinNextWeek,
  TIFFIN_DAY_LABELS,
  type TiffinPlanSlot,
} from '../../../lib/useTiffin';
import { SHCButton, SHCPageHeader, SHCBadge } from '../../components/SHCWebComponents';

export default function TiffinPlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
          Loading planner…
        </div>
      }
    >
      <TiffinPlannerInner />
    </Suspense>
  );
}

function TiffinPlannerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNextWeek = searchParams.get('mode') === 'next-week';
  const { data: subData, isLoading } = useTiffinSubscription();
  const savePlan = useSaveTiffinPlan();
  const saveNextWeek = useSaveTiffinNextWeek();

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;
  const mealsPerWeek = sub?.meals_per_week || 3;
  const collectionDays: number[] = kitchen?.collection_days || [1, 2, 3, 4, 5];
  const defaultSlot = kitchen?.default_collection_slot || '18:00-19:00';

  const initialSlots: TiffinPlanSlot[] = useMemo(() => {
    const source = isNextWeek ? (subData as any)?.slots_next_week : (subData as any)?.slots_current_week;
    return (source || []).map((s: any) => ({
      day_of_week: s.day_of_week,
      product_id: s.product_id,
      collection_slot: s.collection_slot || defaultSlot,
    }));
  }, [subData, isNextWeek, defaultSlot]);

  const [slots, setSlots] = useState<TiffinPlanSlot[]>(initialSlots);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  useEffect(() => {
    setSlots(initialSlots);
  }, [JSON.stringify(initialSlots)]);

  useEffect(() => {
    if (!isLoading && !sub) router.replace('/tiffin');
  }, [isLoading, sub, router]);

  const dishes = ((kitchen?.dishes || []) as Array<{ id: string; name: string; price?: number; cuisine?: string }>);

  const handleSelectDay = (day: number) => {
    if (!collectionDays.includes(day)) return;
    if (slots.length >= mealsPerWeek && !slots.find((s) => s.day_of_week === day)) return;
    setEditingDay(day);
  };

  const handleSelectDish = (day: number, productId: string) => {
    setSlots((prev) => {
      const withoutDay = prev.filter((s) => s.day_of_week !== day);
      const next = [...withoutDay, { day_of_week: day, product_id: productId, collection_slot: defaultSlot }];
      if (next.length > mealsPerWeek) return next.slice(-mealsPerWeek);
      return next;
    });
    setEditingDay(null);
  };

  const handleSave = async () => {
    if (isNextWeek) await saveNextWeek.mutateAsync(slots);
    else await savePlan.mutateAsync({ slots, as_recurring_template: true });
    router.replace('/tiffin/manage');
  };

  if (isLoading || !sub) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Loading planner…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32" data-testid="tiffin-planner-screen">
      <SHCPageHeader
        title={isNextWeek ? 'Plan next week' : 'Your weekly menu'}
        subtitle={
          isNextWeek
            ? 'Override just the coming week — your usual plan resumes after.'
            : 'Pick your repeating weekly meals. Same cycle every week until you change it.'
        }
      />

      <p className="text-xs font-bold text-muted-foreground mb-3">
        {isNextWeek
          ? `Week of ${(subData as any)?.next_week || ''}`
          : `Week of ${(subData as any)?.current_week || ''}`}{' '}
        · pick {mealsPerWeek} day{mealsPerWeek === 1 ? '' : 's'}
      </p>

      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {TIFFIN_DAY_LABELS.map((label, day) => {
          const allowed = collectionDays.includes(day);
          const slot = slots.find((s) => s.day_of_week === day);
          const dish = dishes.find((d) => d.id === slot?.product_id);
          const selected = editingDay === day || Boolean(slot);
          return (
            <button
              key={day}
              type="button"
              disabled={!allowed}
              onClick={() => handleSelectDay(day)}
              data-testid={`tiffin-day-${day}`}
              className={`rounded-lg border-2 p-1.5 min-h-[72px] text-center ${
                !allowed
                  ? 'opacity-30 border-border bg-muted'
                  : selected
                    ? 'border-primary bg-primary/10'
                    : 'border-[var(--shc-border-brutal)] bg-card'
              }`}
            >
              <div className="text-[10px] font-black">{label}</div>
              <div className="text-[9px] font-semibold mt-1 line-clamp-2">
                {dish?.name || (allowed ? '—' : '')}
              </div>
            </button>
          );
        })}
      </div>

      {editingDay != null ? (
        <div className="mb-4 rounded-xl border-2 border-[var(--shc-border-brutal)] p-3 bg-card" data-testid="tiffin-dish-picker">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-sm">Pick dish for {TIFFIN_DAY_LABELS[editingDay]}</p>
            <button type="button" className="text-xs font-bold text-muted-foreground" onClick={() => setEditingDay(null)}>
              Close
            </button>
          </div>
          <ul className="space-y-2">
            {dishes.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className="w-full flex gap-3 items-center text-left rounded-lg border border-border p-2 hover:bg-muted/50"
                  onClick={() => handleSelectDish(editingDay, d.id)}
                  data-testid={`tiffin-pick-dish-${d.id}`}
                >
                  <Image
                    src={getDishImageUrl({ id: d.id, cuisine: d.cuisine, name: d.name })}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded-md object-cover"
                  />
                  <span className="font-bold text-sm flex-1">{d.name}</span>
                  {d.cuisine ? <SHCBadge variant="default">{d.cuisine}</SHCBadge> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-sm font-bold mb-2">
        Selected {slots.length}/{mealsPerWeek}
      </p>

      <div className="fixed bottom-0 left-0 right-0 md:static p-4 md:p-0 bg-card/95 md:bg-transparent border-t md:border-0 border-[var(--shc-border-brutal)] pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="max-w-2xl mx-auto">
          <SHCButton
            className="w-full"
            onClick={handleSave}
            disabled={slots.length !== mealsPerWeek || savePlan.isPending || saveNextWeek.isPending}
            testID={isNextWeek ? 'tiffin-save-next-week-btn' : 'tiffin-save-plan-btn'}
          >
            {savePlan.isPending || saveNextWeek.isPending
              ? 'Saving…'
              : isNextWeek
                ? 'Save next week'
                : 'Save weekly plan'}
          </SHCButton>
        </div>
      </div>
    </div>
  );
}
