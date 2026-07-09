import { describe, expect, it } from 'vitest';
import {
  getCuisineCategoryById,
  scopeProductsByCategory,
  scopeKitchensByCategory,
  topRatedCategoryDishes,
  categoryOfferCopy,
} from './category';
import { MIND_CUISINE_CATEGORIES } from './food-visuals';

const FIXTURE_PRODUCTS: Record<string, unknown>[] = [
  {
    id: 'dish_nasi_lemak_sambal_prawn_001',
    name: 'Nasi Lemak Sambal Prawn',
    cuisine: 'Peranakan',
    cook_id: 'cook_rose_tampines_001',
    cook_name: 'Auntie Rose (Tampines)',
    rating: 4.9,
    price: 12,
    halal: false,
  },
  {
    id: 'dish_ayam_buah_keluak_002',
    name: 'Ayam Buah Keluak',
    cuisine: 'Peranakan',
    cook_id: 'cook_rose_tampines_001',
    cook_name: 'Auntie Rose (Tampines)',
    rating: 4.7,
    price: 15,
    halal: false,
  },
  {
    id: 'dish_devils_curry_003',
    name: "Devil's Curry",
    cuisine: 'Eurasian',
    cook_id: 'cook_doris_katong_002',
    cook_name: 'Auntie Doris (Katong)',
    rating: 4.8,
    price: 14,
    halal: false,
  },
  {
    id: 'dish_rendang_004',
    name: 'Beef Rendang',
    cuisine: 'Malay',
    cook_id: 'cook_siti_bedok_003',
    cook_name: 'Auntie Siti',
    rating: 4.6,
    price: 13,
    halal: true,
  },
];

const FIXTURE_COOKS: Record<string, unknown>[] = [
  { id: 'cook_rose_tampines_001', display_name: 'Auntie Rose (Tampines)', area: 'Tampines' },
  { id: 'cook_doris_katong_002', display_name: 'Auntie Doris (Katong)', area: 'Katong' },
  { id: 'cook_siti_bedok_003', display_name: 'Auntie Siti', area: 'Bedok' },
  { id: 'cook_unrelated_999', display_name: 'Nobody', area: 'Orchard' },
];

describe('getCuisineCategoryById', () => {
  it('resolves known mind-cuisine ids', () => {
    const p = getCuisineCategoryById('Peranakan');
    expect(p?.id).toBe('Peranakan');
    expect(p?.label).toBe('Nyonya');
    expect(MIND_CUISINE_CATEGORIES.some((c) => c.id === 'Peranakan')).toBe(true);
  });

  it('returns All for empty / all', () => {
    expect(getCuisineCategoryById('')?.id).toBe('');
    expect(getCuisineCategoryById('all')?.id).toBe('');
  });

  it('returns null for unknown ids', () => {
    expect(getCuisineCategoryById('NotACuisine')).toBeNull();
  });
});

describe('scopeProductsByCategory', () => {
  it('keeps only in-cuisine products for Peranakan', () => {
    const scoped = scopeProductsByCategory(FIXTURE_PRODUCTS, 'Peranakan');
    expect(scoped).toHaveLength(2);
    expect(scoped.every((p) => p.cuisine === 'Peranakan')).toBe(true);
    expect(scoped.map((p) => p.id)).toContain('dish_nasi_lemak_sambal_prawn_001');
    expect(scoped.map((p) => p.id)).not.toContain('dish_devils_curry_003');
  });

  it('excludes off-cuisine dishes for Eurasian', () => {
    const scoped = scopeProductsByCategory(FIXTURE_PRODUCTS, 'Eurasian');
    expect(scoped).toHaveLength(1);
    expect(scoped[0]?.id).toBe('dish_devils_curry_003');
  });

  it('returns empty for unknown category', () => {
    expect(scopeProductsByCategory(FIXTURE_PRODUCTS, 'Keto')).toEqual([]);
  });

  it('returns empty for null category id', () => {
    expect(scopeProductsByCategory(FIXTURE_PRODUCTS, null)).toEqual([]);
  });

  it('returns all products when category is All (empty id)', () => {
    expect(scopeProductsByCategory(FIXTURE_PRODUCTS, '')).toHaveLength(FIXTURE_PRODUCTS.length);
  });
});

describe('scopeKitchensByCategory', () => {
  it('returns only kitchens with dishes in the category set', () => {
    const peranakan = scopeProductsByCategory(FIXTURE_PRODUCTS, 'Peranakan');
    const kitchens = scopeKitchensByCategory(FIXTURE_COOKS, peranakan, 'Peranakan');
    expect(kitchens).toHaveLength(1);
    expect(kitchens[0]?.id).toBe('cook_rose_tampines_001');
    expect(kitchens.map((k) => k.id)).not.toContain('cook_unrelated_999');
  });

  it('returns empty kitchens when no category products', () => {
    expect(scopeKitchensByCategory(FIXTURE_COOKS, [], 'Peranakan')).toEqual([]);
  });
});

describe('topRatedCategoryDishes', () => {
  it('orders by rating desc and respects limit', () => {
    const peranakan = scopeProductsByCategory(FIXTURE_PRODUCTS, 'Peranakan');
    const top = topRatedCategoryDishes(peranakan, 1);
    expect(top).toHaveLength(1);
    expect(top[0]?.id).toBe('dish_nasi_lemak_sambal_prawn_001');
  });
});

describe('categoryOfferCopy', () => {
  it('includes category label in title', () => {
    const cat = getCuisineCategoryById('Malay');
    const offer = categoryOfferCopy(cat);
    expect(offer.title).toMatch(/Malay/);
    expect(offer.subtitle.length).toBeGreaterThan(10);
  });
});
