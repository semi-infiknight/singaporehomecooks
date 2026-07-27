import { describe, expect, it } from 'vitest';
import {
  buildCookAreaById,
  extractReorderDishes,
  sortReorderDishesByProximity,
} from './reorder';

describe('buildCookAreaById', () => {
  it('merges cook and product areas', () => {
    const map = buildCookAreaById(
      [{ id: 'c1', area: 'Tampines' }],
      [{ cook_id: 'c2', cook_area: 'Jurong' }]
    );
    expect(map.get('c1')).toBe('Tampines');
    expect(map.get('c2')).toBe('Jurong');
  });
});

describe('extractReorderDishes', () => {
  const cookArea = buildCookAreaById([], [{ cook_id: 'c1', cook_area: 'Tampines' }]);

  it('dedupes dishes from completed orders', () => {
    const dishes = extractReorderDishes(
      [
        {
          shc_status: 'collected',
          cook_id: 'c1',
          items: [
            { product_id: 'p1', name: 'Laksa', price: 8 },
            { product_id: 'p1', name: 'Laksa dup', price: 8 },
          ],
        },
      ],
      cookArea
    );
    expect(dishes).toHaveLength(1);
    expect(dishes[0]?.cook_area).toBe('Tampines');
  });

  it('skips cancelled orders', () => {
    const dishes = extractReorderDishes(
      [{ shc_status: 'cancelled', items: [{ product_id: 'p1', name: 'Laksa', price: 8 }] }],
      cookArea
    );
    expect(dishes).toHaveLength(0);
  });
});

describe('sortReorderDishesByProximity', () => {
  it('orders dishes by cook area distance', () => {
    const dishes = [
      { id: 'a', name: 'Far', cook_area: 'Jurong West' },
      { id: 'b', name: 'Near', cook_area: 'Tampines' },
    ];
    const sorted = sortReorderDishesByProximity(dishes, { lat: 1.35, lng: 103.94 });
    expect(sorted[0]?.id).toBe('b');
  });
});
