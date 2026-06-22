import { describe, expect, it } from 'vitest';
import {
  getActiveOrders,
  getOrderTimelineIndex,
  isActiveOrderStatus,
  getOrderStatusLabel,
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
});