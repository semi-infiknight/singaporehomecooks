import { describe, expect, it } from 'vitest';
import {
  businessRulesCommissionRate,
  defaultBusinessRulesConfig,
  normalizeBusinessRulesConfig,
} from './business-rules-config';

describe('business-rules-config', () => {
  it('builds defaults matching frozen package constants', () => {
    const cfg = defaultBusinessRulesConfig();
    expect(cfg.commission.default_rate_pct).toBe(15);
    expect(cfg.drop.customer_window_days).toBe(7);
    expect(cfg.tiffin.customize_cutoff_hours).toBe(8);
    expect(cfg.cart.one_cook_enforced).toBe(true);
    expect(cfg.review.eligible_statuses).toEqual(['collected', 'completed']);
  });

  it('normalizes admin overrides with clamps', () => {
    const cfg = normalizeBusinessRulesConfig({
      commission: { default_rate_pct: 12.5 },
      drop: { customer_window_days: 99 },
      tiffin: { customize_cutoff_hours: 0 },
      cart: { one_cook_enforced: false },
      review: { eligible_statuses: ['completed', 'COMPLETED', ''] },
    });
    expect(cfg.commission.default_rate_pct).toBe(12.5);
    expect(cfg.drop.customer_window_days).toBe(30);
    expect(cfg.tiffin.customize_cutoff_hours).toBe(8);
    expect(cfg.cart.one_cook_enforced).toBe(false);
    expect(cfg.review.eligible_statuses).toEqual(['completed']);
  });

  it('derives commission rate decimal', () => {
    const cfg = defaultBusinessRulesConfig();
    expect(businessRulesCommissionRate(cfg)).toBe(0.15);
  });
});
