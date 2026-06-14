import { describe, it, expect } from 'vitest';
import { enforceOneCookPerCart, enforceOneCookOnAdd, enforceOneCookForOrder, CartItem } from './one-cook';

describe('one-cook rule (10+ tests, 08-marketplace-rules.md + locked decisions)', () => {
  const itemA: CartItem = { cookId: 'c1', productId: 'p1', qty: 2 };
  const itemB: CartItem = { cookId: 'c2', productId: 'p2', qty: 1 };

  it('allows empty cart', () => {
    expect(enforceOneCookPerCart([])).toEqual({ valid: true });
  });

  it('allows single cook cart', () => {
    expect(enforceOneCookPerCart([itemA, { ...itemA, productId: 'p3' }])).toEqual({ valid: true });
  });

  it('rejects two different cooks in cart', () => {
    const res = enforceOneCookPerCart([itemA, itemB]);
    expect(res.valid).toBe(false);
    expect(res.code).toBe('SHC-CART-001');
    expect(res.error).toContain('One cook per cart');
  });

  it('enforceOneCookOnAdd allows first item', () => {
    expect(enforceOneCookOnAdd(null, 'c1')).toEqual({ valid: true });
  });

  it('enforceOneCookOnAdd allows same cook add', () => {
    expect(enforceOneCookOnAdd('c1', 'c1')).toEqual({ valid: true });
  });

  it('enforceOneCookOnAdd rejects different cook add', () => {
    const res = enforceOneCookOnAdd('c1', 'c2');
    expect(res.valid).toBe(false);
    expect(res.code).toBe('SHC-CART-001');
  });

  it('enforceOneCookForOrder allows consistent', () => {
    expect(enforceOneCookForOrder('c1', ['c1', 'c1'])).toEqual({ valid: true });
  });

  it('enforceOneCookForOrder rejects mixed line items', () => {
    const res = enforceOneCookForOrder('c1', ['c1', 'c2']);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('One cook per order');
  });

  it('enforceOneCookForOrder rejects mismatch with order cook', () => {
    expect(enforceOneCookForOrder('c1', ['c2']).valid).toBe(false);
  });

  it('handles many items same cook', () => {
    const many = Array(10).fill(0).map((_, i) => ({ cookId: 'cX', productId: `p${i}`, qty: 1 }));
    expect(enforceOneCookPerCart(many).valid).toBe(true);
  });

  it('returns code for cart violation', () => {
    const res = enforceOneCookPerCart([itemA, itemB]);
    expect(res.code).toBe('SHC-CART-001');
  });

  it('is idempotent and pure', () => {
    const items: CartItem[] = [itemA];
    const r1 = enforceOneCookPerCart(items);
    const r2 = enforceOneCookPerCart(items);
    expect(r1).toEqual(r2);
  });
});
