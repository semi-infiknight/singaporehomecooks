import { describe, expect, it } from 'vitest';
import { getCustomerLayoutCopy } from './customer-layout';

describe('customer layout copy', () => {
  it('returns localized stack and tab titles', () => {
    const en = getCustomerLayoutCopy('en');
    expect(en.appTitle).toBe('SHC — Customer');
    expect(en.checkout).toBe('Checkout (PayNow)');
    expect(en.cookProfile).toBe('Cook Profile');

    const zh = getCustomerLayoutCopy('zh-Hans');
    expect(zh.discover).toBe('发现美食');
    expect(zh.orderChat).toContain('聊天');
  });
});
