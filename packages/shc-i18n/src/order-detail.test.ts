import { describe, expect, it } from 'vitest';
import { formatOrderRef, getLocalizedOrderStatus } from './order-detail';

describe('order-detail i18n', () => {
  it('localizes order status labels', () => {
    expect(getLocalizedOrderStatus('en', 'preparing')).toBe('Cook is preparing your meal');
    expect(getLocalizedOrderStatus('zh-Hans', 'preparing')).toBe('厨师正在准备');
  });

  it('formats order reference', () => {
    expect(formatOrderRef('en', 'SHC-123')).toBe('Order SHC-123');
    expect(formatOrderRef('zh-Hans', 'SHC-123')).toBe('订单 SHC-123');
  });
});
