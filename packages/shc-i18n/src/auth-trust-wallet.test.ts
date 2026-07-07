import { describe, expect, it } from 'vitest';
import { getTrustPageLayers } from './auth-trust-wallet';

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
