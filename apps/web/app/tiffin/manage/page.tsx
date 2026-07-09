'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useTiffinSubscription,
  useCancelTiffin,
  useSubscribeTiffin,
  usePauseTiffin,
  useResumeTiffin,
  TIFFIN_DAY_LABELS,
  tiffinWeeklySubtotal,
} from '../../../lib/useTiffin';
import { SHCButton, SHCCard, SHCPageHeader, SHCBadge } from '../../components/SHCWebComponents';

const CANCEL_REASONS = ['Moving away', 'Too expensive', 'Quality concerns', 'Trying another kitchen', 'Other'];

export default function TiffinManagePage() {
  const router = useRouter();
  const { data: subData, isLoading } = useTiffinSubscription();
  const cancelMut = useCancelTiffin();
  const subscribeMut = useSubscribeTiffin();
  const pauseMut = usePauseTiffin();
  const resumeMut = useResumeTiffin();
  const [showReasons, setShowReasons] = useState(false);

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;
  const dishes = kitchen?.dishes || [];
  const currentSlots = (subData as any)?.slots_current_week || [];

  useEffect(() => {
    if (!isLoading && !sub) router.replace('/tiffin');
  }, [isLoading, sub, router]);

  if (isLoading || !sub) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Loading subscription…
      </div>
    );
  }

  const isPaused = sub.status === 'paused';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28" data-testid="tiffin-manage-screen">
      <SHCPageHeader title="Manage tiffin" subtitle="Subscription settings · HomelyEats manage IA" />

      <SHCCard className="mb-4">
        <p className="font-black text-lg">{kitchen?.cook?.display_name || 'Kitchen'}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <SHCBadge variant="heritage">{sub.meals_per_week} meals/wk</SHCBadge>
          <SHCBadge variant="default">S${tiffinWeeklySubtotal(sub.meals_per_week).toFixed(2)}/wk</SHCBadge>
          <SHCBadge variant={isPaused ? 'warning' : 'success'}>{sub.status}</SHCBadge>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 text-center" data-testid="tiffin-plan-metrics">
          <div>
            <p className="font-black text-primary">{sub.deliveries_left ?? '—'}</p>
            <p className="text-[10px] font-bold text-muted-foreground">Deliveries left</p>
          </div>
          <div>
            <p className="font-black text-primary">
              {sub.flex_remaining ?? '—'}/{sub.flex_quota ?? '—'}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">Flex days</p>
          </div>
          <div>
            <p className="font-black text-primary">{sub.expires_on?.slice(5) ?? '—'}</p>
            <p className="text-[10px] font-bold text-muted-foreground">Expires</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-4">
          {isPaused ? (
            <SHCButton size="sm" onClick={() => resumeMut.mutate()} disabled={resumeMut.isPending} testID="tiffin-resume-btn">
              Resume
            </SHCButton>
          ) : (
            <SHCButton size="sm" variant="outline" onClick={() => pauseMut.mutate(1)} disabled={pauseMut.isPending} testID="tiffin-pause-btn">
              Pause 1 flex day
            </SHCButton>
          )}
          <SHCButton size="sm" onClick={() => router.push('/tiffin/planner')} testID="tiffin-manage-planner-btn">
            Edit weekly plan
          </SHCButton>
          <Link href="/tiffin/calendar">
            <SHCButton size="sm" variant="outline" testID="tiffin-open-calendar-btn">
              Meal calendar
            </SHCButton>
          </Link>
        </div>

        <p className="text-sm font-bold mt-4 mb-2">Meals per week</p>
        <div className="flex gap-2 mb-2">
          {(kitchen?.meals_per_week_options || [2, 3, 4]).map((n: number) => (
            <button
              key={n}
              type="button"
              onClick={() => sub.cook_id && subscribeMut.mutate({ cookId: sub.cook_id, mealsPerWeek: n as 2 | 3 | 4 })}
              className={`flex-1 rounded-lg border-2 py-2 font-black ${
                n === sub.meals_per_week ? 'border-primary bg-primary text-primary-foreground' : 'border-[var(--shc-border-brutal)] bg-card'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </SHCCard>

      <p className="font-extrabold text-sm mb-2">This week</p>
      <ul className="space-y-2 mb-4">
        {currentSlots.map((slot: any) => {
          const dish = dishes.find((d: any) => d.id === slot.product_id);
          if (!dish) return null;
          return (
            <li key={slot.day_of_week} className="flex justify-between rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2">
              <div>
                <p className="text-xs font-bold text-primary">{TIFFIN_DAY_LABELS[slot.day_of_week]}</p>
                <p className="font-bold text-sm">{dish.name}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {!showReasons ? (
        <SHCButton size="sm" variant="outline" onClick={() => setShowReasons(true)} testID="tiffin-cancel-btn">
          Cancel subscription
        </SHCButton>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Why cancel?</p>
          {CANCEL_REASONS.map((r) => (
            <SHCButton
              key={r}
              size="sm"
              variant="outline"
              className="w-full"
              disabled={cancelMut.isPending}
              onClick={async () => {
                await cancelMut.mutateAsync(r);
                router.replace('/tiffin');
              }}
            >
              {r}
            </SHCButton>
          ))}
        </div>
      )}
    </div>
  );
}
