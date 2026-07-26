import { describe, expect, it } from 'vitest';
import { discoverHomeHeadline, discoverHomePromoCarousel } from './discover-home';

describe('discover-home', () => {
  it('personalizes headline when signed in', () => {
    expect(discoverHomeHeadline('Aisha Khan').headline).toBe('Hi, Aisha');
  });

  it('falls back to email local-part when name is missing', () => {
    expect(discoverHomeHeadline('', 'demo@shc.local').headline).toBe('Hi, Demo');
  });

  it('exposes image promo carousel slides', () => {
    const slides = discoverHomePromoCarousel();
    expect(slides.length).toBeGreaterThan(1);
    expect(slides[0]?.id).toBe('promo-tiffin');
    expect(slides[0]?.imageUrl).toContain('http');
  });

  it('falls back to guest headline', () => {
    expect(discoverHomeHeadline(null).headline).toBe('Hungry? Order & Eat.');
  });
});
