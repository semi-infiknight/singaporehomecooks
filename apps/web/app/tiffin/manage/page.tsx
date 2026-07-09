'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useTiffinSubscription,
  useCancelTiffin,
  useSubscribeTiffin,
  TIFFIN_DAY_LABELS,
  tiffinWeeklySubtotal,
} from '../../../lib/useTiffin';
import { SHCButton, SHCCard, SHCPageHeader, SHCBadge } from '../../components/SHCWebComponents';

export default function TiffinManagePage() {
  const router = useRouter();
  const { data: subData, isLoading } = useTiffinSubscription();
  const cancelMut = useCancelTiffin();
  const subscribeMut = useSubscribeTiffin();

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;
  const dishes = kitchen?.dishes || [];
  const currentSlots = (subData as any)?.slots_current_week || [];
  const nextSlots = (subData as any)?.slots_next_week || [];

  useEffect(() => {
    if (!isLoading && !sub) router.replace('/tiffin');
  }, [isLoading, sub, router]);

  const handleCancel = async () => {
    if (!confirm('Cancel your tiffin subscription?')) return;
    await cancelMut.mutateAsync();
    router.replace('/tiffin');
  };

  if (isLoading || !sub) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Loading subscription…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28" data-testid="tiffin-manage-screen">
      <SHCPageHeader title="Manage tiffin" subtitle="Subscription settings" />

      <SHCCard className="mb-4">
        <p className="font-black text-lg">{kitchen?.cook?.display_name || 'Kitchen'}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <SHCBadge variant="heritage">{sub.meals_per_week} meals/wk</SHCBadge>
          <SHCBadge variant="default">
            S${tiffinWeeklySubtotal(sub.meals_per_week).toFixed(2)}/wk
          </SHCBadge>
        </div>
        <p className="text-xs text-muted-foreground font-semibold mt-2">
          Collection:{' '}
          {(kitchen?.collection_days || []).map((d: number) => TIFFIN_DAY_LABELS[d]).join(', ')}
        </p>

        <p className="text-sm font-bold mt-4 mb-2">Change meals per week</p>
        <div className="flex gap-2 mb-4">
          {(kitchen?.meals_per_week_options || [2, 3, 4]).map((n: number) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                if (sub.cook_id) subscribeMut.mutate({ cookId: sub.cook_id, mealsPerWeek: n as 2 | 3 | 4 });
              }}
              className={`flex-1 rounded-lg border-2 py-2 font-black ${
                n === sub.meals_per_week
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-[var(--shc-border-brutal)] bg-card'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <SHCButton size="sm" onClick={() => router.push('/tiffin/planner')} testID="tiffin-manage-planner-btn">
            Edit weekly plan
          </SHCButton>
          <SHCButton
            size="sm"
            variant="outline"
            onClick={() => router.push('/tiffin/planner?mode=next-week')}
          >
            Override next week
          </SHCButton>
          <SHCButton
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={cancelMut.isPending}
            testID="tiffin-cancel-btn"
          >
            {cancelMut.isPending ? 'Cancelling…' : 'Cancel plan'}
          </SHCButton>
        </div>
      </SHCCard>

      <p className="font-extrabold text-sm mb-2">This week</p>
      {currentSlots.length === 0 ? (
        <SHCCard className="mb-4">
          <p className="text-sm text-muted-foreground font-semibold">No meals planned yet.</p>
          <SHCButton size="sm" className="mt-2" onClick={() => router.push('/tiffin/planner')}>
            Pick meals
          </SHCButton>
        </SHCCard>
      ) : (
        <ul className="space-y-2 mb-4">
          {currentSlots.map((slot: any) => {
            const dish = dishes.find((d: any) => d.id === slot.product_id);
            if (!dish) return null;
            return (
              <li
                key={slot.day_of_week}
                className="flex items-center justify-between rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2"
              >
                <div>
                  <p className="text-xs font-bold text-primary">{TIFFIN_DAY_LABELS[slot.day_of_week]}</p>
                  <p className="font-bold text-sm">{dish.name}</p>
                </div>
                <SHCButton size="sm" variant="ghost" onClick={() => router.push('/tiffin/planner')}>
                  Edit
                </SHCButton>
              </li>
            );
          })}
        </ul>
      )}

      {nextSlots.length > 0 ? (
        <>
          <p className="font-extrabold text-sm mb-2">Next week</p>
          <ul className="space-y-2">
            {nextSlots.map((slot: any) => {
              const dish = dishes.find((d: any) => d.id === slot.product_id);
              if (!dish) return null;
              return (
                <li
                  key={`next-${slot.day_of_week}`}
                  className="flex items-center justify-between rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-bold text-primary">{TIFFIN_DAY_LABELS[slot.day_of_week]}</p>
                    <p className="font-bold text-sm">{dish.name}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
