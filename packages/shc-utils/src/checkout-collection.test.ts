import { describe, expect, it } from 'vitest';
import {
  buildCheckoutCollectionNotes,
  checkoutCollectionPrefill,
  customerCollectionForOrder,
} from './checkout-collection';

const ADDR = {
  id: 'a1',
  label: 'home' as const,
  line1: 'Blk 456 Tampines St 42',
  line2: '#05-123',
  postal_code: '520456',
  lat: 1.35,
  lng: 103.94,
  instructions: 'Void deck B',
  source: 'search' as const,
};

describe('checkoutCollectionPrefill', () => {
  it('returns null without a saved point', () => {
    expect(checkoutCollectionPrefill(null)).toBeNull();
    expect(checkoutCollectionPrefill({ line1: 'x' })).toBeNull();
  });

  it('maps saved address fields', () => {
    const prefill = checkoutCollectionPrefill(ADDR);
    expect(prefill?.line2).toBe('#05-123');
    expect(prefill?.instructions).toBe('Void deck B');
    expect(prefill?.shortLabel).toContain('520456');
  });
});

describe('buildCheckoutCollectionNotes', () => {
  it('includes collection point and pickup notes', () => {
    const note = buildCheckoutCollectionNotes({
      location: ADDR,
      unit: '#05-123',
      instructions: 'Call when arriving',
    });
    expect(note).toContain('Collection point:');
    expect(note).toContain('Pickup notes: Call when arriving');
    expect(note).toContain('S520456');
  });

  it('merges cart collection notes when different', () => {
    const note = buildCheckoutCollectionNotes({
      location: ADDR,
      cartCollectionNotes: 'Ring doorbell',
    });
    expect(note).toContain('Ring doorbell');
  });
});

describe('customerCollectionForOrder', () => {
  it('returns structured snapshot for ops', () => {
    const snap = customerCollectionForOrder(ADDR, '#05-123');
    expect(snap).toMatchObject({
      customer_collection_lat: 1.35,
      customer_collection_lng: 103.94,
      customer_collection_postal_code: '520456',
      customer_collection_line1: 'Blk 456 Tampines St 42, #05-123',
    });
  });

  it('returns null without coordinates', () => {
    expect(customerCollectionForOrder({ line1: 'x', postal_code: '123456' })).toBeNull();
  });
});
