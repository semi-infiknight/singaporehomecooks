import { describe, expect, it } from 'vitest';
import { shapeStoreOrder } from './shc-order-shape';

describe('shapeStoreOrder', () => {
  const meta = {
    order_id: 'ord_1',
    cook_id: 'cook_rose',
    shc_status: 'paid',
    collection_date: '2026-07-28',
    collection_slot: '18:00-19:00',
    address_released_at: '2026-07-27T11:00:00.000Z',
    total_cents: 2500,
    items: [{ name: 'Laksa', qty: 2, product_id: 'p1' }],
  };

  const cook = {
    display_name: 'Auntie Rose',
    collection_address: 'Blk 456 Tampines St 42 #05-123',
    collection_instructions: 'Lift lobby B',
  };

  it('includes cook name and gated collection fields for customer after release', () => {
    const shaped = shapeStoreOrder(meta, cook, {
      viewerRole: 'customer',
      now: new Date('2026-07-27T12:00:00.000Z'),
    });
    expect(shaped.cook_name).toBe('Auntie Rose');
    expect(shaped.collection_address_released).toBe(true);
    expect(shaped.collection_address).toBe(cook.collection_address);
    expect(shaped.collection_instructions).toBe(cook.collection_instructions);
    expect(shaped.total).toBe(25);
  });

  it('hides collection fields for customer before release', () => {
    const shaped = shapeStoreOrder(
      { ...meta, address_released_at: '2026-07-27T18:00:00.000Z' },
      cook,
      { viewerRole: 'customer', now: new Date('2026-07-27T12:00:00.000Z') }
    );
    expect(shaped.collection_address_released).toBe(false);
    expect(shaped.collection_address).toBeUndefined();
    expect(shaped.collection_instructions).toBeUndefined();
  });

  it('always includes collection fields for cook viewer', () => {
    const shaped = shapeStoreOrder(
      { ...meta, address_released_at: '2026-07-27T18:00:00.000Z' },
      cook,
      { viewerRole: 'cook', now: new Date('2026-07-27T12:00:00.000Z') }
    );
    expect(shaped.collection_address_released).toBe(true);
    expect(shaped.collection_address).toBe(cook.collection_address);
  });
});
