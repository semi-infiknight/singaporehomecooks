import { describe, expect, it } from 'vitest';
import { formatSGD, summarizeCart } from './cart';

describe('summarizeCart', () => {
  it('sums qty and price from snake_case lines', () => {
    const s = summarizeCart([
      { qty: 2, price: 12 },
      { qty: 3, price: 8.5 },
    ]);
    expect(s.itemCount).toBe(5);
    expect(s.totalLabel).toBe('S$49.50');
    expect(s.countLabel).toBe('5 items');
    expect(s.hasItems).toBe(true);
  });

  it('returns empty summary for no items', () => {
    const s = summarizeCart([]);
    expect(s.hasItems).toBe(false);
    expect(s.totalLabel).toBe('S$0.00');
  });

  it('caps badge at 99+', () => {
    const s = summarizeCart([{ qty: 120, price: 10 }]);
    expect(s.badgeLabel).toBe('99+');
  });
});

describe('formatSGD', () => {
  it('formats dollars with two decimals', () => {
    expect(formatSGD(42)).toBe('S$42.00');
  });
});