import { describe, expect, it } from 'vitest';
import { coerceRating } from './ratings';

describe('coerceRating', () => {
  it('returns a number for valid ratings', () => {
    expect(coerceRating(4.5)).toBe(4.5);
    expect(coerceRating('4.2')).toBe(4.2);
  });

  it('returns undefined for missing or fake defaults', () => {
    expect(coerceRating(null)).toBeUndefined();
    expect(coerceRating(undefined)).toBeUndefined();
    expect(coerceRating('')).toBeUndefined();
    expect(coerceRating(0)).toBeUndefined();
    expect(coerceRating(NaN)).toBeUndefined();
  });
});
