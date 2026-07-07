import { describe, expect, it } from 'vitest';
import { getProductDetailCopy, getOrderChatCopy } from './product-chat';

describe('product detail copy', () => {
  it('returns localized PDP strings', () => {
    const copy = getProductDetailCopy('en');
    expect(copy.loadingDish).toBe('Loading dish…');
    expect(copy.halal).toBe('Halal');
    expect(getProductDetailCopy('zh-Hans').allergenRequired).toContain('过敏原');
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
