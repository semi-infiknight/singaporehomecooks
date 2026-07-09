'use client';

/**
 * HomelyEats Recharge plan — extend period before expiry.
 */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  rechargeWeekOptions,
  applyRecharge,
  defaultFlexQuota,
} from '@shc/business-rules';
import { tiffinWeeklySubtotal, useTiffinSubscription, useRechargeTiffin } from '../../../lib/useTiffin';
import { SHCButton, SHCCard, SHCPageHeader, SHCErrorBanner } from '../../components/SHCWebComponents';

export default function TiffinRechargePage() {
  const router = useRouter();
  const { data: subData, isLoading } = useTiffinSubscription();
  const rechargeMut = useRechargeTiffin();
  const [weeks, setWeeks] = useState(4);
  const [error, setError] = useState('');

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Loading…
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <SHCPageHeader title="Recharge plan" subtitle="No active subscription" />
        <SHCButton onClick={() => router.push('/tiffin')}>Browse kitchens</SHCButton>
      </div>
    );
  }

  const preview = applyRecharge({
    mealsPerWeek: sub.meals_per_week,
    weeks,
    flexQuota: sub.flex_quota ?? defaultFlexQuota(sub.meals_per_week),
    flexRemaining: sub.flex_remaining ?? 0,
    deliveriesLeft: sub.deliveries_left ?? 0,
    expiresOn: sub.expires_on,
  });
  const estimate = tiffinWeeklySubtotal(sub.meals_per_week) * weeks;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-28" data-testid="tiffin-recharge-screen">
      <SHCPageHeader
        title="Recharge plan"
        subtitle={`${kitchen?.cook?.display_name || 'Kitchen'} · avoid a gap`}
        backHref="/tiffin/manage"
        backLabel="Manage"
      />

      <SHCCard className="mb-4">
        <p className="text-sm font-semibold text-muted-foreground mb-1">Current plan</p>
        <p className="font-black text-lg">
          {sub.meals_per_week} meals/wk · expires {sub.expires_on?.slice(0, 10) || '—'}
        </p>
        <p className="text-xs font-semibold text-muted-foreground mt-2">
          Deliveries left {sub.deliveries_left ?? '—'} · Flex {sub.flex_remaining ?? '—'}/
          {sub.flex_quota ?? '—'}
        </p>
      </SHCCard>

      <p className="text-sm font-extrabold mb-2">How many weeks?</p>
      <div className="flex gap-2 mb-4" data-testid="recharge-weeks-picker">
        {rechargeWeekOptions().map((w) => (
          <button
            key={w}
            type="button"
            data-testid={`recharge-weeks-${w}`}
            onClick={() => setWeeks(w)}
            className={`flex-1 rounded-xl border-2 py-3 font-black ${
              weeks === w
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-[var(--shc-border-brutal)] bg-card'
            }`}
          >
            {w} wk
          </button>
        ))}
      </div>

      <SHCCard className="mb-4 shc-bento-mint">
        <p className="font-extrabold mb-2">After recharge</p>
        <ul className="text-sm font-semibold space-y-1 text-muted-foreground">
          <li>+{preview.mealsAdded} meal deliveries</li>
          <li>Flex days reset to {preview.flexRemaining}</li>
          <li>New expiry {preview.expiresOn}</li>
          <li className="text-foreground font-black pt-1">
            Estimate S${estimate.toFixed(2)} · PayNow
          </li>
        </ul>
      </SHCCard>

      {error ? <SHCErrorBanner message={error} /> : null}

      <SHCButton
        className="w-full"
        size="lg"
        testID="recharge-confirm-btn"
        disabled={rechargeMut.isPending}
        onClick={async () => {
          setError('');
          try {
            await rechargeMut.mutateAsync(weeks);
            router.replace('/tiffin/manage');
          } catch (e: any) {
            setError(e?.message || 'Recharge failed. Try again.');
          }
        }}
      >
        {rechargeMut.isPending ? 'Recharging…' : `Recharge ${weeks} week${weeks > 1 ? 's' : ''}`}
      </SHCButton>
      <p className="text-xs font-semibold text-muted-foreground mt-3 text-center">
        Preferences for new weeks apply after current balance is used.
      </p>
    </div>
  );
}
