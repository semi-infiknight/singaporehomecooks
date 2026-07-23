/**
 * HomelyEats meal-type chips — Breakfast · Lunch · Snacks · Dinner.
 * Pure heuristics from product fields (no backend meal_type yet).
 */

export type MealTypeId = 'all' | 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export const MEAL_TYPE_CHIPS: { id: MealTypeId; label: string }[] = [
  { id: 'all', label: 'All meals' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'dinner', label: 'Dinner' },
];

/** Infer meal slot from name, tags, and collection window. */
export function inferMealType(product: Record<string, unknown>): Exclude<MealTypeId, 'all'> {
  const hay = [
    String(product.name || ''),
    String(product.cuisine || ''),
    String(product.collection_slot || ''),
    ...(Array.isArray(product.occasion_tags) ? product.occasion_tags.map(String) : []),
  ]
    .join(' ')
    .toLowerCase();

  if (/breakfast|morning|prata|roti prata|nasi lemak|kaya|milo|teh tarik|porridge|congee/.test(hay)) {
    return 'breakfast';
  }
  if (/snack|kueh|dessert|tea time|teatime|ngoh hiang|pisang|ondeh/.test(hay)) {
    return 'snacks';
  }
  if (/dinner|supper|evening|night/.test(hay)) {
    return 'dinner';
  }
  if (/lunch|midday|bento|tiffin|nasi padang/.test(hay)) {
    return 'lunch';
  }

  const slot = String(product.collection_slot || '').toLowerCase();
  if (slot.includes('am') || slot.includes('morning') || /^(6|7|8|9|10|11):/.test(slot)) {
    return 'breakfast';
  }
  if (slot.includes('pm') && /^(12|1|2|3|4):/.test(slot)) {
    return 'lunch';
  }
  if (slot.includes('pm') && /^(5|6|7|8|9):/.test(slot)) {
    return 'dinner';
  }

  return 'lunch';
}

export function filterProductsByMealType(
  products: Record<string, unknown>[],
  mealType: MealTypeId | undefined
): Record<string, unknown>[] {
  if (!mealType || mealType === 'all') return products;
  return products.filter((p) => inferMealType(p) === mealType);
}
