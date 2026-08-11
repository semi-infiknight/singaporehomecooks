import { describe, expect, it } from 'vitest';
import { buildSearchResultGroups } from './search-results';

describe('buildSearchResultGroups', () => {
  const products = [
    {
      id: 'd1',
      name: 'Nasi Lemak',
      cook_name: 'Auntie Rose',
      cook_slug: 'auntie-rose',
      cook_id: 'c1',
      price: 8,
      area: 'Tampines',
    },
    {
      id: 'd2',
      name: 'Nasi Lemak',
      cook_name: 'Uncle Tan',
      cook_slug: 'uncle-tan',
      cook_id: 'c2',
      price: 9,
      area: 'Bedok',
    },
    {
      id: 'd3',
      name: 'Laksa',
      cook_name: 'Auntie Rose',
      cook_slug: 'auntie-rose',
      cook_id: 'c1',
      price: 7,
    },
  ];

  it('groups kitchens for a dish query and counts kitchens per dish name', () => {
    const g = buildSearchResultGroups(products, 'nasi');
    expect(g.kitchens.length).toBe(2);
    expect(g.kitchens.every((k) => k.matchingDishCount >= 1)).toBe(true);
    const nasiRows = g.dishes.filter((d) => /nasi/i.test(d.name));
    expect(nasiRows[0]?.kitchenCount).toBe(2);
    expect(nasiRows[0]?.kitchenLabel).toMatch(/Available from 2 kitchens/i);
  });

  it('includes kitchens when query matches cook name', () => {
    const g = buildSearchResultGroups(products, 'rose');
    expect(g.kitchens.some((k) => k.routeKey === 'auntie-rose')).toBe(true);
  });

  it('provides routeKey for kitchen navigation', () => {
    const g = buildSearchResultGroups(products, 'laksa');
    expect(g.kitchens[0]?.routeKey).toBeTruthy();
  });
});
