import { describe, expect, it } from 'vitest';
import {
  subscribeFunnelSteps,
  tiffinPlanBestValueMeals,
  tiffinPlanFeaturesForTier,
  tiffinPlanSavingsLabel,
  tiffinPlanStrikethroughPrice,
} from './subscribe-funnel';

describe('subscribeFunnelSteps', () => {
  it('returns three funnel steps', () => {
    expect(subscribeFunnelSteps().map((s) => s.id)).toEqual(['plan', 'pay', 'pick']);
  });
});

describe('tiffinPlanFeaturesForTier', () => {
  it('includes volume discount only for 3+ meals', () => {
    const two = tiffinPlanFeaturesForTier(2).find((f) => f.id === 'volume');
    const four = tiffinPlanFeaturesForTier(4).find((f) => f.id === 'volume');
    expect(two?.included).toBe(false);
    expect(four?.included).toBe(true);
  });
});

describe('tiffinPlanBestValueMeals', () => {
  it('picks highest meals option', () => {
    expect(tiffinPlanBestValueMeals([2, 3, 4])).toBe(4);
  });
});

describe('tiffinPlanSavingsLabel', () => {
  const price = (n: number) => (n >= 4 ? 10 : n >= 3 ? 11 : 12);

  it('shows strikethrough anchor for higher tiers', () => {
    expect(tiffinPlanStrikethroughPrice(4, price)).toBe('S$12.00');
    expect(tiffinPlanStrikethroughPrice(2, price)).toBeNull();
  });

  it('shows savings copy for 4 meals vs 2', () => {
    expect(tiffinPlanSavingsLabel(4, price)).toMatch(/Save S\$2\.00\/meal/);
  });
});
