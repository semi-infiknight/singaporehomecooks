import { describe, expect, it } from 'vitest';
import {
  scopeProductsByKitchen,
  kitchenRatingLabel,
  kitchenOpenStatus,
  kitchenCardOpenProps,
  kitchenTagList,
  kitchenTiffinPlanRows,
  kitchenDishPriceDollars,
  kitchenDishPriceLabel,
  kitchenRatingSummary,
  kitchenRatingBuckets,
  kitchenDemoReviews,
  sortKitchenReviews,
  kitchenCollectionHours,
  kitchenAboutPoints,
  kitchenMenuSections,
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

describe('kitchenCardOpenProps', () => {
  it('maps kitchenOpenStatus to card props', () => {
    expect(kitchenCardOpenProps({ status: 'active', collection_instructions: 'Sat 6–8pm HDB void deck' })).toEqual({
      isOpen: true,
      closesAt: 'Sat 6–8pm HDB void deck',
    });
  });

  it('returns empty when cook missing', () => {
    expect(kitchenCardOpenProps(null)).toEqual({});
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

describe('kitchenDishPriceDollars / Label', () => {
  it('uses price as dollars when present (Gourmeat parity)', () => {
    // Live tiffin API: price=60, price_cents=6000 → display S$60 not S$1
    expect(kitchenDishPriceDollars({ price: 60, price_cents: 6000 })).toBe(60);
    expect(kitchenDishPriceLabel({ price: 60, price_cents: 6000 })).toBe('S$60');
  });

  it('does not divide dollars by 100 for values > 50', () => {
    expect(kitchenDishPriceDollars({ price: 60 })).toBe(60);
    expect(kitchenDishPriceLabel({ price: 60 })).toBe('S$60');
    expect(kitchenDishPriceLabel({ price: 12 })).toBe('S$12');
  });

  it('falls back to price_cents/100 when price missing', () => {
    expect(kitchenDishPriceDollars({ price_cents: 1200 })).toBe(12);
    expect(kitchenDishPriceLabel({ price_cents: 1250 })).toBe('S$12.50');
  });

  it('returns null when no price fields', () => {
    expect(kitchenDishPriceDollars({})).toBeNull();
    expect(kitchenDishPriceLabel({})).toBeNull();
  });
});

describe('kitchenRatingSummary + buckets', () => {
  it('formats rating with review count', () => {
    const s = kitchenRatingSummary(ROSE);
    expect(s.rating).toBe(4.8);
    expect(s.reviewCount).toBe(24);
    expect(s.label).toBe('4.8 (24)');
  });

  it('returns 5 buckets summing to ~1', () => {
    const buckets = kitchenRatingBuckets(4.8);
    expect(buckets).toHaveLength(5);
    expect(buckets[0]?.key).toBe('excellent');
    const sum = buckets.reduce((a, b) => a + b.share, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});

describe('kitchenDemoReviews + sort', () => {
  it('is deterministic per cook id', () => {
    const a = kitchenDemoReviews('cook_rose_tampines_001');
    const b = kitchenDemoReviews('cook_rose_tampines_001');
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
    expect(a[0]?.author).toBeTruthy();
  });

  it('sorts highest first', () => {
    const revs = kitchenDemoReviews('cook_x', 6);
    const sorted = sortKitchenReviews(revs, 'highest');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1]!.rating).toBeGreaterThanOrEqual(sorted[i]!.rating);
    }
  });
});

describe('kitchenCollectionHours + about + menu sections', () => {
  it('returns collection hour slots', () => {
    const hours = kitchenCollectionHours({ collection_days: [5, 6] });
    expect(hours.length).toBeGreaterThanOrEqual(2);
    expect(hours[0]?.window).toMatch(/pm|am|Collect/i);
  });

  it('includes trust about points', () => {
    const pts = kitchenAboutPoints(ROSE);
    expect(pts.some((p) => p.toLowerCase().includes('allergen') || p.toLowerCase().includes('hdb'))).toBe(
      true
    );
  });

  it('groups menu by occasion or cuisine', () => {
    const sections = kitchenMenuSections(PRODUCTS);
    expect(sections.length).toBeGreaterThan(0);
    const allIds = sections.flatMap((s) => s.dishes.map((d) => d.id));
    expect(allIds).toContain('dish_a');
    expect(allIds).toContain('dish_c');
  });
});
