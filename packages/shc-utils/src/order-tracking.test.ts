import { describe, expect, it } from 'vitest';
import {
  getActiveOrders,
  getOrderTimelineIndex,
  isActiveOrderStatus,
  getOrderStatusLabel,
  getOrdersTabLiveCue,
  isOrderCookingStatus,
} from './order-tracking';

describe('order-tracking', () => {
  it('maps preparing to timeline index 2', () => {
    expect(getOrderTimelineIndex('preparing')).toBe(2);
  });

  it('detects active orders', () => {
    expect(isActiveOrderStatus('ready_for_collection')).toBe(true);
    expect(isActiveOrderStatus('completed')).toBe(false);
  });

  it('filters active orders from list', () => {
    const active = getActiveOrders([
      { shc_status: 'paid' },
      { shc_status: 'completed' },
      { shc_status: 'preparing' },
    ]);
    expect(active).toHaveLength(2);
  });

  it('humanizes status labels', () => {
    expect(getOrderStatusLabel('ready_for_collection')).toContain('collection');
  });

  it('cooking cue only for preparing orders due today', () => {
    expect(isOrderCookingStatus('preparing')).toBe(true);
    expect(isOrderCookingStatus('accepted')).toBe(false);
    expect(isOrderCookingStatus('paid')).toBe(false);

    expect(getOrdersTabLiveCue([{ shc_status: 'preparing', collection_date: '2026-07-15' }], '2026-07-15')).toBe(
      'cooking'
    );
    expect(getOrdersTabLiveCue([{ shc_status: 'preparing', collection_date: '2026-07-16' }], '2026-07-15')).toBeNull();
    expect(getOrdersTabLiveCue([{ shc_status: 'preparing', collection_date: '' }], '2026-07-15')).toBeNull();
    expect(getOrdersTabLiveCue([{ shc_status: 'accepted', collection_date: '2026-07-15' }], '2026-07-15')).toBeNull();
    expect(getOrdersTabLiveCue([{ shc_status: 'paid', collection_date: '2026-07-15' }], '2026-07-15')).toBeNull();
    expect(
      getOrdersTabLiveCue([{ shc_status: 'ready_for_collection', collection_date: '2026-07-15' }], '2026-07-15')
    ).toBeNull();
  });
});