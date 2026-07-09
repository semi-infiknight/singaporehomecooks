'use client';

/**
 * My Subscriptions — HomelyEats Active / Past tabs + empty screens.
 */
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { emptyActiveSubscriptionsCopy, emptyPastSubscriptionsCopy } from '@shc/utils';
import { useTiffinSubscription } from '../../../lib/useTiffin';
import { tiffinWeeklySubtotal } from '../../../lib/useTiffin';
import {
  SHCButton,
  SHCCard,
  SHCBadge,
  IllustratedEmptyState,
  GourmeatScreenHeader,
} from '../../components/SHCWebComponents';
import { useAuth } from '../../../lib/useAuth';

type Tab = 'active' | 'past';

export default function MySubscriptionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: subData, isLoading } = useTiffinSubscription();
  const [tab, setTab] = useState<Tab>('active');

  const sub = (subData as { subscription?: Record<string, unknown> } | undefined)?.subscription;
  const kitchen = (subData as { kitchen?: { cook?: { display_name?: string } } } | undefined)?.kitchen;
  const isActive = sub && String(sub.status || '') !== 'cancelled' && String(sub.status || '') !== 'canceled';
  const isPast = sub && (String(sub.status || '') === 'cancelled' || String(sub.status || '') === 'canceled');

  if (authLoading || isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Loading subscriptions…
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

      {/* Active / Past tabs */}
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
        isActive && sub ? (
          <SHCCard className="mt-4" data-testid="subscription-active-card">
            <p className="font-black text-lg">
              {kitchen?.cook?.display_name || 'Tiffin kitchen'}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <SHCBadge variant="heritage">{String(sub.meals_per_week || '')} meals/wk</SHCBadge>
              <SHCBadge variant="default">
                S${tiffinWeeklySubtotal(Number(sub.meals_per_week) || 3).toFixed(2)}/wk
              </SHCBadge>
              <SHCBadge variant={sub.status === 'paused' ? 'warning' : 'success'}>
                {String(sub.status || 'active')}
              </SHCBadge>
            </div>
            <div className="mt-4 flex gap-2">
              <SHCButton size="sm" onClick={() => router.push('/tiffin/manage')} testID="sub-manage-btn">
                Manage plan
              </SHCButton>
              <SHCButton
                size="sm"
                variant="outline"
                onClick={() => router.push('/tiffin/calendar')}
                testID="sub-calendar-btn"
              >
                Meal calendar
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
      ) : isPast && sub ? (
        <SHCCard className="mt-4" data-testid="subscription-past-card">
          <p className="font-black text-lg">
            {kitchen?.cook?.display_name || 'Tiffin kitchen'}
          </p>
          <div className="mt-2">
            <SHCBadge variant="default">Ended</SHCBadge>
          </div>
          <p className="text-sm text-muted-foreground mt-2 font-semibold">
            Subscribe again anytime from Browse kitchens.
          </p>
          <SHCButton className="mt-4" size="sm" onClick={() => router.push('/tiffin')}>
            Browse kitchens
          </SHCButton>
        </SHCCard>
      ) : (
        <IllustratedEmptyState kind="no_past_sub" title={pastCopy.title} />
      )}
    </div>
  );
}
