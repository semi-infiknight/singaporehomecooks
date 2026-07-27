import { describe, expect, it } from 'vitest';
import {
  defaultDiscoverPromoConfigs,
  discoverHomePromoCarousel,
  discoverPromoConfigsToSlides,
  normalizeDiscoverPromoConfigs,
} from './discover-promos';

describe('discover-promos', () => {
  it('builds default configs from DEFAULT_PROMOS', () => {
    const configs = defaultDiscoverPromoConfigs();
    expect(configs.length).toBeGreaterThan(1);
    expect(configs[0]?.id).toBe('promo-tiffin');
    expect(configs[0]?.image_url).toContain('http');
  });

  it('maps configs to client slides', () => {
    const slides = discoverPromoConfigsToSlides(defaultDiscoverPromoConfigs());
    expect(slides[0]?.imageUrl).toContain('http');
    expect(slides[0]?.mobileRoute).toContain('tiffin');
  });

  it('normalizes admin payload rows', () => {
    const rows = normalizeDiscoverPromoConfigs([
      {
        id: 'promo-custom',
        title: 'Custom',
        subtitle: 'Test slide',
        imageUrl: 'https://example.com/banner.jpg',
        mobileRoute: '/(customer)/cart',
        webRoute: '/cart',
        enabled: true,
        sort_order: 5,
      },
    ]);
    expect(rows[0]?.image_url).toBe('https://example.com/banner.jpg');
    expect(rows[0]?.mobile_route).toBe('/(customer)/cart');
  });

  it('falls back to defaults when raw is empty', () => {
    expect(normalizeDiscoverPromoConfigs([])[0]?.id).toBe('promo-tiffin');
  });

  it('exposes carousel via discoverHomePromoCarousel', () => {
    expect(discoverHomePromoCarousel().length).toBeGreaterThan(1);
  });
});
