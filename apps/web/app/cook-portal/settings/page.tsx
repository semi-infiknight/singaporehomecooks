'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SG_AREA_CENTROIDS, getCookAvatarUrl, getCookKitchenHeroUrl, normalizeCookCollectionTimeSlots } from '@shc/utils';
import { getCookProfile, updateCookProfile, getUploadUrl } from '../../../lib/cook-api-client';
import { uploadCookMediaFile, readWebImageFile } from '../../../lib/cook-media-upload';
import { useCookAuth } from '../../../lib/useCookAuth';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCButton,
  SHCSkeletonList,
  CookCollectionSlotEditorWeb,
} from '../../components/SHCWebComponents';

type CookProfile = {
  display_name?: string;
  area?: string;
  story?: string;
  collection_address?: string;
  collection_instructions?: string;
  collection_time_slots?: string[];
  availability_paused?: boolean;
  avatar_url?: string;
  hero_image_url?: string;
};

export default function CookSettingsPage() {
  const { user } = useCookAuth();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [area, setArea] = useState('');
  const [story, setStory] = useState('');
  const [collectionAddress, setCollectionAddress] = useState('');
  const [collectionInstructions, setCollectionInstructions] = useState('');
  const [collectionTimeSlots, setCollectionTimeSlots] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [profile, setProfile] = useState<CookProfile | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState<'avatar' | 'hero' | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

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
    setProfile(cook);
    setDisplayName(String(cook.display_name || ''));
    setArea(String(cook.area || ''));
    setStory(String(cook.story || ''));
    setCollectionAddress(String(cook.collection_address || ''));
    setCollectionInstructions(String(cook.collection_instructions || ''));
    setCollectionTimeSlots(normalizeCookCollectionTimeSlots(cook.collection_time_slots));
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
        collection_time_slots: collectionTimeSlots,
        availability_paused: paused,
      }),
    onSuccess: (res) => {
      setError('');
      setSaved(true);
      setProfile((res.cook || {}) as CookProfile);
      void qc.invalidateQueries({ queryKey: ['cook-profile'] });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e) => setError((e as Error).message || 'Could not save'),
  });

  const handleUpload = async (kind: 'avatar' | 'hero', file: File) => {
    const cookId = user?.id;
    if (!cookId || busy) return;
    setBusy(kind);
    setError('');
    try {
      const picked = await readWebImageFile(file);
      const uploaded = await uploadCookMediaFile(
        async (base64, objectName, ownerId, contentType) => {
          const res = await getUploadUrl(objectName, ownerId, {
            mode: 'server',
            fileData: base64,
            contentType,
          });
          return res as { key?: string; url?: string };
        },
        {
          cookId,
          kind,
          base64: picked.base64,
          mimeType: picked.mimeType,
          fileName: picked.fileName,
        }
      );
      const patch =
        kind === 'avatar' ? { avatar_url: uploaded.key } : { hero_image_url: uploaded.key };
      const res = await updateCookProfile(patch);
      setProfile((res.cook || {}) as CookProfile);
      void qc.invalidateQueries({ queryKey: ['cook-profile'] });
    } catch (e) {
      setError((e as Error).message || 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  if (profileQ.isLoading && !profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <SHCSkeletonList count={3} rowHeight={72} />
      </div>
    );
  }

  const name = profile?.display_name || user?.name || 'Chef';
  const avatar = getCookAvatarUrl(user?.id, name, profile?.avatar_url);
  const hero = getCookKitchenHeroUrl(user?.id, profile?.hero_image_url);

  return (
    <div className="max-w-lg mx-auto px-4 py-4" data-testid="cook-settings-screen">
      <Link href="/cook-portal/dashboard" className="text-sm font-bold text-primary mb-3 inline-block">
        ‹ Dashboard
      </Link>

      <GourmeatCookHeader
        title="Kitchen settings"
        subtitle="Photos, profile, collection details, pause orders"
        testID="cook-settings-hero"
      />

      <GourmeatCard className="mb-4">
        <p className="text-xs font-extrabold text-muted-foreground mb-2">Profile avatar</p>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--shc-border-brutal)] shrink-0">
            <Image src={avatar} alt="" fill className="object-cover" sizes="80px" />
          </div>
          <GourmeatPrimaryButton
            label={busy === 'avatar' ? 'Uploading…' : 'Upload avatar'}
            variant="outline"
            onClick={() => avatarInputRef.current?.click()}
            disabled={!!busy}
            testID="cook-settings-avatar-btn"
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload('avatar', file);
              e.target.value = '';
            }}
          />
        </div>
      </GourmeatCard>

      <GourmeatCard className="mb-4">
        <p className="text-xs font-extrabold text-muted-foreground mb-2">Kitchen hero</p>
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border-2 border-[var(--shc-border-brutal)] mb-3">
          <Image src={hero} alt="" fill className="object-cover" sizes="640px" />
        </div>
        <GourmeatPrimaryButton
          label={busy === 'hero' ? 'Uploading…' : 'Upload kitchen photo'}
          variant="outline"
          onClick={() => heroInputRef.current?.click()}
          disabled={!!busy}
          testID="cook-settings-hero-btn"
        />
        <input
          ref={heroInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload('hero', file);
            e.target.value = '';
          }}
        />
      </GourmeatCard>

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

      <GourmeatCard className="mb-4">
        <CookCollectionSlotEditorWeb value={collectionTimeSlots} onChange={setCollectionTimeSlots} />
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
