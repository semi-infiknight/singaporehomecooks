import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ONBOARDING_UX = resolve(__dirname, 'onboarding-ux.tsx');
const COOK_ONBOARDING = resolve(__dirname, '../../../apps/mobile-cook/app/(shared)/onboarding/index.tsx');
const CUSTOMER_ONBOARDING = resolve(__dirname, '../../../apps/mobile-customer/app/(shared)/onboarding/index.tsx');

describe('HomelyEats-style onboarding shell', () => {
  it('exports hero + dots + sticky CTA + guest explore', () => {
    const src = readFileSync(ONBOARDING_UX, 'utf8');
    expect(src).toContain('export function SHCOnboardingFlowScreen');
    expect(src).toContain('export function SHCOnboardingDots');
    expect(src).toContain('HERO_RATIO');
    expect(src).toMatch(/<Image[\s\S]*?resizeMode="cover"/);
    expect(src).toContain('SHCOnboardingDots');
    expect(src).toContain('onGuest');
    expect(src).toContain('Continue as guest');
    expect(src).toContain('ctaText');
  });

  it('cook onboarding uses flow screen and preserves Maestro testIDs', () => {
    const src = readFileSync(COOK_ONBOARDING, 'utf8');
    expect(src).toContain('SHCOnboardingFlowScreen');
    expect(src).toContain('screenTestID="cook-onboarding-screen"');
    expect(src).toContain('cook-onboarding-next-btn');
    expect(src).toContain('cook-onboarding-finish-btn');
    expect(src).toContain('cook-onboarding-story-input');
    expect(src).toContain('cook-onboarding-collection-input');
    expect(src).toContain('cook-onboarding-pdpa-checkbox');
    expect(src).toContain('Your heritage story');
    expect(src).toContain('Collection instructions');
  });

  it('customer onboarding is warm carousel with guest explore (HomelyEats)', () => {
    const src = readFileSync(CUSTOMER_ONBOARDING, 'utf8');
    expect(src).toContain('SHCOnboardingFlowScreen');
    expect(src).toContain('screenTestID="trust-safety-screen"');
    expect(src).toContain('onboarding-guest-btn');
    expect(src).toContain('Continue as guest');
    expect(src).toContain('Welcome home');
    expect(src).toContain('trust-browse-cta');
    expect(src).toContain('onboarding-signin-cta');
  });
});