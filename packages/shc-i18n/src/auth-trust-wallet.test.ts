import { describe, expect, it } from 'vitest';
import { getTrustPageLayers, getTrustSafetyOnboardingCopy, getWalletProfileCopy } from './auth-trust-wallet';

describe('getTrustPageLayers', () => {
  it('returns five localized trust layers in English', () => {
    const layers = getTrustPageLayers('en');
    expect(layers).toHaveLength(5);
    expect(layers[0].title).toBe('Kitchen transparency');
    expect(layers[4].key).toBe('collection');
  });

  it('returns Mandarin trust layer titles', () => {
    const layers = getTrustPageLayers('zh-Hans');
    expect(layers[0].title).toBe('厨房透明');
    expect(layers[2].title).toBe('清晰收据');
  });
});

describe('getTrustSafetyOnboardingCopy', () => {
  it('returns localized onboarding trust screen copy', () => {
    const copy = getTrustSafetyOnboardingCopy('en');
    expect(copy.title).toBe('Trust & Safety');
    expect(copy.layers).toHaveLength(5);
    expect(copy.browseCta).toBe('Browse dishes');
    expect(getTrustSafetyOnboardingCopy('zh-Hans').browseCta).toBe('浏览菜品');
  });
});

describe('getWalletProfileCopy', () => {
  it('returns localized profile header copy', () => {
    const copy = getWalletProfileCopy('en');
    expect(copy.guest).toBe('Guest');
    expect(copy.subtitle('Gold')).toContain('Gold');
    expect(getWalletProfileCopy('zh-Hans').guest).toBe('访客');
  });
});
