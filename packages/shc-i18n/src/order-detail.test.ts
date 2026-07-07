import { describe, expect, it } from 'vitest';
import { formatOrderRef, getLocalizedOrderStatus, getLocalizedOrderTimeline, getCustomerOrderDetailCopy } from './order-detail';

describe('order-detail i18n', () => {
  it('localizes order status labels', () => {
    expect(getLocalizedOrderStatus('en', 'preparing')).toBe('Cook is preparing your meal');
    expect(getLocalizedOrderStatus('zh-Hans', 'preparing')).toBe('厨师正在准备');
  });

  it('formats order reference', () => {
    expect(formatOrderRef('en', 'SHC-123')).toBe('Order SHC-123');
    expect(formatOrderRef('zh-Hans', 'SHC-123')).toBe('订单 SHC-123');
  });

  it('returns localized timeline steps', () => {
    const steps = getLocalizedOrderTimeline('en');
    expect(steps).toHaveLength(6);
    expect(steps[0].label).toBe('Payment confirmed');
    expect(getLocalizedOrderTimeline('zh-Hans')[2].label).toBe('准备中');
  });

  it('formats customer order detail meta lines', () => {
    const copy = getCustomerOrderDetailCopy('en');
    expect(copy.totalMeta(42, 'Alex')).toContain('Alex');
    expect(copy.itemLine(2, 'Nasi Lemak')).toContain('2');
    expect(copy.disputeMeta(undefined, undefined)).toContain('open');
  });
});
