'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { BENTO_ACTION_IMAGES, getDishImageUrl } from '@shc/utils';
import { generateListingImage, getAiImageStatus, getPhotoTips } from '../../lib/api-client';
import {
  SHCButton,
  SHCMetaBadge,
  useSHCTrayWeb,
  SHCTrayActionWeb,
  PhotoTipsTrayContentWeb,
} from '../components/SHCWebComponents';

type AiImageStatus = {
  configured?: boolean;
  generate_available?: boolean;
  generate_unavailable_reason?: string | null;
  cuisine_presets?: string[];
  model?: string;
};

export function ListingPhotoPanelWeb({
  dishName,
  cuisine,
  imageUrl,
  onImageUrl,
}: {
  dishName: string;
  cuisine: string;
  imageUrl: string | null;
  onImageUrl: (url: string) => void;
}) {
  const { openTray, dismiss } = useSHCTrayWeb();
  const [aiPhotoBusy, setAiPhotoBusy] = useState(false);
  const [aiPhotoNote, setAiPhotoNote] = useState<string | null>(null);
  const [aiImageStatus, setAiImageStatus] = useState<AiImageStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAiImageStatus()
      .then((st) => {
        if (!cancelled) setAiImageStatus(st || {});
      })
      .catch(() => {
        if (!cancelled) {
          setAiImageStatus({ generate_available: false, generate_unavailable_reason: 'Could not reach AI status' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const generateAvailable = aiImageStatus?.generate_available === true || aiImageStatus?.configured === true;
  const generateBlockedReason =
    aiImageStatus?.generate_unavailable_reason ||
    (!generateAvailable && aiImageStatus ? 'AI generate offline — upload a real kitchen photo instead' : null);
  const previewImage = imageUrl || getDishImageUrl({ name: dishName, cuisine });

  const showErrorTray = useCallback(
    (title: string, message: string) => {
      openTray(
        { id: 'listing-error', title, height: 'compact' },
        <SHCTrayActionWeb message={message} primaryLabel="OK" onPrimary={dismiss} testID="listing-error-tray" />
      );
    },
    [dismiss, openTray]
  );

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

  const runGenerateAi = async () => {
    if (!generateAvailable) {
      showErrorTray('AI generate offline', generateBlockedReason || 'Upload a real kitchen photo instead.');
      return;
    }
    if (!dishName.trim()) {
      showErrorTray('Dish name needed', 'Enter a dish name before generating an AI plate.');
      return;
    }
    setAiPhotoBusy(true);
    setAiPhotoNote(null);
    try {
      const res = await generateListingImage({
        mode: 'generate',
        dish_name: dishName,
        cuisine,
      });
      const url = res.webp_url || res.image_url || res.jpeg_url;
      if (!url) throw new Error('No image URL returned');
      onImageUrl(url);
      setAiPhotoNote(
        `Illustrative AI plate (${res.model || res.source || 'flux'}) — real dish may vary. Prefer a kitchen photo when you can.`
      );
    } catch (e) {
      showErrorTray('AI generate failed', (e as Error).message || 'Could not create photo. Try upload instead.');
    } finally {
      setAiPhotoBusy(false);
    }
  };

  const onPolishPhoto = async (file: File | null, label: 'upload' | 'brighten') => {
    if (!file) return;
    setAiPhotoBusy(true);
    setAiPhotoNote(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await generateListingImage({
        mode: 'enhance',
        dish_name: dishName || 'Dish',
        cuisine,
        image_base64: dataUrl,
        enhance_style: 'polish',
        ai_restyle: false,
      });
      const url = res.webp_url || res.image_url || res.jpeg_url;
      if (!url) throw new Error('Photo processing failed');
      onImageUrl(url);
      setAiPhotoNote(
        label === 'brighten'
          ? 'Brightened your photo (lighting/contrast only — still your kitchen shot)'
          : 'Kitchen photo uploaded & optimized for listing cards'
      );
    } catch (e) {
      showErrorTray(label === 'brighten' ? 'Brighten failed' : 'Upload failed', (e as Error).message || 'Could not process photo');
    } finally {
      setAiPhotoBusy(false);
    }
  };

  const openPhotoTipsTray = async () => {
    const tipsRes = await getPhotoTips();
    const tipList = (tipsRes as { tips?: string[] }).tips || [
      'Natural light from a window — avoid harsh overhead kitchen fluorescents.',
      'Shoot at 45° with a clean plate rim visible — families trust tidy presentation.',
      'Include a heritage prop (e.g. tiffin carrier, batik cloth) for Singapore story.',
    ];
    openTray({ id: 'photo-tips', title: 'Photo tips', height: 'tall' }, <PhotoTipsTrayContentWeb tips={tipList} />);
  };

  return (
    <>
      <div className="rounded-xl border-2 border-[var(--shc-border-brutal)] p-3 space-y-2" data-testid="listing-photo-panel">
        <p className="text-sm font-extrabold">Dish photo</p>
        <p className="text-xs text-muted-foreground">
          <strong>Kitchen photo recommended.</strong> AI plate is illustrative only — customers should see the real dish when you can.
        </p>
        {previewImage ? (
          <div className="relative h-36 w-full rounded-lg overflow-hidden border border-border">
            <Image src={previewImage} alt="" fill className="object-cover" sizes="400px" unoptimized />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <label className={`cursor-pointer ${aiPhotoBusy ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="inline-flex rounded-xl border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-mint)] px-3 py-2 text-xs font-extrabold">
              Upload kitchen photo
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              data-testid="listing-photo-upload"
              disabled={aiPhotoBusy}
              onChange={(e) => void onPolishPhoto(e.target.files?.[0] || null, 'upload')}
            />
          </label>
          <label className={`cursor-pointer ${aiPhotoBusy ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="inline-flex rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2 text-xs font-extrabold">
              Brighten my photo
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              data-testid="listing-photo-brighten"
              disabled={aiPhotoBusy}
              onChange={(e) => void onPolishPhoto(e.target.files?.[0] || null, 'brighten')}
            />
          </label>
          <SHCButton
            size="sm"
            variant="outline"
            disabled={aiPhotoBusy || !dishName.trim() || !generateAvailable}
            onClick={() => void runGenerateAi()}
            testID="listing-photo-generate"
          >
            {aiPhotoBusy ? 'Working…' : generateAvailable ? 'Generate AI plate' : 'AI offline'}
          </SHCButton>
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground leading-snug" data-testid="listing-photo-help">
          <span className="font-extrabold">Upload</span> = your shot, optimized ·{' '}
          <span className="font-extrabold">Brighten</span> = lighting/contrast only (still your photo) ·{' '}
          <span className="font-extrabold">Generate AI</span> = new illustrative plate from dish name + cuisine
          {generateAvailable ? ` (${aiImageStatus?.model?.split('/').pop() || 'FLUX'})` : ''}
        </p>
        {!generateAvailable && generateBlockedReason ? (
          <p
            className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5"
            data-testid="listing-photo-ai-offline"
          >
            {generateBlockedReason}
          </p>
        ) : null}
        {aiPhotoNote ? (
          <p className="text-[11px] font-semibold text-muted-foreground" data-testid="listing-photo-note">
            {aiPhotoNote}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => void openPhotoTipsTray()}
        className="flex items-center gap-2 w-full rounded-xl border border-border p-3 text-left"
        data-testid="photo-tips-btn"
      >
        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
          <Image src={BENTO_ACTION_IMAGES.listings} alt="" fill className="object-cover" sizes="48px" />
        </div>
        <SHCMetaBadge kind="photo_tips">📸 Photo tips</SHCMetaBadge>
      </button>
    </>
  );
}
