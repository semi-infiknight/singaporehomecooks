'use client';

/**
 * Manage subscription — HomelyEats 29.png hierarchy:
 * metrics → Pause/Recharge → secondary settings → cancel last.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { shapeTiffinLedgerForUi } from '@shc/utils';
import {
  useTiffinSubscription,
  useCancelTiffin,
  useSubscribeTiffin,
  useResumeTiffin,
  useUpdateTiffinNotes,
  TIFFIN_DAY_LABELS,
  tiffinWeeklySubtotal,
} from '../../../lib/useTiffin';
import { SHCButton, SHCCard, SHCPageHeader, SHCBadge, SHCMetaBadge } from '../../components/SHCWebComponents';
import { shcMealPlanBadgeLabel, shcSubscriptionStatusBadgeVariant } from '@shc/utils';

const CANCEL_REASONS = ['Moving away', 'Too expensive', 'Quality concerns', 'Trying another kitchen', 'Other'];

export default function TiffinManagePage() {
  const router = useRouter();
  const { data: subData, isLoading } = useTiffinSubscription();
  const cancelMut = useCancelTiffin();
  const subscribeMut = useSubscribeTiffin();
  const resumeMut = useResumeTiffin();
  const notesMut = useUpdateTiffinNotes();
  const [showReasons, setShowReasons] = useState(false);
  const [cookingNotes, setCookingNotes] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [reminders, setReminders] = useState(true);
  const [notesSaved, setNotesSaved] = useState(false);

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;
  const dishes = kitchen?.dishes || [];
  const currentSlots = (subData as any)?.slots_current_week || [];

  useEffect(() => {
    if (!isLoading && !sub) router.replace('/tiffin/subscriptions');
  }, [isLoading, sub, router]);

  useEffect(() => {
    if (sub?.cooking_notes != null) setCookingNotes(String(sub.cooking_notes || ''));
    if (sub?.collection_notes != null) setCollectionNotes(String(sub.collection_notes || ''));
  }, [sub?.id, sub?.cooking_notes, sub?.collection_notes]);

  if (isLoading || !sub) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        {isLoading ? 'Loading subscription…' : 'Opening My Subscriptions…'}
      </div>
    );
  }

  const isPaused = sub.status === 'paused';
  const cookName = kitchen?.cook?.display_name || 'Kitchen';
  const ledger = shapeTiffinLedgerForUi((subData as any)?.ledger, sub);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 shc-safe-bottom-pad" data-testid="tiffin-manage-screen">
      <SHCPageHeader
        title="Manage subscription"
        subtitle={cookName}
        backHref="/tiffin/subscriptions"
        backLabel="My Subscriptions"
      />

      {/* Metrics — top priority */}
      <SHCCard className="mb-4" data-testid="tiffin-plan-metrics-card">
        <div className="flex flex-wrap gap-2 mb-3">
          <SHCMetaBadge kind="meal_plan">{shcMealPlanBadgeLabel(sub.meals_per_week)}</SHCMetaBadge>
          <SHCMetaBadge kind="price">S${tiffinWeeklySubtotal(sub.meals_per_week).toFixed(2)}/wk</SHCMetaBadge>
          <SHCBadge variant={shcSubscriptionStatusBadgeVariant(isPaused)}>{sub.status}</SHCBadge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center" data-testid="tiffin-plan-metrics">
          <div>
            <p className="font-black text-primary text-lg tabular-nums">
              {sub.balance_cents != null
                ? `S$${(Number(sub.balance_cents) / 100).toFixed(0)}`
                : '—'}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">Wallet</p>
          </div>
          <div>
            <p className="font-black text-primary text-lg">{sub.deliveries_left ?? '—'}</p>
            <p className="text-[10px] font-bold text-muted-foreground">Deliveries left</p>
          </div>
          <div>
            <p className="font-black text-primary text-lg">
              {sub.flex_remaining ?? '—'}/{sub.flex_quota ?? '—'}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">Flex days</p>
          </div>
          <div>
            <p className="font-black text-primary text-lg">{sub.expires_on?.slice(5) ?? '—'}</p>
            <p className="text-[10px] font-bold text-muted-foreground">Expires</p>
          </div>
        </div>
        {isPaused && sub.paused_until ? (
          <p className="text-xs font-bold text-[var(--shc-warning)] mt-3">
            Paused till {String(sub.paused_until).slice(0, 10)}
          </p>
        ) : null}
      </SHCCard>

      {/* Primary: Pause · Recharge */}
      <div className="grid grid-cols-2 gap-2 mb-4" data-testid="tiffin-primary-actions">
        {isPaused ? (
          <SHCButton
            className="w-full"
            onClick={() => resumeMut.mutate()}
            disabled={resumeMut.isPending}
            testID="tiffin-resume-btn"
          >
            Resume
          </SHCButton>
        ) : (
          <SHCButton
            className="w-full"
            variant="outline"
            onClick={() => router.push('/tiffin/pause')}
            testID="tiffin-pause-btn"
          >
            Pause
          </SHCButton>
        )}
        <SHCButton
          className="w-full"
          onClick={() => router.push('/tiffin/recharge')}
          testID="tiffin-recharge-btn"
        >
          Recharge
        </SHCButton>
      </div>

      {/* Secondary settings */}
      <p className="font-extrabold text-sm mb-2">Plan settings</p>
      <SHCCard className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <SHCButton size="sm" onClick={() => router.push('/tiffin/planner')} testID="tiffin-manage-planner-btn">
            Edit weekly plan
          </SHCButton>
          <Link href="/tiffin/calendar">
            <SHCButton size="sm" variant="outline" testID="tiffin-open-calendar-btn">
              Meal calendar
            </SHCButton>
          </Link>
          <Link href="/location">
            <SHCButton size="sm" variant="outline" testID="tiffin-change-address">
              Collection address
            </SHCButton>
          </Link>
        </div>

        <p className="text-xs font-bold text-muted-foreground">Meals per week</p>
        <div className="flex gap-2">
          {(kitchen?.meals_per_week_options || [2, 3, 4]).map((n: number) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                sub.cook_id && subscribeMut.mutate({ cookId: sub.cook_id, mealsPerWeek: n as 2 | 3 | 4 })
              }
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

        <label className="block text-xs font-bold text-muted-foreground">Cooking instructions</label>
        <textarea
          className="shc-input w-full text-sm min-h-[64px]"
          placeholder="e.g. less spicy · no peanuts"
          value={cookingNotes}
          onChange={(e) => setCookingNotes(e.target.value)}
          data-testid="manage-cooking-notes"
        />
        <label className="block text-xs font-bold text-muted-foreground">Collection instructions</label>
        <textarea
          className="shc-input w-full text-sm min-h-[64px]"
          placeholder="e.g. call when ready · unit 12-34"
          value={collectionNotes}
          onChange={(e) => setCollectionNotes(e.target.value)}
          data-testid="manage-collection-notes"
        />
        <SHCButton
          size="sm"
          variant="outline"
          testID="manage-save-notes"
          disabled={notesMut.isPending}
          onClick={async () => {
            try {
              await notesMut.mutateAsync({
                cooking_notes: cookingNotes || null,
                collection_notes: collectionNotes || null,
              });
              setNotesSaved(true);
              setTimeout(() => setNotesSaved(false), 2000);
            } catch {
              /* ignore */
            }
          }}
        >
          {notesMut.isPending ? 'Saving…' : notesSaved ? 'Saved' : 'Save instructions'}
        </SHCButton>
        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={reminders}
            onChange={(e) => setReminders(e.target.checked)}
            className="accent-primary"
            data-testid="manage-reminders-toggle"
          />
          Reminder before subscription ends (device notifications)
        </label>
      </SHCCard>

      <p className="font-extrabold text-sm mb-2">This week</p>
      <ul className="space-y-2 mb-6">
        {currentSlots.map((slot: any) => {
          const dish = dishes.find((d: any) => d.id === slot.product_id);
          if (!dish) return null;
          return (
            <li
              key={slot.day_of_week}
              className="flex justify-between rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2"
            >
              <div>
                <p className="text-xs font-bold text-primary">{TIFFIN_DAY_LABELS[slot.day_of_week]}</p>
                <p className="font-bold text-sm">{dish.name}</p>
              </div>
            </li>
          );
        })}
        {currentSlots.length === 0 ? (
          <li className="text-sm font-semibold text-muted-foreground">No meals planned — edit weekly plan.</li>
        ) : null}
      </ul>

      {/* Recent transactions — Wave 5 ledger (ref manage 29) */}
      <p className="font-extrabold text-sm mb-2">Recent transactions</p>
      <SHCCard className="mb-6" data-testid="tiffin-ledger-preview">
        <ul className="divide-y-2 divide-[var(--shc-border-brutal)]">
          {ledger.map((row) => (
            <li key={row.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{row.label}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">{row.dateLabel}</p>
              </div>
              <p className="text-sm font-black tabular-nums shrink-0">{row.amountLabel}</p>
            </li>
          ))}
        </ul>
        <p className="text-[11px] font-semibold text-muted-foreground mt-3 pt-2 border-t border-[var(--shc-border-brutal)]/40">
          PayNow recharges post to this ledger. Skip/pause use flex (no charge).
        </p>
        <SHCButton
          size="sm"
          className="mt-3"
          onClick={() => router.push('/tiffin/recharge')}
          testID="tiffin-ledger-recharge-btn"
        >
          Recharge again
        </SHCButton>
      </SHCCard>

      {/* Danger zone last */}
      <div className="border-t-2 border-[var(--shc-border-brutal)] pt-4" data-testid="tiffin-danger-zone">
        <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Danger zone</p>
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
                  router.replace('/tiffin/subscriptions');
                }}
              >
                {r}
              </SHCButton>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
