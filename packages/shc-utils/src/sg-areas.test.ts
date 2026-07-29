import { describe, expect, it } from 'vitest';
import { cookAreaSuggestions, normalizeCookAreaInput } from './sg-areas';

describe('sg-areas cook picker helpers', () => {
  it('normalizes aliases and legacy labels to canonical area names', () => {
    expect(normalizeCookAreaInput('katong')).toBe('Katong / Joo Chiat');
    expect(normalizeCookAreaInput('Tampines')).toBe('Tampines');
    expect(normalizeCookAreaInput('  Jurong  ')).toBe('Jurong West');
    expect(normalizeCookAreaInput('Custom Estate')).toBe('Custom Estate');
  });

  it('filters area suggestions by query', () => {
    expect(cookAreaSuggestions('tam', 4)).toEqual(['Tampines']);
    expect(cookAreaSuggestions('', 3).length).toBeGreaterThan(3);
  });
});
