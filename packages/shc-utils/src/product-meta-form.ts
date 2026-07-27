/**
 * Cook-editable product meta: meal extras, add-ons, recipe steps (tri-platform).
 */
import type { RecipeStep } from './recipe-ux';

export type MealOptionDraft = {
  id: string;
  label: string;
  priceDelta: number;
};

export type RecipeStepDraft = {
  order: number;
  instruction: string;
  tip?: string;
};

export function slugMealOptionId(label: string, index: number): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `option-${index + 1}`;
}

export function normalizeMealOptions(
  options?: Array<Partial<MealOptionDraft> & { price_delta?: number }> | null
): MealOptionDraft[] {
  if (!Array.isArray(options)) return [];
  return options
    .map((opt, index) => {
      const label = String(opt.label || '').trim();
      if (!label) return null;
      const id = String(opt.id || slugMealOptionId(label, index)).trim() || slugMealOptionId(label, index);
      const priceDelta = Number(opt.priceDelta ?? opt.price_delta ?? 0);
      return {
        id,
        label,
        priceDelta: Number.isFinite(priceDelta) && priceDelta >= 0 ? priceDelta : 0,
      };
    })
    .filter(Boolean) as MealOptionDraft[];
}

export function normalizeRecipeSteps(
  steps?: Array<Partial<RecipeStepDraft>> | null
): RecipeStepDraft[] {
  if (!Array.isArray(steps)) return [];
  return steps
    .map((step, index) => {
      const instruction = String(step.instruction || '').trim();
      if (!instruction) return null;
      const tip = step.tip?.trim();
      return {
        order: Number(step.order) > 0 ? Number(step.order) : index + 1,
        instruction,
        ...(tip ? { tip } : {}),
      };
    })
    .filter((step): step is RecipeStepDraft => step != null)
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({ ...step, order: index + 1 })) as RecipeStepDraft[];
}

/** Cuisine-based starter extras (matches legacy kitchen-order defaults). */
export function defaultMealExtrasDraft(cuisine?: string): MealOptionDraft[] {
  const c = String(cuisine || '').toLowerCase();
  if (c.includes('indian') || c.includes('malay')) {
    return [
      { id: 'plain-rice', label: 'Plain rice', priceDelta: 0 },
      { id: 'coconut-rice', label: 'Coconut rice', priceDelta: 2 },
    ];
  }
  if (c.includes('chinese') || c.includes('peranakan')) {
    return [
      { id: 'white-rice', label: 'Steamed rice', priceDelta: 0 },
      { id: 'no-rice', label: 'No rice (dish only)', priceDelta: 0 },
    ];
  }
  return [
    { id: 'standard', label: 'Standard portion', priceDelta: 0 },
    { id: 'large', label: 'Family portion', priceDelta: 8 },
  ];
}

/** Starter add-ons cooks can edit per dish. */
export function defaultMealAddonsDraft(halal?: boolean): MealOptionDraft[] {
  const base: MealOptionDraft[] = [
    { id: 'sambal', label: 'Extra sambal', priceDelta: 1.5 },
    { id: 'acar', label: 'Acar / pickle', priceDelta: 2 },
    { id: 'egg', label: 'Fried egg', priceDelta: 1.5 },
  ];
  if (halal) {
    return base.filter((o) => o.id !== 'egg').concat([{ id: 'tempeh', label: 'Tempeh side', priceDelta: 2 }]);
  }
  return base;
}

export function mealOptionsFromListing(listing?: {
  meal_extras?: unknown;
  meal_addons?: unknown;
  cuisine?: string;
  halal?: boolean;
} | null): { extras: MealOptionDraft[]; addons: MealOptionDraft[] } {
  const extras = normalizeMealOptions(listing?.meal_extras as MealOptionDraft[] | undefined);
  const addons = normalizeMealOptions(listing?.meal_addons as MealOptionDraft[] | undefined);
  return {
    extras: extras.length ? extras : defaultMealExtrasDraft(listing?.cuisine),
    addons: addons.length ? addons : defaultMealAddonsDraft(listing?.halal),
  };
}

export function recipeStepsFromListing(listing?: { recipe_steps?: unknown } | null): RecipeStepDraft[] {
  return normalizeRecipeSteps(listing?.recipe_steps as RecipeStepDraft[] | undefined);
}

export function mealOptionsToApiPayload(options: MealOptionDraft[]) {
  return normalizeMealOptions(options).map((opt) => ({
    id: opt.id,
    label: opt.label,
    price_delta: opt.priceDelta,
  }));
}

export function recipeStepsToApiPayload(steps: RecipeStepDraft[]): RecipeStep[] {
  return normalizeRecipeSteps(steps).map((step) => ({
    order: step.order,
    instruction: step.instruction,
    ...(step.tip ? { tip: step.tip } : {}),
  }));
}

export function addMealOptionRow(options: MealOptionDraft[]): MealOptionDraft[] {
  const next = [...options];
  const index = next.length;
  next.push({ id: slugMealOptionId('New option', index), label: '', priceDelta: 0 });
  return next;
}

export function updateMealOptionRow(
  options: MealOptionDraft[],
  index: number,
  patch: Partial<MealOptionDraft>
): MealOptionDraft[] {
  const next = [...options];
  const current = next[index];
  if (!current) return next;
  const label = patch.label !== undefined ? patch.label : current.label;
  next[index] = {
    id: patch.id ?? (patch.label !== undefined ? slugMealOptionId(label, index) : current.id),
    label,
    priceDelta: patch.priceDelta !== undefined ? patch.priceDelta : current.priceDelta,
  };
  return next;
}

export function removeMealOptionRow(options: MealOptionDraft[], index: number): MealOptionDraft[] {
  return options.filter((_, i) => i !== index);
}

export function addRecipeStepRow(steps: RecipeStepDraft[]): RecipeStepDraft[] {
  return [...steps, { order: steps.length + 1, instruction: '' }];
}

export function updateRecipeStepRow(
  steps: RecipeStepDraft[],
  index: number,
  patch: Partial<RecipeStepDraft>
): RecipeStepDraft[] {
  const next = [...steps];
  const current = next[index];
  if (!current) return next;
  next[index] = { ...current, ...patch };
  return normalizeRecipeSteps(next);
}

export function removeRecipeStepRow(steps: RecipeStepDraft[], index: number): RecipeStepDraft[] {
  return normalizeRecipeSteps(steps.filter((_, i) => i !== index));
}
