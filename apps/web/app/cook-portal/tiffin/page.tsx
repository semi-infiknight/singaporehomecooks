'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCookListings } from '../../../lib/useCookPortal';
import { useTiffinCookConfig, useUpdateTiffinCookConfig, TIFFIN_DAY_LABELS } from '../../../lib/useTiffin';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCBadge,
} from '../../components/SHCWebComponents';

export default function CookTiffinConfigPage() {
  const router = useRouter();
  const { data: configData, isLoading } = useTiffinCookConfig();
  const { data: listings = [] } = useCookListings();
  const updateMut = useUpdateTiffinCookConfig();

  const config = (configData as any)?.config;
  const [enabled, setEnabled] = useState(false);
  const [tagline, setTagline] = useState('');
  const [eligible, setEligible] = useState<string[]>([]);
  const [collectionDays, setCollectionDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (config) {
      setEnabled(!!config.enabled);
      setTagline(config.tagline || '');
      setEligible(config.eligible_product_ids || []);
      setCollectionDays(config.collection_days || [1, 2, 3, 4, 5]);
    }
  }, [config]);

  const dishes = listings.map((l: any) => ({
    id: l.id || l.product_id,
    name: l.name || l.title,
    price: l.price,
    cuisine: l.cuisine,
  }));

  const toggleDish = (id: string) => {
    setEligible((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleDay = (day: number) => {
    setCollectionDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSave = async () => {
    await updateMut.mutateAsync({
      enabled,
      tagline: tagline.trim() || undefined,
      eligible_product_ids: eligible,
      collection_days: collectionDays,
      meals_per_week_options: [2, 3, 4],
    });
    setSavedMsg('Tiffin settings saved — customers can subscribe now.');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Loading tiffin config…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24" data-testid="cook-tiffin-config-screen">
      <GourmeatCookHeader
        title="Tiffin subscription"
        subtitle="Let customers subscribe to weekly meals from your kitchen"
        testID="cook-tiffin-header"
      />

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
        <GourmeatCard className="mb-4">
          <p className="text-sm text-muted-foreground font-semibold">No listings yet.</p>
          <GourmeatPrimaryButton
            label="Create a listing"
            onClick={() => router.push('/cook-portal/listings')}
            className="mt-2"
          />
        </GourmeatCard>
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
