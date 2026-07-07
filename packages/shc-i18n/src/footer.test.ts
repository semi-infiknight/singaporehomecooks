import { describe, expect, it } from 'vitest';
import { getFooterCopy, getWebPushCopy } from './footer';

describe('footer + web push copy', () => {
  it('localizes footer copyright year', () => {
    expect(getFooterCopy('en').copyright(2026)).toContain('2026');
    expect(getFooterCopy('zh-Hans').browseDishes).toBe('浏览菜品');
  });

  it('localizes web push error fallbacks', () => {
    expect(getWebPushCopy('en').unsupportedDevice).toContain('not supported');
    expect(getWebPushCopy('zh-Hans').notNow).toBe('暂不');
  });
});
