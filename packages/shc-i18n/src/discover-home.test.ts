import { describe, expect, it } from 'vitest';
import { getDiscoverHomeCopy } from './discover-home';

describe('getDiscoverHomeCopy', () => {
  it('localizes homepage headline and empty state', () => {
    const en = getDiscoverHomeCopy('en');
    expect(en.headline).toContain('Hungry');
    expect(en.calorieApprox(420)).toContain('420');
    const zh = getDiscoverHomeCopy('zh-Hans');
    expect(zh.guestBrowseTitle).toBe('访客浏览');
  });
});
