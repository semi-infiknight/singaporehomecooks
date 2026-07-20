'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BENTO_ACTION_IMAGES, PROMO_BANNER_IMAGES } from '@shc/utils';
import { markOnboardingSeen } from '../../lib/onboarding';
import { SHCOnboardingFlowScreenWeb } from '../components/SHCOnboardingWeb';

type Step = {
  imageUri: string;
  title: string;
  subtitle: string;
  bullets: string[];
};

const STEPS: Step[] = [
  {
    imageUri: PROMO_BANNER_IMAGES.family,
    title: 'Welcome home',
    subtitle:
      'Singapore Home Cooks brings auntie-and-uncle kitchens to your collection point — heritage recipes, HDB warmth, no stranger delivery.',
    bullets: ['Real home cooks, real stories', 'Occasion spreads & everyday meals', 'Collection from HDB kitchens'],
  },
  {
    imageUri: PROMO_BANNER_IMAGES.hariRaya,
    title: 'Tiffin & occasions',
    subtitle:
      'Subscribe to weekly tiffin from one kitchen, or order one-off dishes for Hari Raya, CNY, birthdays and more.',
    bullets: ['2 · 3 · 4 meals a week', 'One kitchen you trust', 'Plan ahead for big occasions'],
  },
  {
    imageUri: BENTO_ACTION_IMAGES.compliance,
    title: 'Cooked with care',
    subtitle: 'See the kitchen story, allergens, and clear receipts before you pay — trust you can feel.',
    bullets: ['Kitchen transparency', 'Tier 1 allergen acks', 'Safe HDB collection slots'],
  },
  {
    imageUri: PROMO_BANNER_IMAGES.newCook,
    title: 'Browse freely',
    subtitle:
      'Explore kitchens and dishes as a guest. Sign in when you’re ready to subscribe or checkout — no pressure.',
    bullets: ['Continue as guest anytime', 'Sign in to subscribe & order', 'Your pace, your table'],
  },
];

function WebOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = (() => {
    const next = searchParams.get('next');
    return next?.startsWith('/') ? next : '/';
  })();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const finish = (href: string) => {
    markOnboardingSeen();
    router.replace(href);
  };

  const exploreGuest = () => finish(nextPath);
  const goSignIn = () => {
    markOnboardingSeen();
    router.push(`/login?next=${encodeURIComponent(nextPath)}`);
  };

  const goNext = () => {
    if (isLast) {
      goSignIn();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <SHCOnboardingFlowScreenWeb
      imageUri={current.imageUri}
      title={current.title}
      subtitle={current.subtitle}
      stepIndex={step}
      totalSteps={STEPS.length}
      onNext={goNext}
      onSkip={!isLast ? exploreGuest : undefined}
      skipLabel="Explore as guest"
      onGuest={isLast ? exploreGuest : undefined}
      guestLabel="Continue as guest"
      nextLabel={isLast ? 'Sign in / Create account' : 'Continue'}
      nextTestID={isLast ? 'onboarding-signin-cta' : 'trust-onboarding-next-btn'}
      guestTestID="onboarding-guest-btn"
      skipTestID="onboarding-skip-btn"
      secondaryLabel={isLast ? 'Browse dishes first' : undefined}
      onSecondary={isLast ? exploreGuest : undefined}
      secondaryTestID="trust-browse-cta"
      screenTestID="trust-safety-screen"
    >
      <ul className="space-y-2.5 mb-6" data-testid="onboarding-value-bullets">
        {current.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <span className="shrink-0 w-5 h-5 rounded-full bg-[#FFE8DE] text-primary text-xs font-black flex items-center justify-center">
              ✓
            </span>
            <span className="text-sm font-semibold text-foreground leading-snug">{b}</span>
          </li>
        ))}
      </ul>
    </SHCOnboardingFlowScreenWeb>
  );
}

export default function WebOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#FFFBF7]" data-testid="trust-safety-screen" />}>
      <WebOnboardingContent />
    </Suspense>
  );
}
