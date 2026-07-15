import { describe, expect, it } from 'vitest';
import { isOrderNotification, orderIdFromNotificationType } from './notifications';

describe('orderIdFromNotificationType', () => {
  it('parses order id from typed notification', () => {
    expect(orderIdFromNotificationType('order:ord_abc123')).toBe('ord_abc123');
    expect(isOrderNotification('order:ord_abc123')).toBe(true);
  });

  it('returns null for non-order types', () => {
    expect(orderIdFromNotificationType('credit')).toBeNull();
    expect(isOrderNotification('bid')).toBe(false);
  });
});
