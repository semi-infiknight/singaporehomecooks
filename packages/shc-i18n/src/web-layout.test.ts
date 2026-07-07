import { describe, expect, it } from 'vitest';
import { getWebLayoutCopy } from './web-layout';

describe('getWebLayoutCopy', () => {
  it('localizes header brand and PWA strings', () => {
    const en = getWebLayoutCopy('en');
    expect(en.brandName).toBe('Home Cooks');
    expect(en.cartA11yWithCount(3)).toContain('3');
    expect(en.metaTitle).toContain('Singapore');
    expect(getWebLayoutCopy('zh-Hans').pwaInstallTitle).toBe('安装 SHC');
  });
});
