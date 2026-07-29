import { describe, expect, it } from 'vitest';
import {
  getActiveOrders,
  latestActiveCookOrder,
  getOrderTimelineIndex,
  isActiveOrderStatus,
  getOrderStatusLabel,
  getOrdersTabLiveCue,
  isOrderCookingStatus,
  isCookNeedsActionOrder,
  partitionCookOrders,
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

  it('puts paid orders in needsAction partition', () => {
    const orders = [
      { id: '1', shc_status: 'paid' },
      { id: '2', shc_status: 'preparing' },
      { id: '3', shc_status: 'completed' },
    ];
    const { needsAction, inProgress, done } = partitionCookOrders(orders);
    expect(needsAction.map((o) => o.id)).toEqual(['1']);
    expect(inProgress.map((o) => o.id)).toEqual(['2']);
    expect(done.map((o) => o.id)).toEqual(['3']);
  });

  it('isCookNeedsActionOrder is true only for paid', () => {
    expect(isCookNeedsActionOrder({ shc_status: 'paid' })).toBe(true);
    expect(isCookNeedsActionOrder({ shc_status: 'accepted' })).toBe(false);
  });

  it('picks latest active cook order for chat CTA', () => {
    const latest = latestActiveCookOrder([
      { id: 'old', shc_status: 'preparing', updated_at: '2026-07-01T10:00:00Z' },
      { id: 'new', shc_status: 'accepted', updated_at: '2026-07-02T10:00:00Z' },
      { id: 'done', shc_status: 'completed' },
    ]);
    expect(latest?.id).toBe('new');

    const paidFirst = latestActiveCookOrder([
      { id: 'paid', shc_status: 'paid', updated_at: '2026-07-01T10:00:00Z' },
      { id: 'prep', shc_status: 'preparing', updated_at: '2026-07-03T10:00:00Z' },
    ]);
    expect(paidFirst?.id).toBe('paid');
    expect(latestActiveCookOrder([{ id: 'done', shc_status: 'completed' }])).toBeNull();
  });
});
