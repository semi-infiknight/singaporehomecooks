import { describe, expect, it } from 'vitest';
import { getLocalizedPromo, getLocalizedOccasions, getOccasionDishesTitle } from './promo-occasion';

describe('promo-occasion i18n', () => {
  it('localizes web promo cards', () => {
    const promo = getLocalizedPromo('en', 'promo-raya');
    expect(promo?.title).toContain('Hari Raya');
    const zh = getLocalizedPromo('zh-Hans', 'promo-raya');
    expect(zh?.title).toContain('开斋节');
  });

  it('localizes occasion chips', () => {
    const occasions = getLocalizedOccasions('zh-Hans');
    expect(occasions.find((o) => o.id === 'Chinese New Year')?.chipLabel).toBe('新年');
  });

  it('builds occasion dish section title', () => {
    expect(getOccasionDishesTitle('en', 'Hari Raya')).toContain('Hari Raya');
    expect(getOccasionDishesTitle('zh-Hans', '')).toBe('附近热门');
  });
});
