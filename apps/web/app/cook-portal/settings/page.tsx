'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCookAvatarUrl, getCookKitchenHeroUrl } from '@shc/utils';
import { getCookProfile, updateCookProfile } from '../../../lib/cook-api-client';
import { uploadCookMediaFile, readWebImageFile } from '../../../lib/cook-media-upload';
import { getUploadUrl } from '../../../lib/cook-api-client';
import { useCookAuth } from '../../../lib/useCookAuth';
import { GourmeatScreenHeader, GourmeatCard, GourmeatPrimaryButton, SHCSkeletonList } from '../../components/SHCWebComponents';

type CookProfile = {
  display_name?: string;
  avatar_url?: string;
  hero_image_url?: string;
};

export default function CookSettingsPage() {
  const { user } = useCookAuth();
  const [profile, setProfile] = useState<CookProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'avatar' | 'hero' | null>(null);
  const [error, setError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCookProfile();
        if (!cancelled) setProfile((res.cook || {}) as CookProfile);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'Could not load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        kind === 'avatar'
          ? { avatar_url: uploaded.key }
          : { hero_image_url: uploaded.key };
      const res = await updateCookProfile(patch);
      setProfile((res.cook || {}) as CookProfile);
    } catch (e) {
      setError((e as Error).message || 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <SHCSkeletonList count={3} rowHeight={72} />
      </div>
    );
  }

  const name = profile?.display_name || user?.name || 'Chef';
  const avatar = getCookAvatarUrl(user?.id, name, profile?.avatar_url);
  const hero = getCookKitchenHeroUrl(user?.id, profile?.hero_image_url);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-settings-screen">
      <GourmeatScreenHeader
        title="Profile photos"
        subtitle="Your avatar and kitchen hero appear on customer browse and kitchen pages."
        backHref="/cook-portal/dashboard"
        backLabel="← Dashboard"
      />

      {error ? <p className="text-sm font-bold text-destructive mb-4">{error}</p> : null}

      <GourmeatCard className="mb-4">
        <p className="text-xs font-extrabold text-muted-foreground mb-2">Profile avatar</p>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--shc-border-brutal)] shrink-0">
            <Image src={avatar} alt="" fill className="object-cover" sizes="80px" />
          </div>
          <div>
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

      <p className="text-xs font-semibold text-muted-foreground">
        Tip: use a warm kitchen or portrait photo — not a dish close-up for the hero banner.
      </p>
      <p className="text-xs font-semibold text-muted-foreground mt-3">
        <Link href="/cook-portal/onboarding" className="text-primary underline">
          Edit story & collection details
        </Link>
      </p>
    </div>
  );
}
