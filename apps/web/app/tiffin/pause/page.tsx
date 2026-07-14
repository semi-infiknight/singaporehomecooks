'use client';

/**
 * HomelyEats Pause plan — consumes flex days, extends expiry.
 */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pauseDayOptions, applyPause } from '@shc/business-rules';
import { useTiffinSubscription, usePauseTiffin } from '../../../lib/useTiffin';
import { SHCButton, SHCCard, SHCPageHeader, SHCErrorBanner, SHCSkeletonList } from '../../components/SHCWebComponents';

export default function TiffinPausePage() {
  const router = useRouter();
  const { data: subData, isLoading } = useTiffinSubscription();
  const pauseMut = usePauseTiffin();
  const [days, setDays] = useState(1);
  const [error, setError] = useState('');

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;
  const flexLeft = Number(sub?.flex_remaining ?? 0);
  const options = pauseDayOptions(flexLeft);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <SHCSkeletonList count={3} rowHeight={88} />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <SHCPageHeader title="Pause plan" subtitle="No active subscription" />
        <SHCButton onClick={() => router.push('/tiffin')}>Browse kitchens</SHCButton>
      </div>
    );
  }

  if (String(sub.status) === 'paused') {
    return (
      <div className="max-w-xl mx-auto px-4 py-10" data-testid="tiffin-pause-already">
        <SHCPageHeader title="Already paused" subtitle={`Until ${sub.paused_until || '—'}`} />
        <SHCButton onClick={() => router.push('/tiffin/manage')}>Back to manage</SHCButton>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10" data-testid="tiffin-pause-no-flex">
        <SHCPageHeader
          title="No flex days left"
          subtitle="Recharge for a new period, or wait until flex resets."
        />
        <div className="flex flex-col gap-2">
          <SHCButton onClick={() => router.push('/tiffin/recharge')}>Recharge plan</SHCButton>
          <SHCButton variant="outline" onClick={() => router.push('/tiffin/manage')}>
            Back
          </SHCButton>
        </div>
      </div>
    );
  }

  const preview = applyPause({
    flexRemaining: flexLeft,
    pauseDays: days,
    expiresOn: sub.expires_on,
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-28" data-testid="tiffin-pause-screen">
      <SHCPageHeader
        title="Pause plan"
        subtitle={`${kitchen?.cook?.display_name || 'Kitchen'} · uses flex days`}
        backHref="/tiffin/manage"
        backLabel="Manage"
      />

      <SHCCard className="mb-4 shc-bento-yellow">
        <p className="font-black text-2xl tabular-nums">{flexLeft}</p>
        <p className="text-sm font-semibold text-muted-foreground">Flex days remaining this period</p>
        <p className="text-xs font-semibold text-muted-foreground mt-2 leading-relaxed">
          Pausing holds collections and extends your expiry so you don’t lose paid meals.
        </p>
      </SHCCard>

      <p className="text-sm font-extrabold mb-2">Pause for how many days?</p>
      <div className="flex flex-wrap gap-2 mb-4" data-testid="pause-days-picker">
        {options.map((d) => (
          <button
            key={d}
            type="button"
            data-testid={`pause-days-${d}`}
            onClick={() => setDays(d)}
            className={`min-w-[3rem] rounded-xl border-2 px-3 py-2 font-black ${
              days === d
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-[var(--shc-border-brutal)] bg-card'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <SHCCard className="mb-4">
        <p className="font-extrabold mb-2">What happens</p>
        <ul className="text-sm font-semibold space-y-1 text-muted-foreground">
          <li>Paused until {preview.pausedUntil}</li>
          <li>Flex left after: {preview.flexRemaining}</li>
          {preview.expiresOn ? <li>Expiry moves to {preview.expiresOn}</li> : null}
        </ul>
      </SHCCard>

      {error ? <SHCErrorBanner message={error} /> : null}

      <SHCButton
        className="w-full"
        size="lg"
        testID="pause-confirm-btn"
        disabled={pauseMut.isPending}
        onClick={async () => {
          setError('');
          try {
            await pauseMut.mutateAsync(days);
            router.replace('/tiffin/manage');
          } catch (e: any) {
            setError(e?.message || 'Pause failed. Try again.');
          }
        }}
      >
        {pauseMut.isPending ? 'Pausing…' : `Pause for ${days} day${days > 1 ? 's' : ''}`}
      </SHCButton>
    </div>
  );
}
