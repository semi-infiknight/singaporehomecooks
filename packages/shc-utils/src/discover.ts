import { productMatchesOccasion } from './occasion';
import { filterProductsByMealType, type MealTypeId } from './meal-type';
import { isVeganDish, isVegetarianDish } from './restaurant-ux';
import { resolveEffectiveMaxCal, stripMaxCalFromQuery } from './discover-layout';

export type DiscoverFilterOpts = {
  query?: string;
  occasion?: string;
  cuisine?: string;
  mealType?: MealTypeId;
  halalOnly?: boolean;
  vegetarianOnly?: boolean;
  /** Lifestyle: vegan-only (stricter than vegetarian). */
  veganOnly?: boolean;
  /**
   * Ingredient / protein include — free-text token matched against name,
   * ingredients, tags, and allergen tiers (e.g. "chicken").
   */
  includeIngredient?: string;
  /** Exclude dishes that declare nut allergens / nut ingredients. */
  excludeNuts?: boolean;
  maxCal?: number;
};

const NUT_KEYWORDS = [
  'nut',
  'nuts',
  'peanut',
  'peanuts',
  'almond',
  'cashew',
  'walnut',
  'pistachio',
  'hazelnut',
  'pecan',
  'macadamia',
  'tree nut',
  'tree nuts',
];

/** Flatten name, tags, ingredients, and allergen tiers for include/exclude matching. */
export function productIngredientHaystack(product: Record<string, unknown>): string {
  const parts: string[] = [String(product.name || ''), String(product.cuisine || '')];
  const tags = Array.isArray(product.occasion_tags) ? product.occasion_tags : [];
  for (const t of tags) parts.push(String(t));
  const diet = Array.isArray(product.diet_tags) ? product.diet_tags : [];
  for (const t of diet) parts.push(String(t));
  const ingredients = Array.isArray(product.ingredients) ? product.ingredients : [];
  for (const row of ingredients) {
    if (row == null) continue;
    if (typeof row === 'string') parts.push(row);
    else if (typeof row === 'object' && 'name' in (row as object)) {
      parts.push(String((row as { name?: unknown }).name || ''));
    }
  }
  const allergens = Array.isArray(product.allergens) ? product.allergens : [];
  for (const a of allergens) parts.push(String(a));
  const tiers = product.allergen_tiers as
    | { tier1?: unknown[]; tier2?: unknown[]; tier3?: unknown[] }
    | null
    | undefined;
  if (tiers && typeof tiers === 'object') {
    for (const key of ['tier1', 'tier2', 'tier3'] as const) {
      const arr = tiers[key];
      if (Array.isArray(arr)) for (const a of arr) parts.push(String(a));
    }
  }
  return parts.join(' ').toLowerCase();
}

/** True when product matches an include ingredient/protein criterion (e.g. chicken). */
export function productMatchesIncludeIngredient(
  product: Record<string, unknown>,
  include: string
): boolean {
  const token = include.trim().toLowerCase();
  if (!token) return true;
  const hay = productIngredientHaystack(product);
  if (hay.includes(token)) return true;
  // Common local synonyms for chicken
  if (token === 'chicken' && (hay.includes('ayam') || hay.includes('poultry'))) return true;
  return false;
}

/** True when product declares nuts (allergen tiers, ingredients, or name). */
export function productDeclaresNuts(product: Record<string, unknown>): boolean {
  const hay = productIngredientHaystack(product);
  return NUT_KEYWORDS.some((k) => {
    if (k === 'nut' || k === 'nuts') {
      // Avoid false positives on "coconut" / "nutmeg" partially — still match "nuts" word-ish
      return (
        hay.includes('tree nut') ||
        hay.includes('tree nuts') ||
        hay.includes('peanut') ||
        /\bnuts?\b/.test(hay) ||
        hay.includes('nuts (peanuts)')
      );
    }
    return hay.includes(k);
  });
}

export function filterDiscoverProducts(
  products: Record<string, unknown>[],
  opts: DiscoverFilterOpts
): Record<string, unknown>[] {
  let list = products;
  // Calorie ceiling from filter sheet and/or free-text search ("under 450 cal")
  const effectiveMaxCal = resolveEffectiveMaxCal(opts.maxCal, opts.query);
  // Strip cal phrases so "under 400 chicken" still matches chicken dishes
  const q = stripMaxCalFromQuery(opts.query).toLowerCase();
  if (q) {
    list = list.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      const cook = String(p.cook_name || '').toLowerCase();
      const cuisine = String(p.cuisine || '').toLowerCase();
      const tags = (Array.isArray(p.occasion_tags) ? p.occasion_tags : []).map((t) => String(t).toLowerCase());
      const ingredientsHit = productIngredientHaystack(p).includes(q);
      return (
        name.includes(q) ||
        cook.includes(q) ||
        cuisine.includes(q) ||
        String(p.id || '').toLowerCase().includes(q) ||
        tags.some((t) => t.includes(q) || q.includes(t.replace(/-/g, ' '))) ||
        ingredientsHit
      );
    });
  }
  if (opts.cuisine) list = list.filter((p) => String(p.cuisine || '') === opts.cuisine);
  if (opts.mealType) list = filterProductsByMealType(list, opts.mealType);
  if (opts.occasion) {
    list = list.filter((p) =>
      productMatchesOccasion(
        Array.isArray(p.occasion_tags) ? (p.occasion_tags as string[]) : [],
        opts.occasion
      )
    );
  }
  if (opts.halalOnly) list = list.filter((p) => Boolean(p.halal));
  if (opts.vegetarianOnly) list = list.filter((p) => isVegetarianDish(p));
  if (opts.veganOnly) list = list.filter((p) => isVeganDish(p));
  if (opts.includeIngredient?.trim()) {
    const token = opts.includeIngredient.trim();
    list = list.filter((p) => productMatchesIncludeIngredient(p, token));
  }
  if (opts.excludeNuts) list = list.filter((p) => !productDeclaresNuts(p));
  if (effectiveMaxCal != null) {
    list = list.filter((p) => ((p.calories as number) || 999) <= effectiveMaxCal);
  }
  return list;
}