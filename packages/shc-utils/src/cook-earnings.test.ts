import { describe, expect, it } from 'vitest';
import {
  cookEarningsPreviewFromCents,
  cookEarningsPreviewFromDollars,
  formatCookEarningsDisplay,
  resolveCookEarningsSummary,
} from './cook-earnings';

describe('cook-earnings', () => {
  it('resolves explicit cents fields from API', () => {
    const summary = resolveCookEarningsSummary({
      cook_id: 'cook_rose',
      this_week_cents: 8925,
      projected_payout_cents: 8925,
      gross_cents: 10500,
      platform_fee_cents: 1575,
      orders_count: 3,
      commission_rate_pct: 15,
    });
    expect(summary.this_week_cents).toBe(8925);
    expect(summary.orders_count).toBe(3);
    expect(summary.commission_rate_pct).toBe(15);
  });

  it('formats ledger cents as dollars', () => {
    expect(formatCookEarningsDisplay(8925)).toBe('S$89.25');
  });

  it('previews cook earnings from dollars using business-rules rate', () => {
    expect(cookEarningsPreviewFromDollars(100, 0.15)).toBe(85);
    expect(cookEarningsPreviewFromCents(10000, 0.15)).toBe(8500);
  });

  it('falls back to legacy thisWeek cents field', () => {
    const summary = resolveCookEarningsSummary({ thisWeek: 5000, orders_count: 2 });
    expect(summary.this_week_cents).toBe(5000);
    expect(summary.orders_count).toBe(2);
  });
});
