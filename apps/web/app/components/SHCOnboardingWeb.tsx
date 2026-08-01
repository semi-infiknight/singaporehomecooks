'use client';

import React from 'react';
import Image from 'next/image';
import { SHCButton } from './SHCWebComponents';

export function SHCOnboardingDotsWeb({
  total,
  active,
  testID = 'onboarding-dots',
}: {
  total: number;
  active: number;
  testID?: string;
}) {
  return (
    <div className="flex gap-1.5 mb-4 justify-center" data-testid={testID} role="progressbar">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === active ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
          }`}
          aria-current={i === active ? 'step' : undefined}
        />
      ))}
    </div>
  );
}

/** Web mirror of @shc/ui SHCOnboardingFlowScreen — same testIDs for Maestro parity. */
export function SHCOnboardingFlowScreenWeb({
  imageUri,
  title,
  subtitle,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
  onGuest,
  nextLabel = 'Continue',
  guestLabel = 'Continue as guest',
  skipLabel = 'Explore as guest',
  nextTestID = 'onboarding-next-btn',
  skipTestID = 'onboarding-skip-btn',
  guestTestID = 'onboarding-guest-btn',
  secondaryLabel,
  onSecondary,
  secondaryTestID = 'onboarding-secondary-btn',
  disabled,
  loading,
  children,
  screenTestID = 'trust-safety-screen',
}: {
  imageUri: string;
  title: string;
  subtitle?: string;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip?: () => void;
  onGuest?: () => void;
  nextLabel?: string;
  guestLabel?: string;
  skipLabel?: string;
  nextTestID?: string;
  skipTestID?: string;
  guestTestID?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryTestID?: string;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  screenTestID?: string;
}) {
  const hasForm = Boolean(children);
  return (
    <section
      className="max-w-lg mx-auto min-h-[100dvh] max-h-[100dvh] flex flex-col bg-[#FFFBF7] overflow-hidden"
      data-testid={screenTestID}
    >
      <div
        className={`relative w-full shrink-0 bg-muted overflow-hidden ${
          hasForm ? 'h-40 sm:h-44' : 'aspect-[4/3] sm:aspect-[16/9]'
        }`}
      >
        <Image src={imageUri} alt="" fill className="object-cover" sizes="640px" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFFBF7]/90 via-black/20 to-transparent" />
        <p className="absolute top-4 left-4 text-xs font-extrabold text-primary tracking-wide bg-white/90 px-3 py-1.5 rounded-full">
          Singapore Home Cooks
        </p>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="absolute top-3 right-3 text-sm font-bold text-foreground bg-white/90 px-3 py-1.5 rounded-full"
            data-testid={skipTestID}
          >
            {skipLabel}
          </button>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5">
        <SHCOnboardingDotsWeb total={totalSteps} active={stepIndex} />
        <h1 className="text-2xl font-black text-foreground tracking-tight mb-2">{title}</h1>
        {subtitle ? <p className="text-sm font-semibold text-muted-foreground leading-relaxed mb-4">{subtitle}</p> : null}
        {children}
      </div>

      <div className="shrink-0 px-5 pt-3 pb-8 space-y-3 border-t border-[#F0E6DC] bg-[#FFFBF7]">
        <SHCButton
          type="button"
          size="lg"
          className="w-full min-h-[52px]"
          onClick={onNext}
          disabled={disabled || loading}
          testID={nextTestID}
        >
          {loading ? 'Please wait…' : nextLabel}
        </SHCButton>
        {onSecondary && secondaryLabel ? (
          <button
            type="button"
            onClick={onSecondary}
            className="w-full min-h-[48px] rounded-xl border-2 border-primary text-sm font-bold text-primary"
            data-testid={secondaryTestID}
          >
            {secondaryLabel}
          </button>
        ) : null}
        {onGuest ? (
          <button
            type="button"
            onClick={onGuest}
            className="w-full text-center text-sm font-bold text-muted-foreground underline py-2"
            data-testid={guestTestID}
          >
            {guestLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
