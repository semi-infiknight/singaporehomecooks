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
    <div className="flex gap-1.5 justify-center" data-testid={testID} role="progressbar">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 rounded-full transition-all ${
            i === active ? 'w-6 bg-[var(--shc-primary,#F87048)]' : 'w-2 bg-[#F0E4D8]'
          }`}
          aria-current={i === active ? 'step' : undefined}
        />
      ))}
    </div>
  );
}

export function SHCOnboardingProgressBarWeb({
  percent,
  testID = 'onboarding-progress-bar',
}: {
  percent: number;
  testID?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      className="h-2 w-full rounded-full bg-[#F0E4D8] overflow-hidden"
      data-testid={testID}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <div
        className="h-full rounded-full bg-[var(--shc-primary,#F87048)] transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
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
  progressPercent,
  onNext,
  onSkip,
  onGuest,
  onBack,
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
  chapterLabel,
  variant = 'default',
  heroCardUris,
  heroStats,
}: {
  imageUri: string;
  title: string;
  subtitle?: string;
  stepIndex: number;
  totalSteps: number;
  progressPercent?: number;
  onNext: () => void;
  onSkip?: () => void;
  onGuest?: () => void;
  onBack?: () => void;
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
  chapterLabel?: string;
  variant?: 'default' | 'hero';
  heroCardUris?: string[];
  heroStats?: readonly { value: string; label: string }[];
}) {
  const hasForm = Boolean(children);
  const percent =
    progressPercent ?? (totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0);
  const cards = (heroCardUris?.length ? heroCardUris : [imageUri, imageUri, imageUri]).slice(0, 3);
  const stats =
    heroStats?.length
      ? heroStats
      : [
          { value: '500+', label: 'Home cooks' },
          { value: 'HDB', label: 'Kitchens' },
          { value: 'PayNow', label: 'Payouts' },
        ];

  if (variant === 'hero') {
    return (
      <section
        className="relative max-w-lg mx-auto min-h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-[var(--shc-primary,#F87048)]"
        data-testid={screenTestID}
      >
        <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-white/15" />
        <div className="pointer-events-none absolute bottom-28 -left-16 h-44 w-44 rounded-full bg-black/10" />

        <div className="relative z-10 flex items-center justify-between px-5 pt-5">
          <span className="rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-extrabold text-white">
            Singapore Home Cooks
          </span>
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-extrabold text-white"
              data-testid={skipTestID}
            >
              {skipLabel}
            </button>
          ) : null}
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="relative mb-8 h-40 w-64">
            {cards.map((uri, i) => {
              const offsets = [
                { left: 8, rotate: '-11deg', z: 1, top: 14 },
                { left: 78, rotate: '2deg', z: 3, top: 0 },
                { left: 148, rotate: '11deg', z: 2, top: 16 },
              ][i];
              return (
                <div
                  key={`${uri}-${i}`}
                  className="absolute h-[142px] w-[112px] overflow-hidden rounded-2xl border-[3px] border-white/55 bg-white shadow-lg"
                  style={{
                    left: offsets.left,
                    top: offsets.top,
                    zIndex: offsets.z,
                    transform: `rotate(${offsets.rotate})`,
                  }}
                >
                  <Image src={uri} alt="" fill className="object-cover" sizes="120px" />
                </div>
              );
            })}
          </div>
          <h1 className="mb-2 text-[1.85rem] font-black leading-tight tracking-tight text-white">{title}</h1>
          {subtitle ? (
            <p className="mb-6 max-w-sm text-base font-semibold leading-relaxed text-white/90">{subtitle}</p>
          ) : null}
          <div className="flex w-full max-w-sm items-center rounded-2xl border border-white/30 bg-white/15 px-3 py-3">
            {stats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 ? <div className="mx-1 h-7 w-px bg-white/30" /> : null}
                <div className="flex-1 text-center">
                  <p className="text-[15px] font-black text-white">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-white/80">{stat.label}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-5 pb-8 pt-3">
          <button
            type="button"
            onClick={onNext}
            disabled={disabled || loading}
            data-testid={nextTestID}
            className="w-full min-h-[56px] rounded-2xl bg-white text-[17px] font-black text-[var(--shc-primary,#F87048)] shadow-md disabled:opacity-50"
          >
            {loading ? 'Please wait…' : nextLabel}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="max-w-lg mx-auto min-h-[100dvh] max-h-[100dvh] flex flex-col bg-[#FFFBF7] overflow-hidden"
      data-testid={screenTestID}
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {onBack || (onSecondary && secondaryLabel) ? (
          <button
            type="button"
            onClick={onBack || onSecondary}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-lg font-extrabold shadow-sm"
            data-testid={secondaryTestID}
            aria-label="Back"
          >
            ←
          </button>
        ) : (
          <div className="w-[42px] shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <SHCOnboardingProgressBarWeb percent={percent} />
        </div>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="min-w-[42px] shrink-0 text-right text-sm font-extrabold text-[var(--shc-primary,#F87048)]"
            data-testid={skipTestID}
          >
            {skipLabel}
          </button>
        ) : (
          <div className="w-[42px] shrink-0" />
        )}
      </div>

      {imageUri && !hasForm ? (
        <div className="relative mx-4 mt-1 h-44 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-48">
          <Image src={imageUri} alt="" fill className="object-cover" sizes="640px" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFFBF7]/80 via-transparent to-transparent" />
        </div>
      ) : imageUri && hasForm ? (
        <div className="relative mx-4 mt-1 h-28 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-32">
          <Image src={imageUri} alt="" fill className="object-cover" sizes="640px" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFFBF7]/70 via-transparent to-transparent" />
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5">
        <h1 className="mb-2 text-[1.75rem] font-black tracking-tight text-foreground leading-tight">{title}</h1>
        {subtitle ? (
          <p className="mb-4 text-base font-medium leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
        {children}
      </div>

      <div className="shrink-0 space-y-2 border-t border-black/5 bg-[#FFFBF7]/98 px-5 pb-8 pt-3">
        <SHCButton
          type="button"
          size="lg"
          className="w-full min-h-[56px] rounded-full font-black shadow-md"
          onClick={onNext}
          disabled={disabled || loading}
          testID={nextTestID}
        >
          {loading ? 'Please wait…' : nextLabel}
        </SHCButton>
        {onSecondary && secondaryLabel && !onBack ? (
          <button
            type="button"
            onClick={onSecondary}
            className="w-full min-h-[48px] rounded-2xl border-2 border-[var(--shc-primary,#F87048)] text-sm font-extrabold text-[var(--shc-primary,#F87048)] bg-white"
            data-testid={secondaryTestID}
          >
            {secondaryLabel}
          </button>
        ) : null}
        {onGuest ? (
          <button
            type="button"
            onClick={onGuest}
            className="w-full py-2 text-center text-sm font-bold text-muted-foreground underline"
            data-testid={guestTestID}
          >
            {guestLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
