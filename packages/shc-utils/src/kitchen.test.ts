import { describe, expect, it } from 'vitest';
import {
  scopeProductsByKitchen,
  kitchenRatingLabel,
  kitchenOpenStatus,
  kitchenTagList,
  kitchenTiffinPlanRows,
} from './kitchen';

const PRODUCTS: Record<string, unknown>[] = [
  {
    id: 'dish_a',
    name: 'Nasi Lemak',
    cook_id: 'cook_rose_tampines_001',
    cook_name: 'Auntie Rose (Tampines)',
    cuisine: 'Peranakan',
    price: 12,
  },
  {
    id: 'dish_b',
    name: 'Ayam Buah Keluak',
    cook_id: 'cook_rose_tampines_001',
    cook_name: 'Auntie Rose (Tampines)',
    cuisine: 'Peranakan',
    price: 15,
  },
  {
    id: 'dish_c',
    name: "Devil's Curry",
    cook_id: 'cook_doris_katong_002',
    cook_name: 'Auntie Doris (Katong)',
    cuisine: 'Eurasian',
    price: 14,
  },
];

const ROSE = {
  id: 'cook_rose_tampines_001',
  slug: 'rose-tampines',
  display_name: 'Auntie Rose (Tampines)',
  area: 'Tampines',
  story: 'Katong recipes since 1972',
  cuisine: 'Peranakan',
  rating: 4.8,
  review_count: 24,
  orders: 120,
  status: 'active',
  sfa_reg_number: 'SFA-123',
};

describe('scopeProductsByKitchen', () => {
  it('keeps only this kitchen’s dishes by cook_id', () => {
    const menu = scopeProductsByKitchen(PRODUCTS, ROSE);
    expect(menu).toHaveLength(2);
    expect(menu.every((p) => p.cook_id === ROSE.id)).toBe(true);
    expect(menu.map((p) => p.id)).not.toContain('dish_c');
  });

  it('excludes other cooks completely', () => {
    const menu = scopeProductsByKitchen(PRODUCTS, {
      id: 'cook_doris_katong_002',
      display_name: 'Auntie Doris (Katong)',
    });
    expect(menu).toHaveLength(1);
    expect(menu[0]?.id).toBe('dish_c');
  });

  it('returns empty for unknown kitchen', () => {
    expect(scopeProductsByKitchen(PRODUCTS, { id: 'cook_nobody' })).toEqual([]);
  });

  it('returns empty when cook is null', () => {
    expect(scopeProductsByKitchen(PRODUCTS, null)).toEqual([]);
  });

  it('matches by display name when cook_id on product differs slightly', () => {
    const fuzzy = [
      ...PRODUCTS,
      {
        id: 'dish_x',
        name: 'Extra',
        cook_id: 'other',
        cook_name: 'Auntie Rose',
      },
    ];
    const menu = scopeProductsByKitchen(fuzzy, ROSE);
    expect(menu.map((p) => p.id)).toContain('dish_x');
  });
});

describe('kitchenRatingLabel', () => {
  it('formats rating with review count', () => {
    expect(kitchenRatingLabel(4.8, 24)).toBe('4.8 (24)');
  });

  it('returns null when no rating', () => {
    expect(kitchenRatingLabel(null)).toBeNull();
  });
});

describe('kitchenOpenStatus', () => {
  it('marks active kitchens open', () => {
    const s = kitchenOpenStatus(ROSE);
    expect(s.isOpen).toBe(true);
    expect(s.label).toBe('Open');
  });

  it('marks paused kitchens closed', () => {
    const s = kitchenOpenStatus({ ...ROSE, status: 'paused' });
    expect(s.isOpen).toBe(false);
    expect(s.label).toBe('Closed');
  });
});

describe('kitchenTagList', () => {
  it('includes cuisine area and trust tags', () => {
    const tags = kitchenTagList(ROSE);
    expect(tags).toContain('Peranakan');
    expect(tags).toContain('Tampines');
    expect(tags.some((t) => t.includes('SFA'))).toBe(true);
  });
});

describe('kitchenTiffinPlanRows', () => {
  it('maps meals options to priced rows via real price fn', () => {
    const rows = kitchenTiffinPlanRows([2, 3], (n) => n * 5);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ meals: 2, pricePerMeal: 10, label: '2 meals / week' });
    expect(rows[1]?.pricePerMeal).toBe(15);
  });
});
