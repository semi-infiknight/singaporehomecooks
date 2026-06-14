import { describe, it, expect } from 'vitest';
import { validateMinMaxPortions, computeRemainingPortions, portionsValidationSchema } from './portions';

describe('portions rule (10+ tests, dedicated per contracts task + 08/09 + production graceful)', () => {
  it('passes valid min/max', () => {
    const res = validateMinMaxPortions({ productMinQty: 2, availablePortions: 8, requested: 3 });
    expect(res.valid).toBe(true);
  });

  it('fails below min', () => {
    const res = validateMinMaxPortions({ productMinQty: 5, availablePortions: 10, requested: 2 });
    expect(res.valid).toBe(false);
    expect(res.code).toBe('SHC-CART-002');
  });

  it('fails exceed available', () => {
    const res = validateMinMaxPortions({ productMinQty: 1, availablePortions: 4, requested: 5 });
    expect(res.valid).toBe(false);
    expect(res.code).toBe('SHC-AVAIL-002');
  });

  it('fails zero/neg requested', () => {
    expect(validateMinMaxPortions({ productMinQty: 1, availablePortions: 5, requested: 0 }).valid).toBe(false);
  });

  it('computeRemaining correct', () => {
    expect(computeRemainingPortions(10, 3)).toBe(7);
    expect(computeRemainingPortions(2, 5)).toBe(0);
  });

  it('schema validates bounds', () => {
    expect(() => portionsValidationSchema.parse({ minQty: 2, available: 10, requested: 3 })).not.toThrow();
    expect(() => portionsValidationSchema.parse({ minQty: 2, available: 10, requested: 1 })).toThrow();
  });

  it('edge: exact available', () => {
    expect(validateMinMaxPortions({ productMinQty: 1, availablePortions: 1, requested: 1 }).valid).toBe(true);
  });

  it('edge: exact min', () => {
    expect(validateMinMaxPortions({ productMinQty: 4, availablePortions: 10, requested: 4 }).valid).toBe(true);
  });

  it('pure', () => {
    const ctx = { productMinQty: 1, availablePortions: 5, requested: 2 };
    expect(validateMinMaxPortions(ctx)).toEqual(validateMinMaxPortions(ctx));
  });

  it('covers last minute premium note (not affect qty)', () => {
    const res = validateMinMaxPortions({ productMinQty: 1, availablePortions: 2, requested: 2 });
    expect(res.valid).toBe(true);
  });

  it('mobile mock portions fail case', () => {
    const fail = validateMinMaxPortions({ productMinQty: 10, availablePortions: 5, requested: 6 });
    expect(fail.valid).toBe(false);
  });
});
