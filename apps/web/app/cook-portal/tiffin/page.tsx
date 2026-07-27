'use client';

/**
 * Cook tiffin OS — config + day menu publish / cancel (wireframe kitchen ops).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCookListings } from '../../../lib/useCookPortal';
import {
  useTiffinCookConfig,
  useUpdateTiffinCookConfig,
  useKitchenCancelTiffinDay,
  usePublishTiffinDayMenu,
  TIFFIN_DAY_LABELS,
} from '../../../lib/useTiffin';
import {
  cookOpsCollectionDates,
  cookTiffinMetrics,
  cookMenuPublishSuccessCopy,
  cookDayCancelSuccessCopy,
  cookTiffinEmptyDishesCopy,
  DEFAULT_TIFFIN_PRICING_BY_MEALS,
} from '@shc/utils';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCBadge,
  IllustratedEmptyState,
  SHCSkeletonList,
} from '../../components/SHCWebComponents';

export default function CookTiffinConfigPage() {
  const router = useRouter();
  const { data: configData, isLoading } = useTiffinCookConfig();
  const { data: listings } = useCookListings();
  const listingList = (listings as any[]) ?? [];
  const updateMut = useUpdateTiffinCookConfig();
  const cancelDayMut = useKitchenCancelTiffinDay();
  const publishMenuMut = usePublishTiffinDayMenu();

  const config = (configData as any)?.config;
  const [enabled, setEnabled] = useState(false);
  const [tagline, setTagline] = useState('');
  const [eligible, setEligible] = useState<string[]>([]);
  const [collectionDays, setCollectionDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [pricing, setPricing] = useState<Record<string, string>>({
    '2': String(DEFAULT_TIFFIN_PRICING_BY_MEALS['2']),
    '3': String(DEFAULT_TIFFIN_PRICING_BY_MEALS['3']),
    '4': String(DEFAULT_TIFFIN_PRICING_BY_MEALS['4']),
  });
  const [savedMsg, setSavedMsg] = useState('');
  const [opsMsg, setOpsMsg] = useState('');
  const [opsError, setOpsError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (config) {
      setEnabled(!!config.enabled);
      setTagline(config.tagline || '');
      setEligible(config.eligible_product_ids || []);
      setCollectionDays(config.collection_days || [1, 2, 3, 4, 5]);
      const p = config.pricing_by_meals_per_week || DEFAULT_TIFFIN_PRICING_BY_MEALS;
      setPricing({
        '2': String(p['2'] ?? DEFAULT_TIFFIN_PRICING_BY_MEALS['2']),
        '3': String(p['3'] ?? DEFAULT_TIFFIN_PRICING_BY_MEALS['3']),
        '4': String(p['4'] ?? DEFAULT_TIFFIN_PRICING_BY_MEALS['4']),
      });
    }
  }, [config]);

  const dishes = listingList.map((l: any) => ({
    id: l.id || l.product_id,
    name: l.name || l.title,
    price: l.price,
    cuisine: l.cuisine,
  }));

  const metrics = useMemo(
    () =>
      cookTiffinMetrics({
        enabled,
        eligibleProductIds: eligible,
        collectionDays,
        subscriberCount:
          (configData as any)?.subscriber_count ??
          (configData as any)?.kitchen?.subscriber_count ??
          (config as any)?.subscriber_count,
      }),
    [enabled, eligible, collectionDays, configData, config]
  );

  const opsDays = useMemo(
    () => cookOpsCollectionDates({ collectionDays, count: 7 }),
    [collectionDays]
  );

  useEffect(() => {
    if (!selectedDate && opsDays[0]) setSelectedDate(opsDays[0].date);
  }, [opsDays, selectedDate]);

  const toggleDish = (id: string) => {
    setEligible((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleDay = (day: number) => {
    setCollectionDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSave = async () => {
    setOpsError('');
    await updateMut.mutateAsync({
      enabled,
      tagline: tagline.trim() || undefined,
      eligible_product_ids: eligible,
      collection_days: collectionDays,
      meals_per_week_options: [2, 3, 4],
      pricing_by_meals_per_week: {
        '2': Number(pricing['2']) || DEFAULT_TIFFIN_PRICING_BY_MEALS['2'],
        '3': Number(pricing['3']) || DEFAULT_TIFFIN_PRICING_BY_MEALS['3'],
        '4': Number(pricing['4']) || DEFAULT_TIFFIN_PRICING_BY_MEALS['4'],
      },
    });
    setSavedMsg('Tiffin settings saved — customers can subscribe now.');
  };

  const handlePublish = async () => {
    setOpsError('');
    setOpsMsg('');
    if (!selectedDate) return;
    if (eligible.length === 0) {
      setOpsError('Select at least one eligible dish before publishing a menu.');
      return;
    }
    try {
      await publishMenuMut.mutateAsync({
        collectionDate: selectedDate,
        productIds: eligible,
        note: 'Daily tiffin menu',
      });
      setOpsMsg(cookMenuPublishSuccessCopy(selectedDate, eligible.length));
    } catch (e: any) {
      setOpsError(e?.message || 'Publish failed');
    }
  };

  const handleCancelDay = async () => {
    setOpsError('');
    setOpsMsg('');
    if (!selectedDate) return;
    try {
      await cancelDayMut.mutateAsync({
        collectionDate: selectedDate,
        reason: 'Kitchen unavailable',
      });
      setOpsMsg(cookDayCancelSuccessCopy(selectedDate));
    } catch (e: any) {
      setOpsError(e?.message || 'Cancel day failed');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8" data-testid="cook-tiffin-skeleton">
        <SHCSkeletonList count={5} rowHeight={64} />
      </div>
    );
  }

  const emptyDishes = cookTiffinEmptyDishesCopy();

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24" data-testid="cook-tiffin-config-screen">
      <GourmeatCookHeader
        title="Tiffin kitchen OS"
        subtitle="Visibility · plan dishes · publish day menu · cancel day"
        testID="cook-tiffin-header"
      />

      {/* Metrics strip */}
      <GourmeatCard className="mb-4" data-testid="cook-tiffin-metrics">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-black text-sm">{metrics.statusLabel}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">{metrics.statusDetail}</p>
          </div>
          <SHCBadge variant={metrics.enabled ? 'success' : 'default'}>
            {metrics.enabled ? 'On' : 'Off'}
          </SHCBadge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="font-black text-primary text-lg">{metrics.eligibleCount}</p>
            <p className="text-[10px] font-bold text-muted-foreground">Eligible dishes</p>
          </div>
          <div>
            <p className="font-black text-primary text-lg">{metrics.collectionDayCount}</p>
            <p className="text-[10px] font-bold text-muted-foreground">Collection days</p>
          </div>
          <div>
            <p className="font-black text-primary text-lg">
              {metrics.subscriberCount != null ? metrics.subscriberCount : '—'}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">Subscribers</p>
          </div>
        </div>
      </GourmeatCard>

      <GourmeatCard className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">Visible to customers</p>
            <p className="text-xs text-muted-foreground">Show this kitchen on the tiffin browse list</p>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              data-testid="cook-tiffin-enabled-switch"
              className="w-5 h-5 accent-[var(--shc-primary)]"
            />
            <SHCBadge variant={enabled ? 'success' : 'default'}>{enabled ? 'On' : 'Off'}</SHCBadge>
          </label>
        </div>
      </GourmeatCard>

      <label className="block text-sm font-bold mb-1">Tagline</label>
      <input
        className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] px-3 py-2.5 text-sm mb-4 bg-card"
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        placeholder="e.g. Peranakan comfort — 3 nights a week"
        data-testid="cook-tiffin-tagline-input"
      />

      <p className="font-extrabold text-sm mb-1">Plan pricing (S$ per meal)</p>
      <p className="text-xs text-muted-foreground mb-2">
        Customers see these rates when subscribing to your tiffin plan.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(['2', '3', '4'] as const).map((tier) => (
          <div key={tier}>
            <p className="text-[10px] font-bold text-muted-foreground mb-1">{tier} meals/wk</p>
            <input
              type="number"
              step="0.5"
              min="1"
              className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] px-3 py-2.5 text-sm bg-card font-bold"
              value={pricing[tier]}
              onChange={(e) => setPricing((prev) => ({ ...prev, [tier]: e.target.value }))}
              data-testid={`cook-tiffin-price-${tier}`}
            />
          </div>
        ))}
      </div>

      <p className="font-extrabold text-sm mb-2">Collection days</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TIFFIN_DAY_LABELS.map((label, day) => (
          <button
            key={day}
            type="button"
            data-testid={`cook-tiffin-day-${day}`}
            onClick={() => toggleDay(day)}
            className={`min-w-[44px] rounded-lg border-2 px-2 py-2 text-xs font-black ${
              collectionDays.includes(day)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-[var(--shc-border-brutal)] bg-card'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="font-extrabold text-sm mb-1">Eligible dishes</p>
      <p className="text-xs text-muted-foreground mb-2">
        Select listings customers can pick in their weekly plan.
      </p>
      {dishes.length === 0 ? (
        <div className="mb-4" data-testid="cook-tiffin-empty-dishes">
          <IllustratedEmptyState
            kind="no_active_sub"
            title={emptyDishes.title}
            description={emptyDishes.body}
            action={
              <GourmeatPrimaryButton
                label={emptyDishes.ctaLabel}
                onClick={() => router.push('/cook-portal/listings')}
              />
            }
          />
        </div>
      ) : (
        <ul className="space-y-2 mb-6">
          {dishes.map((d: { id: string; name: string; price?: number; cuisine?: string }) => {
            const on = eligible.includes(d.id);
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => toggleDish(d.id)}
                  data-testid={`cook-tiffin-dish-${d.id}`}
                  className={`w-full text-left rounded-xl border-2 px-3 py-2.5 flex items-center justify-between ${
                    on
                      ? 'border-primary bg-primary/10'
                      : 'border-[var(--shc-border-brutal)] bg-card'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm">{d.name}</p>
                    {d.cuisine ? <p className="text-xs text-muted-foreground">{d.cuisine}</p> : null}
                  </div>
                  <SHCBadge variant={on ? 'success' : 'default'}>{on ? 'Included' : 'Off'}</SHCBadge>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {savedMsg ? <p className="text-sm font-bold text-primary mb-3">{savedMsg}</p> : null}

      {/* Day ops — pick date then publish / cancel */}
      <p className="font-extrabold text-sm mb-2 mt-2">Day menu & cancel</p>
      <p className="text-xs text-muted-foreground mb-2">
        Publish today&apos;s menu so customer order cards leave “Menu yet to be updated”. Cancel a day
        to notify subscribers.
      </p>
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide"
        data-testid="cook-tiffin-ops-dates"
      >
        {opsDays.map((d) => {
          const on = d.date === selectedDate;
          return (
            <button
              key={d.date}
              type="button"
              data-testid={`cook-ops-date-${d.date}`}
              onClick={() => setSelectedDate(d.date)}
              className={`shrink-0 rounded-xl border-2 px-3 py-2 text-center min-w-[4.5rem] ${
                on
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-[var(--shc-border-brutal)] bg-card'
              }`}
            >
              <div className="text-[10px] font-bold opacity-90">{d.shortLabel}</div>
              <div className="text-xs font-black">{d.date.slice(5)}</div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <GourmeatPrimaryButton
          label={
            publishMenuMut.isPending
              ? 'Publishing…'
              : `Publish menu · ${selectedDate || 'pick a day'}`
          }
          onClick={handlePublish}
          loading={publishMenuMut.isPending}
          testID="cook-tiffin-publish-menu-btn"
          className="w-full"
        />
        <GourmeatPrimaryButton
          label={
            cancelDayMut.isPending
              ? 'Canceling…'
              : `Cancel kitchen day · ${selectedDate || 'pick a day'}`
          }
          onClick={handleCancelDay}
          loading={cancelDayMut.isPending}
          testID="cook-tiffin-cancel-day-btn"
          className="w-full"
          variant="outline"
        />
      </div>

      {opsMsg ? (
        <p className="text-sm font-bold text-[var(--shc-success)] mb-3" data-testid="cook-tiffin-ops-msg">
          {opsMsg}
        </p>
      ) : null}
      {opsError ? (
        <p className="text-sm font-bold text-red-600 mb-3" data-testid="cook-tiffin-ops-error">
          {opsError}
        </p>
      ) : null}

      <GourmeatPrimaryButton
        label={updateMut.isPending ? 'Saving…' : 'Save tiffin settings'}
        onClick={handleSave}
        loading={updateMut.isPending}
        testID="cook-tiffin-save-btn"
        className="w-full"
      />
    </div>
  );
}
