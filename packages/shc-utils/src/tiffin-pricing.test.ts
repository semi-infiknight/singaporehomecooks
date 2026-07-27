import { describe, expect, it } from 'vitest';
import {
  defaultTiffinPricePerMeal,
  normalizeTiffinKitchenPricing,
  resolveTiffinPricePerMeal,
  tiffinKitchenPriceRange,
  tiffinPriceResolver,
  tiffinWeeklySubtotal,
} from './tiffin-pricing';

describe('tiffin-pricing', () => {
  it('uses platform defaults when kitchen pricing missing', () => {
    expect(defaultTiffinPricePerMeal(2)).toBe(12);
    expect(resolveTiffinPricePerMeal(4, null)).toBe(10);
  });

  it('uses kitchen tier overrides', () => {
    const pricing = { '2': 14, '3': 13, '4': 12 };
    expect(resolveTiffinPricePerMeal(3, pricing)).toBe(13);
    expect(tiffinWeeklySubtotal(3, 1, pricing)).toBe(39);
  });

  it('normalizes invalid pricing rows', () => {
    expect(normalizeTiffinKitchenPricing({ '2': 9, '3': 0, '4': 500 })).toEqual({
      '2': 9,
      '3': 11,
      '4': 10,
    });
  });

  it('builds browse price range from tiers', () => {
    const range = tiffinKitchenPriceRange({ '2': 15, '3': 14, '4': 12 });
    expect(range).toEqual({ from: 12, to: 15 });
  });

  it('price resolver matches resolve helper', () => {
    const fn = tiffinPriceResolver({ '2': 9 });
    expect(fn(2)).toBe(9);
    expect(fn(3)).toBe(11);
  });
});
