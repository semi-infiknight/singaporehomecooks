import { describe, expect, it } from 'vitest';
import {
  accountMenuItemsSignedIn,
  accountMenuItemsGuest,
  kitchenTrustCerts,
  tiffinPlanDurationOptions,
  tiffinPlanDurationTotal,
  CART_WIREFRAME_LABELS,
} from './wireframe-ia';

describe('wireframe-ia (paper wireframes)', () => {
  it('signed-in account menu covers wireframe rows', () => {
    const labels = accountMenuItemsSignedIn().map((i) => i.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        'My Profile',
        'My Subscriptions',
        'My Orders',
        'Manage Address',
        'My Requests',
      ])
    );
  });

  it('guest account emphasizes sign up / log in', () => {
    expect(accountMenuItemsGuest()[0].label).toMatch(/Sign Up|Log In/i);
  });

  it('kitchen trust certs include licenses and hygiene', () => {
    const certs = kitchenTrustCerts({ display_name: 'Auntie Rose', sfa_reg_number: 'SFA-123' });
    expect(certs.map((c) => c.id)).toEqual(['contact', 'licenses', 'food_safety', 'hygiene']);
    expect(certs.find((c) => c.id === 'licenses')?.status).toBe('verified');
  });

  it('tiffin plan durations match wireframe 7d / 1m / custom', () => {
    const ids = tiffinPlanDurationOptions().map((o) => o.id);
    expect(ids).toEqual(['7d', '1m', 'custom']);
    expect(tiffinPlanDurationTotal(3, 11, 4)).toBe(132);
  });

  it('cart labels include bill summary and coupon', () => {
    expect(CART_WIREFRAME_LABELS.bill).toMatch(/Bill/i);
    expect(CART_WIREFRAME_LABELS.coupon).toMatch(/coupon/i);
  });
});
