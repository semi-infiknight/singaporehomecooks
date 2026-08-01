import { describe, expect, it } from 'vitest';
import {
  cookListingE2eTestId,
  E2E_COOK_SEED_LISTING,
  filterCookListings,
  normalizeRouteParam,
  resolveCookListingById,
  resolveCookListingsForDisplay,
  uniqueListingCuisines,
} from './cook-listings';

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

describe('resolveCookListingsForDisplay (Maestro seed)', () => {
  it('injects E2E seed when empty and maestro flag set', () => {
    const rows = resolveCookListingsForDisplay([], { maestroE2e: true });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(E2E_COOK_SEED_LISTING);
  });

  it('keeps API listings when present', () => {
    expect(resolveCookListingsForDisplay(sample as any)).toEqual(sample);
  });

  it('assigns listing-card-e2e testID to seed row', () => {
    expect(cookListingE2eTestId(E2E_COOK_SEED_LISTING, 0)).toBe('listing-card-e2e');
    expect(cookListingE2eTestId({ id: 'abc' }, 1)).toBe('listing-card-abc');
  });
});

describe('normalizeRouteParam', () => {
  it('unwraps array params', () => {
    expect(normalizeRouteParam(['dish_abc'])).toBe('dish_abc');
  });
});

describe('resolveCookListingById', () => {
  it('finds API listing by id', () => {
    expect(resolveCookListingById(sample as any, '2')?.name).toBe('Chicken Rice');
  });

  it('falls back to E2E seed when empty and maestro flag set', () => {
    const row = resolveCookListingById([], E2E_COOK_SEED_LISTING.id, { maestroE2e: true });
    expect(row?.id).toBe('e2e-seed');
  });
});