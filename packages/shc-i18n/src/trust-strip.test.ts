import { describe, expect, it } from 'vitest';
import { formatTrustStripCopy } from './trust-strip';

describe('formatTrustStripCopy', () => {
  const counters = { cooks: 127, meals_this_month: 4892, areas: 28 };

  it('formats English trust strip labels', () => {
    const copy = formatTrustStripCopy('en', counters);
    expect(copy.cooksLabel).toContain('127');
    expect(copy.cooksLabel).toContain('verified cooks');
    expect(copy.mealsLabel).toContain('4,892');
    expect(copy.collectionLabel).toBe('HDB collection');
  });

  it('formats Mandarin trust strip labels', () => {
    const copy = formatTrustStripCopy('zh-Hans', counters);
    expect(copy.cooksLabel).toContain('127');
    expect(copy.cooksLabel).toContain('家厨');
    expect(copy.allergenSub).toContain('结账');
    expect(copy.collectionLabel).toContain('组屋');
  });
});
