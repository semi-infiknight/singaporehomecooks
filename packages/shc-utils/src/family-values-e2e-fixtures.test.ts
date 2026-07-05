import { describe, expect, it } from 'vitest';
import {
  E2E_ORDER_SEED,
  orderTrayActions,
  resolveDisputesForDisplay,
  resolveOrderForDisplay,
  resolveReviewForDisplay,
} from './e2e-order';

describe('family-values E2E fixtures', () => {
  it('orderTrayActions(E2E_ORDER_SEED, null, []) shows both tray buttons', () => {
    const actions = orderTrayActions({ order: E2E_ORDER_SEED, review: null, disputes: [] });
    expect(actions.showReviewBtn).toBe(true);
    expect(actions.showDisputeBtn).toBe(true);
  });

  it('resolveOrderForDisplay injects seed only when maestroE2e + matching id', () => {
    expect(resolveOrderForDisplay(null, E2E_ORDER_SEED.id, { maestroE2e: true })?.shc_status).toBe('collected');
    expect(resolveOrderForDisplay(null, E2E_ORDER_SEED.id, { maestroE2e: false })).toBeNull();
    expect(resolveOrderForDisplay({ id: 'SHC-1', shc_status: 'paid' }, E2E_ORDER_SEED.id, { maestroE2e: true })).toEqual({
      id: 'SHC-1',
      shc_status: 'paid',
    });
  });

  it('resolveReviewForDisplay and resolveDisputesForDisplay empty for e2e seed', () => {
    expect(resolveReviewForDisplay(undefined, E2E_ORDER_SEED.id, { maestroE2e: true })).toBeNull();
    expect(resolveDisputesForDisplay([], E2E_ORDER_SEED.id, { maestroE2e: true })).toEqual([]);
  });

  it('paid order hides review button', () => {
    const actions = orderTrayActions({ order: { shc_status: 'paid' }, review: null, disputes: [] });
    expect(actions.showReviewBtn).toBe(false);
    expect(actions.showDisputeBtn).toBe(true);
  });
});