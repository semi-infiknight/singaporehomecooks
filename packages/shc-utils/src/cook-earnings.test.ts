import { describe, expect, it } from 'vitest';
import {
  cookEarningsOrderCount,
  cookEarningsPreviewFromCents,
  cookEarningsPreviewFromDollars,
  cookEarningsProjectedDisplay,
  cookEarningsWeekTotal,
  formatCookEarningsDisplay,
  formatCookExpenseRowAmount,
  formatCookExpenseTotalDollars,
  parseExpenseAmountToCents,
  recentCookExpenses,
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

  it('derives week total and order count from legacy view', () => {
    expect(cookEarningsWeekTotal({ thisWeek: 4200 })).toBe(4200);
    expect(cookEarningsOrderCount({ orders_count: 3 })).toBe(3);
    expect(cookEarningsOrderCount({ orders: 5 })).toBe(5);
    expect(cookEarningsProjectedDisplay({ thisWeek: 100, projectedPayout: 0 })).toBe(100);
    expect(cookEarningsProjectedDisplay({ thisWeek: 100, projectedPayout: 250 })).toBe(250);
  });

  it('formats expense amounts', () => {
    expect(formatCookExpenseTotalDollars(1850)).toBe('S$19');
    expect(formatCookExpenseRowAmount(1850)).toBe('S$18.50');
  });

  it('parses expense dollar input', () => {
    expect(parseExpenseAmountToCents('18.5')).toBe(1850);
    expect(parseExpenseAmountToCents('0')).toBeNull();
    expect(parseExpenseAmountToCents('abc')).toBeNull();
  });

  it('sorts recent expenses by date desc', () => {
    const rows = [
      { id: 'a', date: '2026-01-01' },
      { id: 'b', date: '2026-03-01' },
      { id: 'c', date: '2026-02-01' },
    ];
    expect(recentCookExpenses(rows, 2).map((r) => r.id)).toEqual(['b', 'c']);
  });
});
