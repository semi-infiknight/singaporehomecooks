'use client';

/**
 * Post-subscribe confirm — trust steps + pick meals CTA (Wave 4 funnel).
 */
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeConfirmSteps, subscribeTrustChips } from '@shc/utils';
import { useTiffinSubscription } from '../../../lib/useTiffin';
import {
  SHCButton,
  SHCCard,
  SHCPageHeader,
  SubscribeTrustList,
  SubscribeFunnelProgress,
  SHCSkeletonList,
} from '../../components/SHCWebComponents';

function formatWeekLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00.000Z`);
  return d.toLocaleDateString('en-SG', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function TiffinConfirmPage() {
  const router = useRouter();
  const { data: subData, isLoading } = useTiffinSubscription();

  const kitchen = (subData as any)?.kitchen;
  const cookName = kitchen?.cook?.display_name || 'your kitchen';
  const trustChips = subscribeTrustChips({
    area: kitchen?.cook?.area,
    cookName,
  });
  const steps = subscribeConfirmSteps();

  const weeks = useMemo(() => {
    const current = (subData as any)?.current_week;
    const next = (subData as any)?.next_week;
    const list = [current, next].filter(Boolean) as string[];
    if (current) {
      const d = new Date(`${current}T12:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() + 14);
      list.push(d.toISOString().slice(0, 10));
    }
    return list.map((w) => ({ week_start: w, label: formatWeekLabel(w) }));
  }, [subData]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <SHCSkeletonList count={4} rowHeight={72} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-36" data-testid="tiffin-confirm-screen">
      <SubscribeFunnelProgress current="pay" />

      <SHCPageHeader
        title="You're subscribed!"
        subtitle={`${cookName} · pick meals for your weekly plan next.`}
      />

      <SHCCard className="mb-4 bg-[var(--shc-bento-mint)]">
        <p className="font-black text-lg">Welcome to weekly tiffin</p>
        <p className="text-sm text-muted-foreground font-semibold mt-1">
          You can change meals until midnight before each collection day.
        </p>
      </SHCCard>

      <p className="font-extrabold text-sm mb-2">What happens next</p>
      <ul className="space-y-2 mb-5" data-testid="tiffin-confirm-steps">
        {steps.map((s) => (
          <li
            key={s.id}
            className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2.5"
          >
            <p className="font-extrabold text-sm">{s.title}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">{s.body}</p>
          </li>
        ))}
      </ul>

      <p className="font-extrabold text-sm mb-2">Your plan guarantees</p>
      <div className="mb-5">
        <SubscribeTrustList chips={trustChips} compact />
      </div>

      <p className="font-extrabold text-sm mb-2">Upcoming weeks</p>
      <ul className="space-y-2 mb-6">
        {weeks.map((w) => (
          <li
            key={w.week_start}
            className={`rounded-xl border-2 px-4 py-3 font-bold text-sm ${
              w.week_start === (subData as any)?.current_week
                ? 'border-primary bg-primary/10'
                : 'border-[var(--shc-border-brutal)] bg-card'
            }`}
          >
            Week of {w.label}
          </li>
        ))}
        {weeks.length === 0 ? (
          <li className="text-sm font-semibold text-muted-foreground">Calendar builds after you pick meals.</li>
        ) : null}
      </ul>

      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-card/95 border-t-2 border-[var(--shc-border-brutal)] pb-[max(env(safe-area-inset-bottom),8px)] md:static md:border-0 md:bg-transparent md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-3 mb-14 md:mb-0">
          <SHCButton
            className="w-full"
            size="lg"
            onClick={() => router.replace('/tiffin/planner')}
            testID="tiffin-pick-meals-btn"
          >
            Pick my meals
          </SHCButton>
        </div>
      </div>
    </div>
  );
}
