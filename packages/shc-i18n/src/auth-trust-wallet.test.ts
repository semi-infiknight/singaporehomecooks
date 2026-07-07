import { describe, expect, it } from 'vitest';
import { getTrustPageLayers, getTrustSafetyOnboardingCopy, getWalletProfileCopy, getWalletCardCopy } from './auth-trust-wallet';

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
    expect(copy.greeting('Alex')).toBe('👋 Alex');
    expect(copy.greeting()).toBe('👋 Guest');
    expect(copy.requestMeta(4, 8000)).toContain('4');
    expect(copy.requestStatusLabel('matched')).toBe('matched');
    expect(getWalletProfileCopy('zh-Hans').guest).toBe('访客');
  });
});

describe('getWalletCardCopy', () => {
  it('returns localized wallet card strings', () => {
    const copy = getWalletCardCopy('en');
    expect(copy.homeCredits).toBe('Home Credits');
    expect(copy.creditBadgeLine(40)).toContain('40');
    expect(copy.redeemableAtCheckout(40)).toContain('10');
    expect(getWalletCardCopy('zh-Hans').tierBadge('Silver')).toContain('Silver');
  });
});
