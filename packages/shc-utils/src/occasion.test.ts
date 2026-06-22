import { describe, it, expect } from 'vitest';
import { matchOccasionTag, productMatchesOccasion } from './occasion';

describe('occasion matching', () => {
  it('matches slug tags to display labels', () => {
    expect(matchOccasionTag('hari-raya', 'Hari Raya')).toBe(true);
    expect(matchOccasionTag('family-gathering', 'Family Gathering')).toBe(true);
    expect(matchOccasionTag('deepavali', 'Deepavali')).toBe(true);
  });

  it('filters product occasion tags', () => {
    expect(productMatchesOccasion(['family-gathering', 'hari-raya'], 'Hari Raya')).toBe(true);
    expect(productMatchesOccasion(['family-gathering'], 'Christmas')).toBe(false);
    expect(productMatchesOccasion(['family-gathering'], '')).toBe(true);
  });
});