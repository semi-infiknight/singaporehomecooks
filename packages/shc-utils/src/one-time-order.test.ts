import { describe, expect, it } from 'vitest';
import {
  computeOneTimeOrderSummary,
  cartKitchenLabel,
  orderSuccessfulCopy,
  orderTrackingBanner,
  cartStickyViewLabel,
  cartItemsAddedLabel,
  ONE_TIME_SERVICE_FEE,
} from './one-time-order';

describe('one-time order flow helpers', () => {
  it('computes summary with service fee', () => {
    const s = computeOneTimeOrderSummary([
      { qty: 2, price: 12 },
      { qty: 1, price: 8 },
    ]);
    expect(s.itemTotal).toBe(32);
    expect(s.serviceFee).toBe(ONE_TIME_SERVICE_FEE);
    expect(s.collectionFee).toBe(0);
    expect(s.total).toBe(32 + ONE_TIME_SERVICE_FEE);
    expect(s.proceedLabel).toBe('Proceed to pay');
    expect(s.cancelNote.toLowerCase()).toContain('cannot be cancelled');
  });

  it('resolves kitchen label from cart lines', () => {
    expect(cartKitchenLabel([{ cook_name: 'Auntie Rose' }])).toBe('Auntie Rose');
    expect(cartKitchenLabel([])).toBe('Home kitchen');
  });

  it('success and tracking copy', () => {
    expect(orderSuccessfulCopy().title).toBe('Order placed!');
    expect(orderTrackingBanner('preparing').tone).toBe('active');
    expect(orderTrackingBanner('collected').tone).toBe('done');
  });

  it('sticky cart labels', () => {
    expect(cartItemsAddedLabel(1)).toBe('1 item added');
    expect(cartStickyViewLabel(2, 45)).toContain('45');
  });
});
