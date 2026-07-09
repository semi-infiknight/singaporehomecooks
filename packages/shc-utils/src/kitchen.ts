/**
 * Kitchen detail helpers — scope dishes to one cook/kitchen (Jakob’s Law restaurant page).
 * Pure functions for cook profile + tiffin kitchen screens.
 */

export type KitchenIdentity = {
  id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  name?: string | null;
  area?: string | null;
  story?: string | null;
  cuisine?: string | null;
  primary_cuisine?: string | null;
  rating?: number | null;
  review_count?: number | null;
  orders?: number | null;
  subscriber_count?: number | null;
  status?: string | null;
  sfa_reg_number?: string | null;
  collection_instructions?: string | null;
  collection_address?: string | null;
};

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Products belonging to a kitchen. Matches cook_id, slug-in-id, or cook display name.
 * Returns [] when cook identity is missing or no dishes match (honest empty menu).
 */
export function scopeProductsByKitchen(
  products: Record<string, unknown>[],
  cook: KitchenIdentity | null | undefined
): Record<string, unknown>[] {
  if (!cook) return [];
  const cookId = cook.id ? String(cook.id) : '';
  const slug = cook.slug ? String(cook.slug) : '';
  const names = new Set<string>();
  if (cook.display_name) names.add(normalizeName(String(cook.display_name)));
  if (cook.name) names.add(normalizeName(String(cook.name)));
  if (cook.display_name) {
    // "Auntie Rose (Tampines)" → also match "Auntie Rose"
    names.add(normalizeName(String(cook.display_name).split('(')[0] || ''));
  }
  names.delete('');

  if (!cookId && !slug && names.size === 0) return [];

  return products.filter((p) => {
    const pid = String(p.cook_id || '');
    if (cookId && pid === cookId) return true;
    if (slug && (pid === slug || pid.includes(slug) || String(p.cook_slug || '') === slug)) return true;
    const pName = normalizeName(String(p.cook_name || p.cook_display_name || ''));
    if (pName && names.has(pName)) return true;
    // partial: product cook_name contains kitchen first name token
    for (const n of names) {
      if (n.length >= 4 && (pName.includes(n) || n.includes(pName))) return true;
    }
    return false;
  });
}

/** Rating label for kitchen hero, e.g. "4.8 (12)". */
export function kitchenRatingLabel(
  rating?: number | null,
  reviewCount?: number | null
): string | null {
  if (rating == null || !Number.isFinite(Number(rating))) return null;
  const r = Number(rating).toFixed(1);
  if (reviewCount != null && Number(reviewCount) > 0) return `${r} (${reviewCount})`;
  return r;
}

/** Open/closed + collection hint for familiar food-app status row. */
export function kitchenOpenStatus(cook?: KitchenIdentity | null): {
  isOpen: boolean;
  label: string;
  detail: string;
} {
  const status = String(cook?.status || 'active').toLowerCase();
  const closed = status === 'paused' || status === 'inactive' || status === 'suspended';
  return {
    isOpen: !closed,
    label: closed ? 'Closed' : 'Open',
    detail: cook?.collection_instructions
      ? String(cook.collection_instructions).slice(0, 60)
      : 'HDB collection evenings',
  };
}

/** Short tags under the hero (cuisine, area, trust). */
export function kitchenTagList(cook?: KitchenIdentity | null): string[] {
  if (!cook) return [];
  const tags: string[] = [];
  const cuisine = cook.primary_cuisine || cook.cuisine;
  if (cuisine) tags.push(String(cuisine));
  if (cook.area) tags.push(String(cook.area));
  if (cook.sfa_reg_number) tags.push('SFA registered');
  if (cook.subscriber_count != null && Number(cook.subscriber_count) > 0) {
    tags.push(`${cook.subscriber_count} subscribers`);
  } else if (cook.orders != null && Number(cook.orders) > 0) {
    tags.push(`${cook.orders}+ orders`);
  }
  return tags.slice(0, 5);
}

/** Plan rows for tiffin kitchen (meals/week options → display). */
export function kitchenTiffinPlanRows(
  mealsOptions: number[] = [2, 3, 4],
  priceForMeals: (n: number) => number
): Array<{ meals: number; pricePerMeal: number; label: string }> {
  return mealsOptions.map((meals) => ({
    meals,
    pricePerMeal: priceForMeals(meals),
    label: `${meals} meals / week`,
  }));
}

/**
 * Dish price in SGD dollars for kitchen menu badges (matches GourmeatDishCard: S${price}).
 * Prefer explicit `price` as dollars. If only `price_cents` is set, convert cents → dollars.
 * Never apply “price > 50 means cents” heuristics (breaks S$60 → S$1).
 */
export function kitchenDishPriceDollars(dish: {
  price?: number | null;
  price_cents?: number | null;
}): number | null {
  if (dish.price != null && Number.isFinite(Number(dish.price))) {
    return Number(dish.price);
  }
  if (dish.price_cents != null && Number.isFinite(Number(dish.price_cents))) {
    return Number(dish.price_cents) / 100;
  }
  return null;
}

/** Format kitchen dish price label e.g. "S$12". */
export function kitchenDishPriceLabel(dish: {
  price?: number | null;
  price_cents?: number | null;
}): string | null {
  const dollars = kitchenDishPriceDollars(dish);
  if (dollars == null) return null;
  // Whole dollars when integer; else 2dp
  if (Number.isInteger(dollars)) return `S$${dollars}`;
  return `S$${dollars.toFixed(2)}`;
}
