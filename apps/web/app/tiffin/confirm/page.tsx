'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTiffinSubscription } from '../../../lib/useTiffin';
import { SHCButton, SHCCard, SHCPageHeader } from '../../components/SHCWebComponents';

function formatWeekLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00.000Z`);
  return d.toLocaleDateString('en-SG', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function TiffinConfirmPage() {
  const router = useRouter();
  const { data: subData, isLoading } = useTiffinSubscription();

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
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32" data-testid="tiffin-confirm-screen">
      <SHCPageHeader title="You're subscribed!" subtitle="Pick meals for your weekly plan next." />

      <SHCCard className="mb-4 bg-[var(--shc-bento-mint)]">
        <p className="font-black text-lg">Welcome to weekly tiffin</p>
        <p className="text-sm text-muted-foreground font-semibold mt-1">
          You can make changes until midnight before each collection day.
        </p>
      </SHCCard>

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
      </ul>

      <div className="fixed bottom-0 left-0 right-0 md:static p-4 md:p-0 bg-card/95 md:bg-transparent border-t md:border-0 border-[var(--shc-border-brutal)] pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="max-w-2xl mx-auto">
          <SHCButton
            className="w-full"
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
