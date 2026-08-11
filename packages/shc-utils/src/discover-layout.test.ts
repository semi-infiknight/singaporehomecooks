import { describe, it, expect } from 'vitest';
import {
  DISCOVER_MAX_CAL_PRESETS,
  DISCOVER_MODES,
  clearedDiscoverFilters,
  coerceMaxCal,
  discoverActiveFilterCount,
  discoverActiveFilters,
  discoverEmptyCopy,
  discoverFilterSummary,
  discoverForYouRail,
  discoverGridHeading,
  discoverKitchensHeading,
  discoverSectionIds,
  isDiscoverMode,
  parseMaxCalFromQuery,
  resolveEffectiveMaxCal,
  snapMaxCalSliderValue,
  stripMaxCalFromQuery,
  toggleMaxCalPreset,
  DISCOVER_MAX_CAL_SLIDER,
} from './discover-layout';

const browsing = { isSearching: false, isGuest: false, mode: 'dishes' as const, hasPromos: true, hasForYou: true };

describe('discoverSections', () => {
  it('keeps Dishes · Kitchens spine while searching (no compact panel only)', () => {
    expect(discoverSectionIds({ ...browsing, isSearching: true, mode: 'dishes' })).toEqual([
      'browse-switch',
      'dish-grid',
    ]);
    expect(discoverSectionIds({ ...browsing, isSearching: true, mode: 'kitchens' })).toEqual([
      'browse-switch',
      'kitchen-list',
    ]);
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

  it('never shows guest sign-in bar (guest checkout is first-class)', () => {
    expect(discoverSectionIds({ ...browsing, isGuest: true })).not.toContain('guest');
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
  it('counts every narrowing filter and reflects any maxCal ceiling', () => {
    expect(
      discoverActiveFilters({
        mealType: 'lunch',
        cuisine: 'Malay',
        halalOnly: true,
        veganOnly: true,
        includeIngredient: 'chicken',
        excludeNuts: true,
        maxCal: 500,
      })
    ).toEqual(['Lunch', 'Malay', 'Halal', 'Vegan', 'Chicken', 'No nuts', 'Under 500 cal']);
    expect(discoverActiveFilters({ maxCal: 50 })).toEqual(['Under 50 cal']);
    expect(discoverActiveFilters({ maxCal: 1000 })).toEqual(['Under 1000 cal']);
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

  it('exposes multi value calorie presets including 50, 500, 1000', () => {
    expect(DISCOVER_MAX_CAL_PRESETS).toEqual(expect.arrayContaining([50, 500, 1000]));
    expect(toggleMaxCalPreset(undefined, 50)).toBe(50);
    expect(toggleMaxCalPreset(50, 50)).toBeUndefined();
    expect(toggleMaxCalPreset(50, 1000)).toBe(1000);
    expect(coerceMaxCal('800')).toBe(800);
    expect(coerceMaxCal(-1)).toBeUndefined();
  });

  it('parses any typed under-X calorie amount from search', () => {
    expect(parseMaxCalFromQuery('under 450')).toBe(450);
    expect(parseMaxCalFromQuery('< 75 cal')).toBe(75);
    expect(parseMaxCalFromQuery('less than 1000 calories')).toBe(1000);
    expect(parseMaxCalFromQuery('max 200 kcal')).toBe(200);
    expect(parseMaxCalFromQuery('chicken 350 cal')).toBe(350);
    expect(stripMaxCalFromQuery('chicken under 400 cal')).toBe('chicken');
    expect(resolveEffectiveMaxCal(500, 'under 200')).toBe(200);
    expect(resolveEffectiveMaxCal(undefined, 'under 333')).toBe(333);
  });

  it('snaps slider values into the under-X cal range', () => {
    expect(snapMaxCalSliderValue(447)).toBe(450);
    expect(snapMaxCalSliderValue(10)).toBe(DISCOVER_MAX_CAL_SLIDER.min);
    expect(snapMaxCalSliderValue(9999)).toBe(DISCOVER_MAX_CAL_SLIDER.max);
  });
});

describe('headings', () => {
  it('labels the grid by mode and filter', () => {
    expect(discoverGridHeading('dishes', {}).title).toBe('All dishes');
    expect(discoverGridHeading('dishes', { cuisine: 'Nyonya' }).title).toBe('Nyonya dishes');
  });

  it('only claims proximity when browse location is set', () => {
    expect(discoverKitchensHeading(4, true).title).toBe('4 kitchens near you');
    const noLocation = discoverKitchensHeading(4, false);
    expect(noLocation.title).toBe('4 home kitchens');
    expect(noLocation.hint).toMatch(/location/i);
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
