import { describe, expect, it } from 'vitest';
import { getFooterCopy, getWebPushCopy } from './footer';
import { getCheckoutScreenCopy, getOrdersListCopy } from './checkout-screen';
import { getCartScreenCopy } from './cart-screen';

describe('footer + web push copy', () => {
  it('localizes footer copyright year', () => {
    expect(getFooterCopy('en').copyright(2026)).toContain('2026');
    expect(getFooterCopy('zh-Hans').browseDishes).toBe('浏览菜品');
  });

  it('localizes checkout validation errors', () => {
    const copy = getCheckoutScreenCopy('en');
    expect(copy.errorAllergenRequired).toContain('Allergen');
    expect(copy.itemsCount(2)).toContain('2');
    expect(copy.allergenAckLabel).toContain('allergen');
    expect(copy.collectionSlotEmpty).toContain('slot');
    expect(getOrdersListCopy('zh-Hans').guest).toBe('访客');
    expect(getOrdersListCopy('en').inProgressLabel(3)).toContain('3');
  });

  it('localizes web cart copy', () => {
    const copy = getCartScreenCopy('zh-Hans');
    expect(copy.headerPortions(2)).toContain('2');
    expect(copy.linePrice(2, '12.50')).toContain('12.50');
    expect(copy.keepBrowsing).toBe('继续浏览');
    expect(getOrdersListCopy('en').fallbackDish).toBe('Order');
  });
});
