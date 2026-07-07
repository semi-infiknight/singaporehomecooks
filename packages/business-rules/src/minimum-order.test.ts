import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MINIMUM_ORDER_CENTS,
  enforceMinimumOrder,
  isTastingPortionLine,
} from './minimum-order';

describe('minimum-order rule (Decisions_Log 29I + FINAL.txt)', () => {
  it('allows orders at or above S$50', () => {
    expect(
      enforceMinimumOrder({
        totalCents: DEFAULT_MINIMUM_ORDER_CENTS,
        lines: [{ tasting_portion: false, price_cents: 1200 }],
      }).valid
    ).toBe(true);
    expect(
      enforceMinimumOrder({
        totalCents: 7500,
        lines: [{ price_cents: 1500 }],
      }).valid
    ).toBe(true);
  });

  it('blocks non-tasting orders below S$50', () => {
    const out = enforceMinimumOrder({
      totalCents: 3200,
      lines: [{ price_cents: 1600 }],
    });
    expect(out.valid).toBe(false);
    expect(out.code).toBe('SHC-CART-004');
    expect(out.error).toContain('S$50');
  });

  it('allows tasting-only carts below S$50', () => {
    expect(
      enforceMinimumOrder({
        totalCents: 1600,
        lines: [{ tasting_portion: true, price_cents: 800 }],
      }).valid
    ).toBe(true);
  });

  it('infers tasting portion from price ceiling S$8', () => {
    expect(isTastingPortionLine({ price_cents: 800 })).toBe(true);
    expect(isTastingPortionLine({ price_cents: 801 })).toBe(false);
  });

  it('blocks mixed cart when total below minimum', () => {
    const out = enforceMinimumOrder({
      totalCents: 2400,
      lines: [
        { tasting_portion: true, price_cents: 800 },
        { price_cents: 1600 },
      ],
    });
    expect(out.valid).toBe(false);
  });

  it('respects custom minimum from platform_config', () => {
    const out = enforceMinimumOrder({
      totalCents: 6000,
      lines: [{ price_cents: 3000 }],
      minimumCents: 8000,
    });
    expect(out.valid).toBe(false);
  });

  it('allows empty lines when total meets minimum', () => {
    expect(enforceMinimumOrder({ totalCents: 5000, lines: [] }).valid).toBe(true);
  });

  it('allows tasting inferred by price only', () => {
    expect(
      enforceMinimumOrder({
        totalCents: 800,
        lines: [{ price_cents: 800 }],
      }).valid
    ).toBe(true);
  });

  it('returns stable error code for clients', () => {
    expect(
      enforceMinimumOrder({ totalCents: 1000, lines: [{ price_cents: 1000 }] }).code
    ).toBe('SHC-CART-004');
  });

  it('handles multiple regular lines summing under minimum', () => {
    const out = enforceMinimumOrder({
      totalCents: 4800,
      lines: [{ price_cents: 1200 }, { price_cents: 1200 }],
    });
    expect(out.valid).toBe(false);
  });
});
