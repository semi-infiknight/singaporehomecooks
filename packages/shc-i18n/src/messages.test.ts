import { describe, expect, it } from 'vitest';
import { normalizeLocale, t } from './messages';

describe('@shc/i18n', () => {
  it('normalizes zh locales to zh-Hans', () => {
    expect(normalizeLocale('zh-CN')).toBe('zh-Hans');
    expect(normalizeLocale('zh-SG')).toBe('zh-Hans');
  });

  it('defaults unknown locales to en', () => {
    expect(normalizeLocale('ms-SG')).toBe('en');
    expect(normalizeLocale()).toBe('en');
  });

  it('returns Mandarin checkout minimum message', () => {
    expect(t('zh-Hans', 'checkout.minimum_order')).toContain('50');
  });
});
