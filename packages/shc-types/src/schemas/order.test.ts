import { describe, it, expect } from 'vitest';
import { shcOrderMetaSchema, SHCOrderStatus, orderStateTransitionSchema } from './order';

describe('shc-order-meta schema (TDD from blueprint/05-data-model + 09-order-state)', () => {
  it('validates a complete paid order meta', () => {
    const valid = {
      order_id: 'ord_123',
      cook_id: 'cook_456',
      collection_date: '2026-07-01',
      collection_slot: '18:00-19:00',
      allergen_acked_at: '2026-06-13T10:00:00Z',
      address_released_at: '2026-06-13T10:05:00Z',
      paynow_reference: 'SHC-20260613-ABC123',
      shc_status: 'paid' as const,
    };
    expect(() => shcOrderMetaSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid state transition at schema level for cart->collected', () => {
    expect(() =>
      orderStateTransitionSchema.parse({
        from: 'cart',
        to: 'collected',
      })
    ).toThrow();
  });

  it('allows valid transitions per 09-order-state.md', () => {
    const valid = orderStateTransitionSchema.parse({ from: 'paid', to: 'accepted' });
    expect(valid.to).toBe('accepted');
  });

  it('enforces one-cook per order via cook_id presence', () => {
    const meta = shcOrderMetaSchema.parse({
      order_id: 'o1',
      cook_id: 'c1',
      collection_date: '2026-07-01',
      collection_slot: '17:00-18:00',
      shc_status: 'cart',
    });
    expect(meta.cook_id).toBe('c1');
  });
});
