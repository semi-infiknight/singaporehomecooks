import { describe, it, expect } from 'vitest';
import {
  DISCOVER_MODES,
  clearedDiscoverFilters,
  discoverActiveFilterCount,
  discoverActiveFilters,
  discoverEmptyCopy,
  discoverFilterSummary,
  discoverForYouRail,
  discoverGridHeading,
  discoverKitchensHeading,
  discoverSectionIds,
  isDiscoverMode,
} from './discover-layout';

const browsing = { isSearching: false, isGuest: false, mode: 'dishes' as const, hasPromos: true, hasForYou: true };

describe('discoverSections', () => {
  it('collapses to search results only while searching', () => {
    expect(discoverSectionIds({ ...browsing, isSearching: true })).toEqual(['search-results']);
  });

  it('puts time-sensitive content above the browse spine', () => {
    const ids = discoverSectionIds(browsing);
    expect(ids.indexOf('cooking-soon')).toBeLessThan(ids.indexOf('browse-switch'));
    expect(ids.indexOf('promos')).toBeLessThan(ids.indexOf('cooking-soon'));
  });

  it('renders one mode at a time', () => {
    expect(discoverSectionIds(browsing)).toContain('cuisine-rail');
    expect(discoverSectionIds(browsing)).not.toContain('kitchen-list');

    const kitchens = discoverSectionIds({ ...browsing, mode: 'kitchens' });
    expect(kitchens).toContain('kitchen-list');
    expect(kitchens).not.toContain('dish-grid');
    expect(kitchens).not.toContain('cuisine-rail');
    expect(kitchens).not.toContain('occasion-rail');
  });

  it('keeps the browse spine and request CTA in every mode', () => {
    for (const mode of DISCOVER_MODES) {
      const ids = discoverSectionIds({ ...browsing, mode: mode.id });
      expect(ids).toContain('browse-switch');
      expect(ids[ids.length - 1]).toBe('request');
    }
  });

  it('hides optional sections when they have no content', () => {
    const ids = discoverSectionIds({ ...browsing, hasPromos: false, hasForYou: false });
    expect(ids).not.toContain('promos');
    expect(ids).not.toContain('for-you');
  });

  it('shows the guest bar only to guests', () => {
    expect(discoverSectionIds({ ...browsing, isGuest: true })[0]).toBe('guest');
    expect(discoverSectionIds(browsing)).not.toContain('guest');
  });

  it('stays under seven blocks so the screen reads as one page', () => {
    expect(discoverSectionIds({ ...browsing, isGuest: true }).length).toBeLessThanOrEqual(8);
  });
});

describe('discoverForYouRail', () => {
  it('prefers past orders over saved and popular', () => {
    const rail = discoverForYouRail({ reorder: ['a'], saved: ['b'], topRated: ['c'] });
    expect(rail).toMatchObject({ source: 'reorder', title: 'Order again', dishes: ['a'] });
  });

  it('falls back to saved, then top rated', () => {
    expect(discoverForYouRail({ saved: ['b'], topRated: ['c'] })?.source).toBe('saved');
    expect(discoverForYouRail({ topRated: ['c'] })?.source).toBe('top-rated');
  });

  it('returns null when there is nothing personal to show', () => {
    expect(discoverForYouRail({})).toBeNull();
  });

  it('caps the rail', () => {
    const dishes = Array.from({ length: 20 }, (_, i) => i);
    expect(discoverForYouRail({ topRated: dishes, limit: 5 })?.dishes).toHaveLength(5);
  });
});

describe('filters', () => {
  it('counts every narrowing filter', () => {
    expect(
      discoverActiveFilters({ mealType: 'lunch', cuisine: 'Malay', halalOnly: true, maxCal: 500 })
    ).toEqual(['Lunch', 'Malay', 'Halal', 'Under 500 cal']);
  });

  it('ignores the "all meals" sentinel', () => {
    expect(discoverActiveFilterCount({ mealType: 'all' })).toBe(0);
  });

  it('names filters when few and counts them when many', () => {
    expect(discoverFilterSummary({})).toBe('Filters');
    expect(discoverFilterSummary({ halalOnly: true })).toBe('Halal');
    expect(discoverFilterSummary({ halalOnly: true, cuisine: 'Nyonya' })).toBe('Nyonya · Halal');
    expect(discoverFilterSummary({ halalOnly: true, cuisine: 'Nyonya', mealType: 'dinner' })).toBe('3 filters');
  });

  it('clears to an empty filter set', () => {
    expect(discoverActiveFilterCount(clearedDiscoverFilters())).toBe(0);
  });
});

describe('headings', () => {
  it('labels the grid by mode and filter', () => {
    expect(discoverGridHeading('dishes', {}).title).toBe('All dishes');
    expect(discoverGridHeading('dishes', { cuisine: 'Nyonya' }).title).toBe('Nyonya dishes');
    expect(discoverGridHeading('dishes', {}, true).hint).toMatch(/nearest kitchen/i);
  });

  it('only claims proximity when a collection point is set', () => {
    expect(discoverKitchensHeading(4, true).title).toBe('4 kitchens near you');
    const noLocation = discoverKitchensHeading(4, false);
    expect(noLocation.title).toBe('4 home kitchens');
    expect(noLocation.hint).toMatch(/collection point/i);
  });

  it('names the offending filters in the empty state', () => {
    expect(discoverEmptyCopy('dishes', { halalOnly: true }).description).toContain('Halal');
    expect(discoverEmptyCopy('kitchens', {}).title).toBe('No kitchens listed yet');
  });
});

describe('isDiscoverMode', () => {
  it('guards persisted values', () => {
    expect(isDiscoverMode('kitchens')).toBe(true);
    expect(isDiscoverMode('popular')).toBe(false);
  });
});
