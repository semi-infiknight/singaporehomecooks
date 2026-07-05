import { describe, expect, it } from 'vitest';
import { E2E_CART_SEED_ITEM, resolveCartForDisplay } from './e2e-cart';

describe('resolveCartForDisplay', () => {
  it('returns API cart when items exist', () => {
    const api = { items: [{ id: 'live', name: 'Live dish', price: 10, qty: 1 }] };
    expect(resolveCartForDisplay(api, { maestroE2e: true })).toBe(api);
  });

  it('injects seed item for Maestro when cart is empty', () => {
    const rows = resolveCartForDisplay({ items: [] }, { maestroE2e: true });
    expect(rows.items).toHaveLength(1);
    expect(rows.items?.[0]).toEqual(E2E_CART_SEED_ITEM);
  });

  it('leaves empty cart in production mode', () => {
    expect(resolveCartForDisplay({ items: [] }, {})).toEqual({ items: [] });
  });
});