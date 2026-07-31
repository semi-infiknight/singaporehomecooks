import { describe, expect, it } from 'vitest';
import {
  isOrderCollectionAddressReleased,
  resolveOrderCollectionFields,
  ORDER_COLLECTION_PRIVACY_HINT,
} from './order-collection';

describe('isOrderCollectionAddressReleased', () => {
  const now = new Date('2026-07-27T12:00:00.000Z');

  it('blocks cart and cancelled', () => {
    expect(isOrderCollectionAddressReleased({ shc_status: 'cart' }, now)).toBe(false);
    expect(isOrderCollectionAddressReleased({ shc_status: 'cancelled' }, now)).toBe(false);
  });

  it('releases once address_released_at is in the past for paid', () => {
    expect(
      isOrderCollectionAddressReleased(
        { shc_status: 'paid', address_released_at: '2026-07-27T11:00:00.000Z' },
        now
      )
    ).toBe(true);
    expect(
      isOrderCollectionAddressReleased(
        { shc_status: 'paid', address_released_at: '2026-07-27T13:00:00.000Z' },
        now
      )
    ).toBe(false);
  });

  it('releases for post-paid statuses even without address_released_at', () => {
    expect(isOrderCollectionAddressReleased({ shc_status: 'accepted' }, now)).toBe(false);
    expect(isOrderCollectionAddressReleased({ shc_status: 'paid' }, now)).toBe(false);
    expect(isOrderCollectionAddressReleased({ shc_status: 'ready_for_collection' }, now)).toBe(true);
  });
});

describe('resolveOrderCollectionFields', () => {
  const cookFields = {
    collection_address: 'Blk 123 Tampines St 42 #05-123',
    collection_instructions: 'Lift lobby B · WhatsApp on arrival',
  };

  it('hides fields for customer before release', () => {
    const resolved = resolveOrderCollectionFields(
      {
        shc_status: 'paid',
        address_released_at: '2026-07-27T18:00:00.000Z',
        ...cookFields,
        viewerRole: 'customer',
      },
      new Date('2026-07-27T12:00:00.000Z')
    );
    expect(resolved.collection_address_released).toBe(false);
    expect(resolved.collection_address).toBeUndefined();
    expect(resolved.collection_instructions).toBeUndefined();
    expect(resolved.privacyHint).toBe(ORDER_COLLECTION_PRIVACY_HINT);
  });

  it('exposes fields for customer after release', () => {
    const resolved = resolveOrderCollectionFields(
      {
        shc_status: 'paid',
        address_released_at: '2026-07-27T11:00:00.000Z',
        ...cookFields,
        viewerRole: 'customer',
      },
      new Date('2026-07-27T12:00:00.000Z')
    );
    expect(resolved.collection_address_released).toBe(true);
    expect(resolved.collection_address).toBe(cookFields.collection_address);
    expect(resolved.collection_instructions).toBe(cookFields.collection_instructions);
    expect(resolved.privacyHint).toBeUndefined();
  });

  it('always exposes fields for cook viewer', () => {
    const resolved = resolveOrderCollectionFields({
      shc_status: 'paid',
      ...cookFields,
      viewerRole: 'cook',
    });
    expect(resolved.collection_address_released).toBe(true);
    expect(resolved.collection_address).toBe(cookFields.collection_address);
  });
});
