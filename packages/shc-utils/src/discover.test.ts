import { describe, expect, it } from 'vitest';
import {
  filterDiscoverProducts,
  productDeclaresNuts,
  productMatchesIncludeIngredient,
} from './discover';
import { isVeganDish } from './restaurant-ux';

/** Representative fixtures for multi-criteria discover filters. */
const FIXTURES: Record<string, unknown>[] = [
  {
    id: 'chicken-rendang',
    name: 'Chicken Rendang',
    cook_name: 'Auntie Mei',
    cuisine: 'Malay',
    calories: 620,
    ingredients: [{ name: 'Chicken' }, { name: 'Coconut milk' }, { name: 'Spices' }],
    allergen_tiers: { tier1: ['Chicken', 'Dairy'], tier2: [], tier3: [] },
    halal: true,
  },
  {
    id: 'vegan-tofu',
    name: 'Tofu Sayur Lodeh',
    cook_name: 'Green Kitchen',
    cuisine: 'Malay',
    calories: 380,
    ingredients: [{ name: 'Tofu' }, { name: 'Coconut milk' }, { name: 'Vegetables' }],
    diet_tags: ['vegan'],
    allergen_tiers: { tier1: [], tier2: [], tier3: [] },
    allergen_none_confirmed: true,
    vegan: true,
  },
  {
    id: 'nut-satay',
    name: 'Chicken Satay with Peanut Sauce',
    cook_name: 'Uncle Raj',
    cuisine: 'Malay',
    calories: 450,
    ingredients: [{ name: 'Chicken' }, { name: 'Peanut sauce' }],
    allergen_tiers: { tier1: ['Chicken', 'Nuts (Peanuts)'], tier2: [], tier3: [] },
    halah: true,
  },
  {
    id: 'high-cal-biryani',
    name: 'Mutton Biryani',
    cook_name: 'Spice Corner',
    cuisine: 'Indian',
    calories: 780,
    ingredients: [{ name: 'Mutton' }, { name: 'Rice' }, { name: 'Ghee' }],
    allergen_tiers: { tier1: ['Dairy'], tier2: [], tier3: [] },
  },
  {
    id: 'veg-paneer',
    name: 'Paneer Thoran',
    cook_name: 'Auntie Rose',
    cuisine: 'Indian',
    calories: 420,
    ingredients: [{ name: 'Paneer' }, { name: 'Coconut' }, { name: 'Spices' }],
    diet_tags: ['vegetarian'],
    allergen_tiers: { tier1: ['Dairy'], tier2: [], tier3: [] },
  },
  {
    id: 'light-ayam',
    name: 'Ayam Panggang Light',
    cook_name: 'Fit Kitchen',
    cuisine: 'Malay',
    calories: 390,
    ingredients: [{ name: 'Chicken breast' }, { name: 'Herbs' }],
    allergen_tiers: { tier1: ['Chicken'], tier2: [], tier3: [] },
    halah: true,
  },
  {
    id: 'ultra-light-salad',
    name: 'Cucumber Salad',
    cook_name: 'Green Kitchen',
    cuisine: 'Malay',
    calories: 40,
    ingredients: [{ name: 'Cucumber' }, { name: 'Lime' }],
    diet_tags: ['vegan'],
    vegan: true,
    allergen_tiers: { tier1: [], tier2: [], tier3: [] },
  },
  {
    id: 'mid-cal-soup',
    name: 'Clear Chicken Broth',
    cook_name: 'Fit Kitchen',
    cuisine: 'Chinese',
    calories: 120,
    ingredients: [{ name: 'Chicken' }, { name: 'Stock' }],
    allergen_tiers: { tier1: ['Chicken'], tier2: [], tier3: [] },
    halah: true,
  },
];

// fix accidental typo keys from earlier edits
for (const f of FIXTURES) {
  if ('halah' in f) {
    f.halal = f.halah;
    delete f.halah;
  }
}

describe('productMatchesIncludeIngredient / productDeclaresNuts / isVeganDish', () => {
  it('matches chicken include on name and ingredients (incl. ayam)', () => {
    expect(productMatchesIncludeIngredient(FIXTURES[0]!, 'chicken')).toBe(true);
    expect(productMatchesIncludeIngredient(FIXTURES[5]!, 'chicken')).toBe(true);
    expect(productMatchesIncludeIngredient(FIXTURES[1]!, 'chicken')).toBe(false);
  });

  it('detects nuts from allergen tiers and ingredients', () => {
    expect(productDeclaresNuts(FIXTURES[2]!)).toBe(true);
    expect(productDeclaresNuts(FIXTURES[0]!)).toBe(false);
    expect(productDeclaresNuts(FIXTURES[1]!)).toBe(false);
  });

  it('classifies vegan vs paneer vegetarian', () => {
    expect(isVeganDish(FIXTURES[1]!)).toBe(true);
    expect(isVeganDish(FIXTURES[4]!)).toBe(false);
    expect(isVeganDish(FIXTURES[0]!)).toBe(false);
  });
});

describe('filterDiscoverProducts multi-criteria', () => {
  it('chicken-include keeps chicken-related only', () => {
    const out = filterDiscoverProducts(FIXTURES, { includeIngredient: 'chicken' });
    const ids = out.map((p) => p.id);
    expect(ids).toContain('chicken-rendang');
    expect(ids).toContain('nut-satay');
    expect(ids).toContain('light-ayam');
    expect(ids).toContain('mid-cal-soup');
    expect(ids).not.toContain('vegan-tofu');
    expect(ids).not.toContain('high-cal-biryani');
    expect(ids).not.toContain('veg-paneer');
  });

  it('vegan keeps vegan only', () => {
    const out = filterDiscoverProducts(FIXTURES, { veganOnly: true });
    expect(out.map((p) => p.id).sort()).toEqual(['ultra-light-salad', 'vegan-tofu'].sort());
  });

  it('excludeNuts drops nut dishes', () => {
    const out = filterDiscoverProducts(FIXTURES, { excludeNuts: true });
    expect(out.map((p) => p.id)).not.toContain('nut-satay');
    expect(out.length).toBe(FIXTURES.length - 1);
  });

  it('maxCal 50 / 500 / 1000 use variable ceilings', () => {
    const under50 = filterDiscoverProducts(FIXTURES, { maxCal: 50 }).map((p) => p.id);
    expect(under50).toEqual(['ultra-light-salad']);
    expect(under50).not.toContain('mid-cal-soup');
    expect(under50).not.toContain('light-ayam');
    expect(under50).not.toContain('high-cal-biryani');

    const under500 = filterDiscoverProducts(FIXTURES, { maxCal: 500 }).map((p) => p.id);
    expect(under500).toContain('ultra-light-salad');
    expect(under500).toContain('mid-cal-soup');
    expect(under500).toContain('light-ayam');
    expect(under500).toContain('vegan-tofu');
    expect(under500).not.toContain('chicken-rendang');
    expect(under500).not.toContain('high-cal-biryani');

    const under1000 = filterDiscoverProducts(FIXTURES, { maxCal: 1000 }).map((p) => p.id);
    expect(under1000).toContain('chicken-rendang');
    expect(under1000).toContain('high-cal-biryani');
    expect(under1000.length).toBe(FIXTURES.length);
  });

  it('parses free-form calorie ceilings from search query (any X)', () => {
    const under450 = filterDiscoverProducts(FIXTURES, { query: 'under 450 cal' }).map((p) => p.id);
    expect(under450).toContain('ultra-light-salad');
    expect(under450).toContain('mid-cal-soup');
    expect(under450).toContain('light-ayam');
    expect(under450).not.toContain('chicken-rendang'); // 620

    const under120 = filterDiscoverProducts(FIXTURES, { query: '<120' }).map((p) => p.id);
    expect(under120).toContain('ultra-light-salad');
    expect(under120).toContain('mid-cal-soup');
    expect(under120).not.toContain('light-ayam');

    // dish words + cal phrase still match dish names
    const chickenLight = filterDiscoverProducts(FIXTURES, {
      query: 'chicken under 400',
    }).map((p) => p.id);
    expect(chickenLight).toContain('light-ayam');
    expect(chickenLight).toContain('mid-cal-soup');
    expect(chickenLight).not.toContain('chicken-rendang');
  });

  it('AND maxCal 50 with vegan keeps only ultra-light vegan', () => {
    const out = filterDiscoverProducts(FIXTURES, { veganOnly: true, maxCal: 50 });
    expect(out.map((p) => p.id)).toEqual(['ultra-light-salad']);
  });

  it('AND maxCal 1000 with chicken include keeps chicken dishes under 1000', () => {
    const out = filterDiscoverProducts(FIXTURES, { includeIngredient: 'chicken', maxCal: 1000 });
    const ids = out.map((p) => p.id);
    expect(ids).toContain('chicken-rendang');
    expect(ids).toContain('mid-cal-soup');
    expect(ids).not.toContain('vegan-tofu');
  });

  it('AND combines chicken + no-nuts + maxCal 500', () => {
    const chickenNoNutsLight = filterDiscoverProducts(FIXTURES, {
      includeIngredient: 'chicken',
      excludeNuts: true,
      maxCal: 500,
    });
    expect(chickenNoNutsLight.map((p) => p.id).sort()).toEqual(['light-ayam', 'mid-cal-soup'].sort());
  });

  it('all four criteria active only returns dishes matching every criterion', () => {
    const plantChicken: Record<string, unknown> = {
      id: 'plant-chicken',
      name: 'Plant Chicken Nuggets',
      calories: 350,
      ingredients: [{ name: 'Soy chicken' }, { name: 'Wheat' }],
      diet_tags: ['vegan'],
      vegan: true,
      allergen_tiers: { tier1: ['Soy', 'Gluten'], tier2: [], tier3: [] },
    };
    const four = filterDiscoverProducts([...FIXTURES, plantChicken], {
      includeIngredient: 'chicken',
      veganOnly: true,
      excludeNuts: true,
      maxCal: 500,
    });
    expect(four.map((p) => p.id)).toEqual(['plant-chicken']);
  });
});
