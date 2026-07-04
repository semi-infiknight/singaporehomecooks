import { describe, expect, it } from 'vitest';
import { filterCookListings, uniqueListingCuisines } from './cook-listings';

const sample = [
  { id: '1', name: 'Nyonya Laksa', cuisine: 'Peranakan', shc_availability: { paused: false } },
  { id: '2', name: 'Chicken Rice', cuisine: 'Hainanese', shc_availability: { paused: true } },
];

describe('filterCookListings', () => {
  it('filters by search query', () => {
    expect(filterCookListings(sample, { q: 'laksa' })).toHaveLength(1);
  });

  it('filters live listings', () => {
    expect(filterCookListings(sample, { status: 'live' })).toHaveLength(1);
  });

  it('filters paused listings', () => {
    expect(filterCookListings(sample, { status: 'paused' })).toHaveLength(1);
  });

  it('filters by cuisine', () => {
    expect(filterCookListings(sample, { cuisine: 'Hainanese' })).toHaveLength(1);
  });
});

describe('uniqueListingCuisines', () => {
  it('returns sorted unique cuisines', () => {
    expect(uniqueListingCuisines(sample)).toEqual(['Hainanese', 'Peranakan']);
  });
});