import { describe, expect, it } from 'vitest';
import {
  E2E_ORDER_SEED,
  orderTrayActions,
  resolveDisputesForDisplay,
  resolveOrderForDisplay,
  resolveReviewForDisplay,
} from './e2e-order';

describe('e2e-order', () => {
  it('injects collected order when maestroE2e and id matches', () => {
    const order = resolveOrderForDisplay(null, E2E_ORDER_SEED.id, { maestroE2e: true });
    expect(order?.shc_status).toBe('collected');
    expect(order?.id).toBe('order-e2e-review');
  });

  it('does not inject without maestroE2e flag', () => {
    expect(resolveOrderForDisplay(null, E2E_ORDER_SEED.id, { maestroE2e: false })).toBeNull();
  });

  it('orderTrayActions enables both buttons for e2e seed', () => {
    const actions = orderTrayActions({
      order: E2E_ORDER_SEED,
      review: resolveReviewForDisplay(null, E2E_ORDER_SEED.id, { maestroE2e: true }),
      disputes: resolveDisputesForDisplay([], E2E_ORDER_SEED.id, { maestroE2e: true }),
    });
    expect(actions.showReviewBtn).toBe(true);
    expect(actions.showDisputeBtn).toBe(true);
  });
});