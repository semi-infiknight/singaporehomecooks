import { describe, expect, it } from 'vitest';
import { getProductDetailCopy, getOrderChatCopy } from './product-chat';
import { getCookProfileCopy } from './cook';

describe('product detail copy', () => {
  it('returns localized PDP strings', () => {
    const copy = getProductDetailCopy('en');
    expect(copy.loadingDish).toBe('Loading dish…');
    expect(copy.halal).toBe('Halal');
    expect(getProductDetailCopy('zh-Hans').allergenRequired).toContain('过敏原');
  });

  it('returns mobile cook profile extras', () => {
    const copy = getCookProfileCopy('en');
    expect(copy.menuHighlights).toBe('Menu highlights');
    expect(copy.viewCart).toBe('View Cart');
    expect(getCookProfileCopy('zh-Hans').noListings).toContain('暂无');
  });
});

describe('order chat copy', () => {
  it('returns role-specific chat strings', () => {
    const customer = getOrderChatCopy('en', 'customer');
    const cook = getOrderChatCopy('en', 'cook');
    expect(customer.title('SHC-1')).toBe('Chat for Order SHC-1');
    expect(cook.empty).toContain('collection time');
    expect(getOrderChatCopy('zh-Hans', 'customer').send).toBe('发送');
  });
});
