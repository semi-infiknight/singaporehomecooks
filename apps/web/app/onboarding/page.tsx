'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BENTO_ACTION_IMAGES, PROMO_BANNER_IMAGES } from '@shc/utils';
import { markOnboardingSeen } from '../../lib/onboarding';
import { SHCButton } from '../components/SHCWebComponents';

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

/**
 * First-run carousel for new visitors (HomelyEats IA).
 * Not a sign-in wall — guest explore is first-class.
 */
export default function WebOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const exploreGuest = () => {
    markOnboardingSeen();
    router.replace('/');
  };

  const goSignIn = () => {
    markOnboardingSeen();
    router.push('/login');
  };

  const goNext = () => {
    if (isLast) {
      goSignIn();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <section
      className="max-w-lg mx-auto min-h-[100dvh] flex flex-col bg-background pb-8"
      data-testid="web-onboarding-screen"
    >
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-muted overflow-hidden">
        <Image src={current.imageUri} alt="" fill className="object-cover" sizes="640px" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute top-4 left-4 text-xs font-extrabold text-white tracking-wide">
          Singapore Home Cooks
        </p>
        {!isLast && (
          <button
            type="button"
            onClick={exploreGuest}
            className="absolute top-3 right-3 text-sm font-bold text-white bg-black/35 px-3 py-1.5 rounded-full"
            data-testid="onboarding-skip-btn"
          >
            Explore as guest
          </button>
        )}
      </div>

      <div className="flex-1 px-5 pt-5 flex flex-col">
        <div className="flex gap-1.5 mb-4" data-testid="onboarding-dots" role="progressbar">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        <h1 className="text-2xl font-black text-foreground tracking-tight mb-2">{current.title}</h1>
        <p className="text-sm font-semibold text-muted-foreground leading-relaxed mb-4">{current.subtitle}</p>

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

        <div className="mt-auto space-y-3 pt-4">
          <SHCButton
            type="button"
            size="lg"
            className="w-full min-h-[52px]"
            onClick={goNext}
            testID={isLast ? 'onboarding-signin-cta' : 'trust-onboarding-next-btn'}
          >
            {isLast ? 'Sign in / Create account' : 'Continue'}
          </SHCButton>

          {isLast ? (
            <>
              <button
                type="button"
                onClick={exploreGuest}
                className="w-full text-center text-sm font-bold text-muted-foreground underline py-2"
                data-testid="onboarding-guest-btn"
              >
                Continue as guest
              </button>
              <button
                type="button"
                onClick={exploreGuest}
                className="w-full text-center text-sm font-bold text-primary py-1"
                data-testid="trust-browse-cta"
              >
                Browse dishes first
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
