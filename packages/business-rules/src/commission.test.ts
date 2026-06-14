import { describe, it, expect } from 'vitest';
import { calculateCookEarnings, calculatePlatformFee, applyCommissionRule, DEFAULT_COMMISSION_RATE, validateCommissionRate } from './commission';

describe('commission rule (10+ tests, 15% default + versioned rule from 08 + phase-6 + GST)', () => {
  it('default 15% splits correctly (cents)', () => {
    const price = 6000; // S$60
    expect(calculatePlatformFee(price)).toBe(900);
    expect(calculateCookEarnings(price)).toBe(5100);
  });

  it('uses custom rate', () => {
    expect(calculatePlatformFee(10000, 0.1)).toBe(1000);
    expect(calculateCookEarnings(10000, 0.1)).toBe(9000);
  });

  it('applyCommissionRule from rule version returns breakdown', () => {
    const res = applyCommissionRule(10000, 20);
    expect(res.platform).toBe(2000);
    expect(res.cook).toBe(8000);
    expect(res.total).toBe(10000);
  });

  it('floors correctly for non-divisible', () => {
    // 0.15 * 1234 = 185.1 -> floor 185 platform
    expect(calculatePlatformFee(1234)).toBe(185);
  });

  it('rejects negative price in calc', () => {
    expect(() => calculateCookEarnings(-1)).toThrow();
  });

  it('earnings preview for checkout/earnings screens (Phase 6 credits stub)', () => {
    const orderTotalCents = 12000; // S$120
    expect(calculateCookEarnings(orderTotalCents)).toBe(10200);
    expect(calculatePlatformFee(orderTotalCents)).toBe(1800);
  });

  it('validate rate for future commission rules', () => {
    expect(validateCommissionRate(0.15)).toBe(true);
    expect(validateCommissionRate(1.5)).toBe(false);
  });

  it('validate rate bounds', () => {
    expect(validateCommissionRate(0.15)).toBe(true);
    expect(validateCommissionRate(0)).toBe(true);
    expect(validateCommissionRate(1)).toBe(true);
    expect(validateCommissionRate(-0.1)).toBe(false);
    expect(validateCommissionRate(1.1)).toBe(false);
  });

  it('default rate matches locked', () => {
    expect(DEFAULT_COMMISSION_RATE).toBe(0.15);
  });

  it('round trip earnings + fee = price (int) or floor diff at most 1 cent', () => {
    const p = 10000;
    const e = calculateCookEarnings(p);
    const f = calculatePlatformFee(p);
    expect(e + f).toBe(p); // exact for this value
  });

  it('zero price', () => {
    expect(calculateCookEarnings(0)).toBe(0);
    expect(calculatePlatformFee(0)).toBe(0);
  });

  it('high rate 50% example for test', () => {
    const res = applyCommissionRule(2000, 50);
    expect(res.cook).toBe(1000);
  });

  it('uses shc_commission_rule shape simulation', () => {
    const rule = { rate_pct: 15 };
    const out = applyCommissionRule(5000, rule.rate_pct);
    expect(out.platform).toBe(750);
  });
});
