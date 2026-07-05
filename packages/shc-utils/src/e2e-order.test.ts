import { describe, expect, it } from 'vitest';
import { E2E_ORDER_SEED, resolveOrderForDisplay } from './e2e-order';

describe('e2e-order', () => {
  it('injects collected order when maestro flag set and id matches', () => {
    const order = resolveOrderForDisplay(null, E2E_ORDER_SEED.id, { maestroE2e: true });
    expect(order?.shc_status).toBe('collected');
    expect(order?.id).toBe('order-e2e-review');
  });

  it('returns existing order without override', () => {
    const api = { id: 'SHC-2026-00001', shc_status: 'paid' };
    expect(resolveOrderForDisplay(api, 'SHC-2026-00001', { maestroE2e: true })).toBe(api);
  });
});