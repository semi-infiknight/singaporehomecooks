import { describe, expect, it } from 'vitest';
import { getFooterCopy, getWebPushCopy } from './footer';
import { getCheckoutScreenCopy, getOrdersListCopy } from './checkout-screen';

describe('footer + web push copy', () => {
  it('localizes footer copyright year', () => {
    expect(getFooterCopy('en').copyright(2026)).toContain('2026');
    expect(getFooterCopy('zh-Hans').browseDishes).toBe('浏览菜品');
  });

  it('localizes checkout validation errors', () => {
    const copy = getCheckoutScreenCopy('en');
    expect(copy.errorAllergenRequired).toContain('Allergen');
    expect(getOrdersListCopy('zh-Hans').guest).toBe('访客');
  });
});
