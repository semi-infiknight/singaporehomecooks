/**
 * Category browse helpers — scope dishes/kitchens by cuisine id from admin or default categories.
 * Pure functions for category pages (web + mobile-customer).
 */
import { MIND_CUISINE_CATEGORIES } from './food-visuals';
import { filterDiscoverProducts } from './discover';

export type CuisineCategory = { id: string; label: string; imageUrl: string };

function categorySource(categories?: readonly CuisineCategory[]): CuisineCategory[] {
  if (categories?.length) {
    return categories.map((c) => ({
      id: c.id,
      label: c.label,
      imageUrl: c.imageUrl,
    }));
  }
  return MIND_CUISINE_CATEGORIES.map((c) => ({ ...c }));
}

/** Resolve a cuisine category by id (e.g. "Peranakan"). Empty id = All. */
export function getCuisineCategoryById(
  categoryId: string | undefined | null,
  categories?: readonly CuisineCategory[]
): CuisineCategory | null {
  const source = categorySource(categories);
  if (categoryId == null) return null;
  const decoded = decodeURIComponent(String(categoryId)).trim();
  // "All" is not a dedicated category page destination
  if (!decoded || decoded === 'all' || decoded === 'All') {
    return source.find((c) => c.id === '') ?? { id: '', label: 'All', imageUrl: '' };
  }
  const exact = source.find((c) => c.id === decoded);
  if (exact) return exact;
  const byLabel = source.find(
    (c) => c.label.toLowerCase() === decoded.toLowerCase() || c.id.toLowerCase() === decoded.toLowerCase()
  );
  return byLabel ?? null;
}

/**
 * Products in a cuisine category.
 * Empty / unknown category id → empty list (category page must not show unrelated dishes).
 * Known "All" (id '') → full list (caller usually avoids navigating to All).
 */
export function scopeProductsByCategory(
  products: Record<string, unknown>[],
  categoryId: string | undefined | null,
  categories?: readonly CuisineCategory[]
): Record<string, unknown>[] {
  const source = categorySource(categories);
  if (categoryId == null) return [];
  const decoded = decodeURIComponent(String(categoryId)).trim();
  if (!decoded || decoded === 'all' || decoded === 'All') {
    return [...products];
  }
  const cat = getCuisineCategoryById(decoded, source);
  if (!cat || !cat.id) {
    // Unknown id — honest empty, not unscoped dump
    if (!source.some((c) => c.id && c.id.toLowerCase() === decoded.toLowerCase())) {
      // try case-insensitive cuisine match on products only if category not in mind list
      const matched = products.filter((p) => String(p.cuisine || '').toLowerCase() === decoded.toLowerCase());
      if (matched.length === 0 && !source.some((c) => c.id)) return [];
      if (matched.length > 0) return matched;
      return [];
    }
  }
  const cuisine = cat?.id || decoded;
  return filterDiscoverProducts(products, { cuisine });
}

/**
 * Kitchens that offer at least one dish in the category (by cook_id / cook_name match).
 * If products empty for category → empty kitchens.
 */
export function scopeKitchensByCategory(
  cooks: Array<Record<string, unknown>>,
  categoryProducts: Record<string, unknown>[],
  categoryId?: string | null
): Array<Record<string, unknown>> {
  if (!categoryProducts.length) return [];
  const cookIds = new Set<string>();
  const cookNames = new Set<string>();
  for (const p of categoryProducts) {
    if (p.cook_id) cookIds.add(String(p.cook_id));
    if (p.cook_name) cookNames.add(String(p.cook_name).toLowerCase());
    if (p.cook_display_name) cookNames.add(String(p.cook_display_name).toLowerCase());
  }
  return cooks.filter((c) => {
    const id = String(c.id || c.cook_id || '');
    const name = String(c.display_name || c.name || '').toLowerCase();
    if (id && cookIds.has(id)) return true;
    if (name && cookNames.has(name)) return true;
    // fallback: cook lists cuisine tags
    const cuisine = String(c.cuisine || c.primary_cuisine || '');
    if (categoryId && cuisine && cuisine === decodeURIComponent(String(categoryId))) return true;
    return false;
  });
}

/** Top-rated dishes for category (rating desc, then name). */
export function topRatedCategoryDishes(
  categoryProducts: Record<string, unknown>[],
  limit = 6
): Record<string, unknown>[] {
  return [...categoryProducts]
    .sort((a, b) => {
      const ra = Number(a.rating ?? 0);
      const rb = Number(b.rating ?? 0);
      if (rb !== ra) return rb - ra;
      return String(a.name || '').localeCompare(String(b.name || ''));
    })
    .slice(0, Math.max(0, limit));
}

/** Promo copy for category offer banner. */
export function categoryOfferCopy(category: CuisineCategory | null): { title: string; subtitle: string } {
  const label = category?.label || category?.id || 'Heritage';
  return {
    title: `Explore ${label} kitchens`,
    subtitle: `Top-rated home cooks · HDB collection · order a single dish or a few favourites`,
  };
}
