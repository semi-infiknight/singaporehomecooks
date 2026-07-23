/**
 * Kook-inspired recipe storytelling — heritage lead, ingredients checklist, step-by-step.
 * SHC: cooks share the story behind each dish; full cooking happens in their HDB kitchen.
 */

export type RecipeStep = {
  order: number;
  instruction: string;
  tip?: string;
};

export type RecipeIngredient = {
  name: string;
  quantity?: number | string;
  unit?: string;
};

export type RecipeProductInput = {
  id?: string;
  name?: string;
  description?: string;
  heritage_note?: string | null;
  cuisine?: string;
  cook_name?: string;
  min_qty?: number;
  ingredients?: RecipeIngredient[];
  recipe_steps?: RecipeStep[];
};

/** Canonical seed steps — synced with seed/assets/dishes.json. */
export const SEED_RECIPE_STEPS: Record<string, RecipeStep[]> = {
  dish_nasi_lemak_prawn_001: [
    { order: 1, instruction: 'Steam coconut rice with pandan leaves and lemongrass until fragrant.', tip: 'Use fresh pandan for the 1972 Katong aroma.' },
    { order: 2, instruction: 'Pound rempah — chillies, belacan, shallots — then fry sambal until glossy.', tip: 'Small batches keep the heat balanced.' },
    { order: 3, instruction: 'Sauté fresh market prawns in sambal until just cooked through.', tip: 'Do not overcook — prawns curl when ready.' },
    { order: 4, instruction: 'Crisp ikan bilis and roast peanuts; slice cucumber; fry egg sunny-side up.', tip: 'Assemble while rice is still warm.' },
    { order: 5, instruction: 'Plate rice on banana leaf, top with prawns, sides, and egg.', tip: 'Heritage presentation — family-table style.' },
  ],
  dish_ayam_buah_keluak_002: [
    { order: 1, instruction: 'Soak buah keluak, crack shells, and scrape flesh into a rich paste.', tip: 'The soaking ritual is the same since 1972.' },
    { order: 2, instruction: 'Pound rempah with galangal, lemongrass, chilli, and belacan.', tip: 'Pound by hand for deeper flavour.' },
    { order: 3, instruction: 'Brown chicken pieces, then simmer in rempah and keluak paste.', tip: 'Low heat — let the nutty depth develop.' },
    { order: 4, instruction: 'Balance with tamarind pulp and a touch of gula melaka.', tip: 'Taste for earthy-sour-sweet harmony.' },
    { order: 5, instruction: 'Slow-braise until chicken is tender and gravy coats the spoon.', tip: 'A labour-of-love centrepiece dish.' },
  ],
  dish_devils_curry_003: [
    { order: 1, instruction: 'Blend fresh red chillies with turmeric, ginger, garlic, and shallots.', tip: 'Kristang kitchens call this the devil paste.' },
    { order: 2, instruction: 'Temper mustard seeds in oil, then fry the paste until fragrant.', tip: 'Watch the heat — mustard pops quickly.' },
    { order: 3, instruction: 'Add bone-in chicken and brown lightly on all sides.', tip: 'Bone-in keeps the gravy rich.' },
    { order: 4, instruction: 'Pour in vinegar and water; add potatoes; simmer until tender.', tip: 'The sour-heat signature comes from vinegar.' },
    { order: 5, instruction: 'Rest the curry so flavours meld — serve with rice or crusty bread.', tip: 'Nenek always said it tastes better the next day.' },
  ],
};

export function formatRecipeIngredient(ing: RecipeIngredient | string): string {
  if (typeof ing === 'string') return ing;
  const qty = ing.quantity != null && ing.quantity !== '' ? String(ing.quantity) : '';
  const unit = ing.unit ? ` ${ing.unit}` : '';
  const suffix = qty ? ` — ${qty}${unit}` : unit ? ` — ${unit.trim()}` : '';
  return `${ing.name || ''}${suffix}`.trim();
}

export function recipeHeritageLead(product: RecipeProductInput): string | null {
  const note = product.heritage_note?.trim();
  if (note) return note;
  const desc = product.description?.trim();
  if (!desc) return null;
  const first = desc.split(/(?<=[.!?])\s+/)[0]?.trim();
  return first && first.length <= 220 ? first : desc.slice(0, 200).trim() + (desc.length > 200 ? '…' : '');
}

export function recipeAboutBlurb(product: RecipeProductInput): string | null {
  const desc = product.description?.trim();
  if (!desc) return null;
  return desc.length > 280 ? `${desc.slice(0, 277)}…` : desc;
}

/** Estimated home-kitchen time for transparency (ordering context). */
export function recipeCookTimeLabel(stepCount: number): string {
  if (stepCount >= 5) return '~60 min';
  if (stepCount >= 3) return '~45 min';
  return '~30 min';
}

export function recipeAtAGlance(product: RecipeProductInput, stepCount: number): string[] {
  const chips: string[] = [];
  if (product.cuisine) chips.push(product.cuisine);
  chips.push(recipeCookTimeLabel(stepCount));
  if (product.min_qty && product.min_qty > 1) chips.push(`Min ${product.min_qty} portions`);
  return chips;
}

function stepsFromDescription(description?: string): RecipeStep[] {
  if (!description?.trim()) return [];
  const sentences = description
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24 && s.length < 180);
  return sentences.slice(0, 4).map((instruction, i) => ({ order: i + 1, instruction }));
}

/** Resolve steps: API field → seed map → description heuristic. */
export function recipeStepsForProduct(product: RecipeProductInput): RecipeStep[] {
  if (product.recipe_steps?.length) {
    return [...product.recipe_steps].sort((a, b) => a.order - b.order);
  }
  const id = product.id?.trim();
  if (id && SEED_RECIPE_STEPS[id]?.length) return SEED_RECIPE_STEPS[id];
  return stepsFromDescription(product.description);
}

export function recipeHasStory(product: RecipeProductInput): boolean {
  return Boolean(
    recipeHeritageLead(product) ||
      recipeStepsForProduct(product).length > 0 ||
      (product.ingredients?.length ?? 0) > 0
  );
}
