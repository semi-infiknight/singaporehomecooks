import { productMatchesOccasion } from './occasion';
import { filterProductsByMealType, type MealTypeId } from './meal-type';

export type DiscoverFilterOpts = {
  query?: string;
  occasion?: string;
  cuisine?: string;
  mealType?: MealTypeId;
  halalOnly?: boolean;
  maxCal?: number;
};

export function filterDiscoverProducts(
  products: Record<string, unknown>[],
  opts: DiscoverFilterOpts
): Record<string, unknown>[] {
  let list = products;
  const q = opts.query?.trim().toLowerCase();
  if (q) {
    list = list.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      const cook = String(p.cook_name || '').toLowerCase();
      const cuisine = String(p.cuisine || '').toLowerCase();
      const tags = (Array.isArray(p.occasion_tags) ? p.occasion_tags : []).map((t) => String(t).toLowerCase());
      return (
        name.includes(q) ||
        cook.includes(q) ||
        cuisine.includes(q) ||
        String(p.id || '').toLowerCase().includes(q) ||
        tags.some((t) => t.includes(q) || q.includes(t.replace(/-/g, ' ')))
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
  if (opts.maxCal != null) list = list.filter((p) => ((p.calories as number) || 999) <= opts.maxCal!);
  return list;
}