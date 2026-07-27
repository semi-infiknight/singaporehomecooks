import { describe, expect, it } from 'vitest';
import {
  cookEarningsOrderCount,
  cookEarningsProjectedDisplay,
  cookEarningsWeekTotal,
  formatCookExpenseRowAmount,
  formatCookExpenseTotalDollars,
  parseExpenseAmountToCents,
  recentCookExpenses,
} from './cook-earnings';

describe('cook-earnings', () => {
  it('derives week total and order count', () => {
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
