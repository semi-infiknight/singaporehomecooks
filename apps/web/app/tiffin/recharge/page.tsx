'use client';

/**
 * HomelyEats Recharge plan — weeks picker → HitPay PayNow → webhook extends plan.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  rechargeWeekOptions,
  applyRecharge,
  defaultFlexQuota,
  tiffinRechargeAmountCents,
} from '@shc/business-rules';
import { tiffinWeeklySubtotal, useTiffinSubscription } from '../../../lib/useTiffin';
import { createTiffinRechargePayNow } from '../../../lib/api-client';
import {
  SHCButton,
  SHCCard,
  SHCPageHeader,
  SHCErrorBanner,
  SHCSkeletonList,
  PayNowPanel,
} from '../../components/SHCWebComponents';

export default function TiffinRechargePage() {
  const router = useRouter();
  const { data: subData, isLoading, refetch } = useTiffinSubscription();
  const [weeks, setWeeks] = useState(4);
  const [phase, setPhase] = useState<'pick' | 'paynow' | 'done'>('pick');
  const [error, setError] = useState('');
  const [paySession, setPaySession] = useState<Awaited<ReturnType<typeof createTiffinRechargePayNow>> | null>(
    null
  );
  const [paySessionLoading, setPaySessionLoading] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const expiresBeforeRef = useRef<string | null>(null);
  const paySessionWeeksRef = useRef<number | null>(null);

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;

  const amountCents = useMemo(
    () => (sub ? tiffinRechargeAmountCents(sub.meals_per_week, weeks) : 0),
    [sub, weeks]
  );
  const amountDollars = amountCents / 100;
  const defaultRef = `TIFFIN-${String(sub?.id || 'PLAN').slice(-8)}-${weeks}W`;

  const loadPayNowSession = useCallback(async (force = false) => {
    if (!force && paySessionWeeksRef.current === weeks) return;
    paySessionWeeksRef.current = weeks;
    setPaySessionLoading(true);
    setError('');
    try {
      const s = await createTiffinRechargePayNow(weeks);
      setPaySession(s);
      if (s.provider === 'hitpay') setWaitingForPayment(true);
    } catch (e: any) {
      paySessionWeeksRef.current = null;
      setPaySession({
        provider: 'hitpay_error',
        error: e?.message || 'Could not create PayNow QR',
      } as any);
    } finally {
      setPaySessionLoading(false);
    }
  }, [weeks]);

  useEffect(() => {
    if (phase !== 'paynow') {
      paySessionWeeksRef.current = null;
      return;
    }
    void loadPayNowSession();
  }, [phase, loadPayNowSession]);

  useEffect(() => {
    if (phase !== 'paynow' || !waitingForPayment) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const fresh = await refetch();
        const newExp = (fresh.data as any)?.subscription?.expires_on;
        if (newExp && expiresBeforeRef.current && newExp !== expiresBeforeRef.current) {
          if (cancelled) return;
          setWaitingForPayment(false);
          setPhase('done');
          window.setTimeout(() => router.replace('/tiffin/manage'), 900);
        }
      } catch {
        /* keep polling */
      }
    };
    void tick();
    const id = window.setInterval(tick, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [phase, waitingForPayment, refetch, router]);

  if (isLoading && !sub) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <SHCSkeletonList count={3} rowHeight={88} />
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

  if (phase === 'done') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center" data-testid="tiffin-recharge-done">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl text-green-700 mx-auto mb-4">
          ✓
        </div>
        <h1 className="text-xl font-black mb-2">Recharge recorded</h1>
        <p className="text-sm font-semibold text-muted-foreground mb-6">
          +{preview.mealsAdded} meals · flex reset · ledger updated
        </p>
        <SHCButton onClick={() => router.replace('/tiffin/manage')}>Back to manage</SHCButton>
      </div>
    );
  }

  if (phase === 'paynow') {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 shc-safe-bottom-pad" data-testid="tiffin-recharge-paynow">
        <SHCPageHeader
          title="PayNow recharge"
          subtitle={`${kitchen?.cook?.display_name || 'Kitchen'} · ${weeks} week${weeks > 1 ? 's' : ''}`}
          backHref="/tiffin/recharge"
          backLabel="Change weeks"
        />
        <PayNowPanel
          amount={amountDollars}
          reference={paySession?.reference || defaultRef}
          session={paySession}
          loadingSession={paySessionLoading}
          onRetry={() => void loadPayNowSession(true)}
          waitingForPayment={waitingForPayment}
        />
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          Scan to pay · we confirm via HitPay · plan extends automatically after payment.
        </p>
        {error ? (
          <div className="mt-3">
            <SHCErrorBanner message={error} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 shc-safe-bottom-pad" data-testid="tiffin-recharge-screen">
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
          Deliveries {sub.deliveries_left ?? '—'} · Flex {sub.flex_remaining ?? '—'}/
          {sub.flex_quota ?? '—'}
          {sub.balance_cents != null
            ? ` · Wallet S$${(Number(sub.balance_cents) / 100).toFixed(2)}`
            : ''}
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
            PayNow S${amountDollars.toFixed(2)}
            <span className="text-muted-foreground font-semibold">
              {' '}
              (~S${tiffinWeeklySubtotal(sub.meals_per_week).toFixed(2)}/wk × {weeks})
            </span>
          </li>
        </ul>
      </SHCCard>

      {error ? <SHCErrorBanner message={error} /> : null}

      <SHCButton
        className="w-full"
        size="lg"
        testID="recharge-continue-paynow"
        onClick={() => {
          setError('');
          expiresBeforeRef.current = sub.expires_on || null;
          setPhase('paynow');
        }}
      >
        Continue to PayNow · S${amountDollars.toFixed(2)}
      </SHCButton>
      <p className="text-xs font-semibold text-muted-foreground mt-3 text-center">
        Preferences for new weeks apply after current balance is used.
      </p>
    </div>
  );
}
