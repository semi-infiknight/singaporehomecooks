'use client';

/**
 * My Subscriptions — Active/Past tabs + 5 card states (HomelyEats 28.png).
 */
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  emptyActiveSubscriptionsCopy,
  emptyPastSubscriptionsCopy,
} from '@shc/utils';
import {
  subscriptionCardKind,
  subscriptionCardCopy,
} from '@shc/business-rules';
import { useTiffinSubscription, useResumeTiffin, tiffinWeeklySubtotal } from '../../../lib/useTiffin';
import {
  SHCButton,
  SHCCard,
  SHCBadge,
  IllustratedEmptyState,
  GourmeatScreenHeader,
  SHCSkeletonList,
} from '../../components/SHCWebComponents';
import { useAuth } from '../../../lib/useAuth';

type Tab = 'active' | 'past';

export default function MySubscriptionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: subData, isLoading } = useTiffinSubscription();
  const resumeMut = useResumeTiffin();
  const [tab, setTab] = useState<Tab>('active');

  const sub = (subData as { subscription?: Record<string, unknown> } | undefined)?.subscription;
  const kitchen = (subData as { kitchen?: { cook?: { display_name?: string } } } | undefined)?.kitchen;
  const pastList =
    ((subData as { past_subscriptions?: Array<Record<string, unknown>> } | undefined)
      ?.past_subscriptions || []) as Array<Record<string, unknown>>;

  const kind = useMemo(() => {
    if (!sub) return null;
    return subscriptionCardKind({
      status: String(sub.status || 'active'),
      pausedUntil: sub.paused_until as string | null,
      expiresOn: sub.expires_on as string | null,
    });
  }, [sub]);

  const isPastKind = kind === 'canceled' || kind === 'expired';
  const isActiveKind = kind && !isPastKind;

  if (authLoading || isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8" data-testid="my-subscriptions-screen">
        <GourmeatScreenHeader title="My Subscriptions" subtitle="Tiffin plans" />
        <SHCSkeletonList count={3} rowHeight={120} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 pb-28" data-testid="my-subscriptions-screen">
        <GourmeatScreenHeader title="My Subscriptions" subtitle="Tiffin plans" />
        <IllustratedEmptyState
          kind="no_active_sub"
          title="Sign in to manage subscriptions"
          action={
            <Link href="/login?next=/tiffin/subscriptions">
              <SHCButton>Sign in</SHCButton>
            </Link>
          }
        />
      </div>
    );
  }

  const activeCopy = emptyActiveSubscriptionsCopy();
  const pastCopy = emptyPastSubscriptionsCopy();
  const copy =
    kind != null
      ? subscriptionCardCopy(kind, {
          pausedUntil: sub?.paused_until as string,
          expiresOn: sub?.expires_on as string,
        })
      : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28" data-testid="my-subscriptions-screen">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-2xl font-light leading-none px-1"
          aria-label="Back"
        >
          ‹
        </button>
        <h1 className="flex-1 text-center text-lg font-extrabold -ml-6">My Subscriptions</h1>
      </div>

      <div
        className="flex border-b-2 border-[var(--shc-border-brutal)]/30 mb-2"
        role="tablist"
        data-testid="subscriptions-tabs"
      >
        {(
          [
            { id: 'active' as const, label: 'Active Subscriptions' },
            { id: 'past' as const, label: 'Past Subscriptions' },
          ] as const
        ).map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              data-testid={`subscriptions-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                on
                  ? 'text-foreground border-b-2 border-foreground -mb-[2px]'
                  : 'text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'active' ? (
        isActiveKind && sub && copy ? (
          <SHCCard className="mt-4" data-testid={`subscription-card-${kind}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-black text-lg">
                {kitchen?.cook?.display_name || 'Tiffin kitchen'}
              </p>
              <SHCBadge
                variant={
                  kind === 'paused' ? 'warning' : kind === 'expires_soon' ? 'warning' : 'success'
                }
              >
                {copy.badge}
              </SHCBadge>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <SHCBadge variant="heritage">{String(sub.meals_per_week || '')} meals/wk</SHCBadge>
              <SHCBadge variant="default">
                S${tiffinWeeklySubtotal(Number(sub.meals_per_week) || 3).toFixed(2)}/wk
              </SHCBadge>
            </div>
            <p className="text-xs font-semibold text-muted-foreground mb-3">
              Deliveries {String(sub.deliveries_left ?? '—')} · Flex {String(sub.flex_remaining ?? '—')}/
              {String(sub.flex_quota ?? '—')}
              {sub.expires_on ? ` · Exp ${String(sub.expires_on).slice(0, 10)}` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {kind === 'paused' ? (
                <SHCButton
                  size="sm"
                  onClick={() => resumeMut.mutate()}
                  disabled={resumeMut.isPending}
                  testID="sub-resume-btn"
                >
                  {copy.primaryCta}
                </SHCButton>
              ) : copy.showRecharge ? (
                <SHCButton size="sm" onClick={() => router.push('/tiffin/recharge')} testID="sub-recharge-btn">
                  {copy.primaryCta}
                </SHCButton>
              ) : (
                <SHCButton size="sm" onClick={() => router.push('/tiffin/manage')} testID="sub-manage-btn">
                  {copy.primaryCta}
                </SHCButton>
              )}
              <SHCButton
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(copy.showRecharge || kind === 'paused' ? '/tiffin/manage' : '/tiffin/calendar')
                }
                testID="sub-secondary-btn"
              >
                {copy.secondaryCta}
              </SHCButton>
            </div>
          </SHCCard>
        ) : (
          <IllustratedEmptyState
            kind="no_active_sub"
            title={activeCopy.title}
            action={
              <SHCButton
                onClick={() => router.push('/tiffin')}
                testID="subscribe-now-cta"
                className="min-w-[180px]"
              >
                {activeCopy.ctaLabel}
              </SHCButton>
            }
          />
        )
      ) : pastList.length > 0 || (isPastKind && sub && copy) ? (
        <div className="mt-4 space-y-3" data-testid="past-subscriptions-list">
          {pastList.map((p) => (
            <SHCCard key={String(p.id)} data-testid="subscription-card-canceled">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-black text-lg">Past kitchen plan</p>
                <SHCBadge variant="default">
                  Canceled
                  {p.canceled_at ? ` on ${String(p.canceled_at).slice(0, 10)}` : ''}
                </SHCBadge>
              </div>
              <p className="text-sm text-muted-foreground font-semibold mb-3">
                {String(p.meals_per_week || '')} meals/wk · Ended — subscribe again anytime.
              </p>
              <SHCButton size="sm" variant="outline" onClick={() => router.push('/tiffin')}>
                Browse kitchens
              </SHCButton>
            </SHCCard>
          ))}
          {pastList.length === 0 && isPastKind && sub && copy ? (
            <SHCCard data-testid={`subscription-card-${kind}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-black text-lg">
                  {kitchen?.cook?.display_name || 'Tiffin kitchen'}
                </p>
                <SHCBadge variant="default">{copy.badge}</SHCBadge>
              </div>
              <p className="text-sm text-muted-foreground font-semibold mb-3">
                {kind === 'expired'
                  ? 'Balance depleted — recharge to continue without a gap.'
                  : 'Ended. Subscribe again from Browse kitchens anytime.'}
              </p>
              <SHCButton size="sm" variant="outline" onClick={() => router.push('/tiffin')}>
                Browse kitchens
              </SHCButton>
            </SHCCard>
          ) : null}
        </div>
      ) : (
        <IllustratedEmptyState kind="no_past_sub" title={pastCopy.title} />
      )}
    </div>
  );
}
