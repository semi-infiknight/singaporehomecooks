import { describe, it, expect } from 'vitest';
import { validateMinQty, validateMinQtyForProduct } from './min-qty';

describe('min-qty rule (10+ tests, 08-marketplace-rules.md + product_meta.min_qty)', () => {
  it('passes when qty >= min', () => {
    expect(validateMinQty(5, 5).valid).toBe(true);
    expect(validateMinQty(1, 10).valid).toBe(true);
  });

  it('fails below min', () => {
    const res = validateMinQty(5, 3);
    expect(res.valid).toBe(false);
    expect(res.code).toBe('SHC-CART-002');
  });

  it('rejects zero or negative qty', () => {
    expect(validateMinQty(1, 0).valid).toBe(false);
    expect(validateMinQty(2, -1).valid).toBe(false);
  });

  it('product helper uses min_qty field', () => {
    const p = { min_qty: 4 };
    expect(validateMinQtyForProduct(p, 4).valid).toBe(true);
    expect(validateMinQtyForProduct(p, 3).valid).toBe(false);
  });

  it('error mentions quantity', () => {
    expect(validateMinQty(10, 2).error).toContain('10');
  });

  it('idempotent pure fn', () => {
    const r = validateMinQty(3, 5);
    expect(r).toEqual(validateMinQty(3, 5));
  });

  it('min=1 allows 1', () => expect(validateMinQty(1, 1).valid).toBe(true));

  it('large min requires exact match or more', () => {
    expect(validateMinQty(50, 49).valid).toBe(false);
    expect(validateMinQty(50, 50).valid).toBe(true);
  });

  it('covers tasting exception note (future) but current strict', () => {
    expect(validateMinQty(1, 1).valid).toBe(true); // even small ok if min=1
  });

  it('validates cart line vs product meta mock', () => {
    const meta = { min_qty: 2 };
    const cartLineQty = 1;
    expect(validateMinQty(meta.min_qty, cartLineQty).valid).toBe(false);
  });

  it('returns code consistently', () => {
    expect(validateMinQty(2, 1).code).toBe('SHC-CART-002');
  });
});
