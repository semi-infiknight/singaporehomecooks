import { describe, expect, it } from 'vitest';
import {
  defaultMealAddonsDraft,
  defaultMealExtrasDraft,
  addIngredientRow,
  updateIngredientRow,
  normalizeIngredients,
  ingredientsToApiPayload,
  mealOptionsFromListing,
  mealOptionsToApiPayload,
  normalizeMealOptions,
  normalizeRecipeSteps,
  recipeStepsToApiPayload,
  slugMealOptionId,
} from './product-meta-form';

describe('product-meta-form', () => {
  it('normalizes meal options and recipe steps', () => {
    expect(normalizeMealOptions([{ label: 'Coconut rice', price_delta: 2 }])).toEqual([
      { id: 'coconut-rice', label: 'Coconut rice', priceDelta: 2 },
    ]);
    expect(normalizeRecipeSteps([{ order: 2, instruction: 'Simmer rempah.' }])).toEqual([
      { order: 1, instruction: 'Simmer rempah.' },
    ]);
  });

  it('builds API payloads with stable ids', () => {
    expect(mealOptionsToApiPayload([{ id: 'x', label: 'Extra sambal', priceDelta: 1.5 }])).toEqual([
      { id: 'x', label: 'Extra sambal', price_delta: 1.5 },
    ]);
    expect(recipeStepsToApiPayload([{ order: 1, instruction: 'Steam rice.', tip: 'Use pandan.' }])).toEqual([
      { order: 1, instruction: 'Steam rice.', tip: 'Use pandan.' },
    ]);
  });

  it('falls back to cuisine defaults when listing has no custom options', () => {
    const { extras, addons } = mealOptionsFromListing({ cuisine: 'Peranakan', halal: true });
    expect(extras.some((e) => e.id === 'white-rice')).toBe(true);
    expect(addons.some((a) => a.id === 'tempeh')).toBe(true);
    expect(slugMealOptionId('Extra sambal', 0)).toBe('extra-sambal');
    expect(defaultMealExtrasDraft('Indian').length).toBeGreaterThan(0);
    expect(defaultMealAddonsDraft(false).some((a) => a.id === 'egg')).toBe(true);
  });

  it('normalizes and edits ingredient rows (name only)', () => {
    expect(normalizeIngredients([{ name: '  Coconut milk ', quantity: 200, unit: 'ml' }])).toEqual([
      { name: 'Coconut milk' },
    ]);
    const rows = addIngredientRow([]);
    expect(rows).toHaveLength(1);
    const updated = updateIngredientRow(rows, 0, { name: 'Prawns' });
    expect(updated[0]).toEqual({ name: 'Prawns' });
    expect(ingredientsToApiPayload(updated)).toEqual([{ name: 'Prawns' }]);
  });
});
