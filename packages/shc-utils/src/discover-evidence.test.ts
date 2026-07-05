import { describe, expect, it } from 'vitest';
import {
  OFFLINE_DISCOVER_PRODUCT,
  resolveDiscoverProductsForDisplay,
  resolveProductForDisplay,
} from './discover-evidence';
import { E2E_CART_SEED_ITEM } from './e2e-cart';

describe('resolveDiscoverProductsForDisplay', () => {
  it('returns API products when non-empty', () => {
    const api = [{ id: 'live-dish', name: 'Live' }];
    expect(resolveDiscoverProductsForDisplay(api, { evidence: true })).toBe(api);
  });

  it('injects offline seed when empty and evidence mode', () => {
    const rows = resolveDiscoverProductsForDisplay([], { evidence: true });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(E2E_CART_SEED_ITEM.id);
  });

  it('leaves empty list when evidence mode off', () => {
    expect(resolveDiscoverProductsForDisplay([], {})).toEqual([]);
  });
});

describe('resolveProductForDisplay', () => {
  it('returns live product when present', () => {
    const live = { id: 'x', name: 'Y' };
    expect(resolveProductForDisplay(live, 'x', { evidence: true })).toBe(live);
  });

  it('falls back to offline seed for matching id in evidence mode', () => {
    const resolved = resolveProductForDisplay(null, OFFLINE_DISCOVER_PRODUCT.id, { evidence: true });
    expect(resolved).toEqual(OFFLINE_DISCOVER_PRODUCT);
  });
});