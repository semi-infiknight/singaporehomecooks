'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SG_AREA_CENTROIDS } from '@shc/utils';
import { getCookProfile, updateCookProfile } from '../../../lib/cook-api-client';
import { GourmeatCookHeader, GourmeatCard, SHCButton } from '../../components/SHCWebComponents';

type CookProfile = {
  display_name?: string;
  area?: string;
  story?: string;
  collection_address?: string;
  collection_instructions?: string;
  availability_paused?: boolean;
};

export default function CookSettingsPage() {
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [area, setArea] = useState('');
  const [story, setStory] = useState('');
  const [collectionAddress, setCollectionAddress] = useState('');
  const [collectionInstructions, setCollectionInstructions] = useState('');
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const profileQ = useQuery({
    queryKey: ['cook-profile'],
    queryFn: async () => {
      const res = await getCookProfile();
      return res.cook as CookProfile;
    },
  });

  useEffect(() => {
    const cook = profileQ.data;
    if (!cook) return;
    setDisplayName(String(cook.display_name || ''));
    setArea(String(cook.area || ''));
    setStory(String(cook.story || ''));
    setCollectionAddress(String(cook.collection_address || ''));
    setCollectionInstructions(String(cook.collection_instructions || ''));
    setPaused(Boolean(cook.availability_paused));
  }, [profileQ.data]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateCookProfile({
        display_name: displayName.trim() || undefined,
        area: area.trim() || undefined,
        story: story.trim() || undefined,
        collection_address: collectionAddress.trim() || undefined,
        collection_instructions: collectionInstructions.trim() || undefined,
        availability_paused: paused,
      }),
    onSuccess: () => {
      setError('');
      setSaved(true);
      void qc.invalidateQueries({ queryKey: ['cook-profile'] });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e) => setError((e as Error).message || 'Could not save'),
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-4" data-testid="cook-settings-screen">
      <Link href="/cook-portal/dashboard" className="text-sm font-bold text-primary mb-3 inline-block">
        ‹ Dashboard
      </Link>

      <GourmeatCookHeader
        title="Kitchen settings"
        subtitle="Profile, collection details, pause orders"
        testID="cook-settings-hero"
      />

      <GourmeatCard className="mb-4 space-y-2">
        <p className="font-black text-sm">Pause orders</p>
        <p className="text-xs font-semibold text-muted-foreground">
          Temporarily hide your kitchen from new orders. Existing orders stay active.
        </p>
        <label className="flex items-center justify-between gap-3 pt-1">
          <span className="text-sm font-bold">{paused ? 'Orders paused' : 'Accepting orders'}</span>
          <input
            type="checkbox"
            checked={paused}
            onChange={(e) => setPaused(e.target.checked)}
            className="h-5 w-5 accent-primary"
            data-testid="cook-settings-pause-toggle"
          />
        </label>
      </GourmeatCard>

      <GourmeatCard className="mb-4 space-y-3">
        <p className="font-black text-sm">Kitchen profile</p>
        <div>
          <p className="text-xs font-extrabold text-muted-foreground mb-1">Display name</p>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-3 text-sm font-semibold"
            data-testid="cook-settings-display-name"
          />
        </div>
        <div>
          <p className="text-xs font-extrabold text-muted-foreground mb-1">Area</p>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            list="cook-settings-area-suggestions"
            className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-3 text-sm font-semibold"
            data-testid="cook-settings-area"
          />
          <datalist id="cook-settings-area-suggestions">
            {SG_AREA_CENTROIDS.map((a) => (
              <option key={a.name} value={a.name} />
            ))}
          </datalist>
        </div>
        <div>
          <p className="text-xs font-extrabold text-muted-foreground mb-1">Heritage story</p>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={4}
            className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-3 text-sm font-semibold"
            data-testid="cook-settings-story"
          />
        </div>
      </GourmeatCard>

      <GourmeatCard className="mb-4 space-y-3">
        <p className="font-black text-sm">Collection</p>
        <p className="text-xs font-semibold text-muted-foreground">
          Shared with customers after you accept an order.
        </p>
        <div>
          <p className="text-xs font-extrabold text-muted-foreground mb-1">HDB address</p>
          <input
            value={collectionAddress}
            onChange={(e) => setCollectionAddress(e.target.value)}
            className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-3 text-sm font-semibold"
            data-testid="cook-settings-address"
          />
        </div>
        <div>
          <p className="text-xs font-extrabold text-muted-foreground mb-1">Pickup instructions</p>
          <textarea
            value={collectionInstructions}
            onChange={(e) => setCollectionInstructions(e.target.value)}
            rows={3}
            className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-3 text-sm font-semibold"
            data-testid="cook-settings-instructions"
          />
        </div>
      </GourmeatCard>

      {error ? <p className="text-sm font-bold text-destructive mb-3">{error}</p> : null}
      {saved ? <p className="text-sm font-bold text-primary mb-3">Kitchen profile updated.</p> : null}

      <SHCButton
        type="button"
        size="lg"
        className="w-full min-h-[52px]"
        onClick={() => saveMut.mutate()}
        disabled={saveMut.isPending || profileQ.isLoading}
        testID="cook-settings-save-btn"
      >
        {saveMut.isPending ? 'Saving…' : 'Save settings'}
      </SHCButton>
    </div>
  );
}
