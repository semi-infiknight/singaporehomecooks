import { describe, it, expect } from 'vitest';
import { parseBidDollarsToCents, formatBidCentsAsDollars } from './collab-bid';

describe('collab-bid', () => {
  it('parses dollar input to cents for API createBid', () => {
    expect(parseBidDollarsToCents('14')).toEqual({ ok: true, cents: 1400 });
    expect(parseBidDollarsToCents('14.50')).toEqual({ ok: true, cents: 1450 });
    expect(parseBidDollarsToCents('S$20')).toEqual({ ok: true, cents: 2000 });
    expect(parseBidDollarsToCents(' 12 ')).toEqual({ ok: true, cents: 1200 });
  });

  it('rejects empty / invalid so UI cannot send NaN price_cents', () => {
    expect(parseBidDollarsToCents('').ok).toBe(false);
    expect(parseBidDollarsToCents(undefined).ok).toBe(false);
    expect(parseBidDollarsToCents('abc').ok).toBe(false);
    expect(parseBidDollarsToCents('0').ok).toBe(false);
    expect(parseBidDollarsToCents('-5').ok).toBe(false);
  });

  it('formats cents for success copy', () => {
    expect(formatBidCentsAsDollars(1400)).toBe('S$14');
    expect(formatBidCentsAsDollars(1450)).toBe('S$14.50');
  });
});
