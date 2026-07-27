'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BENTO_ACTION_IMAGES, PROMO_BANNER_IMAGES, normalizeCookAreaInput } from '@shc/utils';
import { markCookOnboardingSeen } from '../../../lib/onboarding';
import { updateCookProfile } from '../../../lib/cook-api-client';
import { SHCButton, CookAreaPickerWeb } from '../../components/SHCWebComponents';

const STEPS = ['welcome', 'story', 'kitchen', 'consent'] as const;
type Step = (typeof STEPS)[number];

const STEP_META: Record<
  Step,
  { imageUri: string; title: string; subtitle: string; nextLabel: string; skippable?: boolean }
> = {
  welcome: {
    imageUri: BENTO_ACTION_IMAGES.listings,
    title: 'Welcome, home cook',
    subtitle: 'List heritage dishes from your HDB kitchen — customers discover you on web and mobile.',
    nextLabel: 'Get started',
  },
  story: {
    imageUri: PROMO_BANNER_IMAGES.family,
    title: 'Your heritage story',
    subtitle: 'Tell customers what makes your kitchen special. This appears on your cook profile.',
    nextLabel: 'Continue',
    skippable: true,
  },
  kitchen: {
    imageUri: BENTO_ACTION_IMAGES.compliance,
    title: 'Kitchen & collection',
    subtitle: 'Your area, HDB block address, and pickup instructions — shared after you accept an order.',
    nextLabel: 'Continue',
    skippable: true,
  },
  consent: {
    imageUri: BENTO_ACTION_IMAGES.orders,
    title: 'Safety & PDPA',
    subtitle:
      'Home kitchens must disclose allergens on each dish. Ops may review compliance before featured placement.',
    nextLabel: 'Go to dashboard',
  },
};

/**
 * Cook kitchen setup — same flow as mobile-cook `/(shared)/onboarding`.
 * Gated after sign-in via CookLoginGate when `shc_cook_onboarding_seen_v1` is unset.
 */
export default function CookPortalOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [story, setStory] = useState('');
  const [area, setArea] = useState('');
  const [collectionAddress, setCollectionAddress] = useState('');
  const [collectionInstructions, setCollectionInstructions] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const stepIndex = STEPS.indexOf(step);
  const meta = STEP_META[step];
  const isLast = step === 'consent';

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const finish = async () => {
    if (!pdpaConsent) {
      setError('Please acknowledge PDPA and kitchen safety before continuing.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await updateCookProfile({
        story: story.trim() || undefined,
        area: normalizeCookAreaInput(area) || undefined,
        collection_address: collectionAddress.trim() || undefined,
        collection_instructions: collectionInstructions.trim() || undefined,
        pdpa_consent: true,
      });
      markCookOnboardingSeen();
      router.replace('/cook-portal/dashboard');
    } catch (e) {
      setError((e as Error).message || 'Could not save profile');
    } finally {
      setBusy(false);
    }
  };

  const handlePrimary = () => {
    if (isLast) void finish();
    else goNext();
  };

  return (
    <section
      className="max-w-lg mx-auto min-h-[100dvh] flex flex-col bg-background pb-8"
      data-testid="cook-onboarding-screen"
    >
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-muted overflow-hidden">
        <Image src={meta.imageUri} alt="" fill className="object-cover" sizes="640px" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute top-4 left-4 text-xs font-extrabold text-white tracking-wide">
          Singapore Home Cooks · Cook
        </p>
        {meta.skippable ? (
          <button
            type="button"
            onClick={goNext}
            className="absolute top-3 right-3 text-sm font-bold text-white bg-black/35 px-3 py-1.5 rounded-full"
            data-testid="cook-onboarding-skip-btn"
          >
            Skip
          </button>
        ) : null}
      </div>

      <div className="flex-1 px-5 pt-5 flex flex-col">
        <div className="flex gap-1.5 mb-4" data-testid="cook-onboarding-dots" role="progressbar">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        <h1 className="text-2xl font-black text-foreground tracking-tight mb-2">{meta.title}</h1>
        <p className="text-sm font-semibold text-muted-foreground leading-relaxed mb-4">{meta.subtitle}</p>

        {step === 'story' && (
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="e.g. Peranakan recipes from my mother’s kitchen in Katong…"
            rows={5}
            className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-3 text-sm font-semibold mb-4"
            data-testid="cook-onboarding-story-input"
          />
        )}

        {step === 'kitchen' && (
          <div className="space-y-3 mb-4">
            <CookAreaPickerWeb
              value={area}
              onChange={setArea}
              testID="cook-onboarding-area-input"
            />
            <div>
              <p className="text-xs font-extrabold text-muted-foreground mb-1">Collection address</p>
              <input
                value={collectionAddress}
                onChange={(e) => setCollectionAddress(e.target.value)}
                placeholder="e.g. Blk 456 Tampines Street 42, #05-123"
                className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-3 text-sm font-semibold"
                data-testid="cook-onboarding-address-input"
              />
            </div>
            <div>
              <p className="text-xs font-extrabold text-muted-foreground mb-1">Collection instructions</p>
              <textarea
                value={collectionInstructions}
                onChange={(e) => setCollectionInstructions(e.target.value)}
                placeholder="e.g. Lift lobby B — WhatsApp when you arrive"
                rows={4}
                className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-3 text-sm font-semibold"
                data-testid="cook-onboarding-collection-input"
              />
            </div>
          </div>
        )}

        {step === 'consent' && (
          <button
            type="button"
            onClick={() => setPdpaConsent((v) => !v)}
            className="flex items-start gap-3 text-left mb-4"
            data-testid="cook-onboarding-pdpa-checkbox"
          >
            <span
              className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-black ${
                pdpaConsent
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-[var(--shc-border-brutal)] bg-card'
              }`}
            >
              {pdpaConsent ? '✓' : ''}
            </span>
            <span className="text-sm font-semibold text-foreground leading-snug">
              I agree to PDPA data handling and accurate allergen disclosure on every listing.
            </span>
          </button>
        )}

        {error ? <p className="text-sm font-bold text-destructive mb-3">{error}</p> : null}

        <div className="mt-auto space-y-3 pt-4">
          <SHCButton
            type="button"
            size="lg"
            className="w-full min-h-[52px]"
            onClick={handlePrimary}
            disabled={isLast && (!pdpaConsent || busy)}
            testID={isLast ? 'cook-onboarding-finish-btn' : 'cook-onboarding-next-btn'}
          >
            {isLast ? (busy ? 'Saving…' : meta.nextLabel) : meta.nextLabel}
          </SHCButton>
        </div>
      </div>
    </section>
  );
}
