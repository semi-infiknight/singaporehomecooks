import { describe, expect, it } from 'vitest';
import {
  formatRecipeIngredient,
  recipeAtAGlance,
  recipeHeritageLead,
  recipeStepsForProduct,
  SEED_RECIPE_STEPS,
  recipeStoryProps,
} from './recipe-ux';

describe('recipe-ux', () => {
  it('uses seed steps for known dishes', () => {
    const steps = recipeStepsForProduct({ id: 'dish_nasi_lemak_prawn_001' });
    expect(steps).toHaveLength(SEED_RECIPE_STEPS.dish_nasi_lemak_prawn_001.length);
    expect(steps[0].instruction).toMatch(/coconut rice/i);
  });

  it('derives lead copy from description', () => {
    expect(
      recipeHeritageLead({
        description: 'Family recipe since 1972. Still made the same way in our HDB kitchen.',
      })
    ).toBe('Family recipe since 1972.');
  });

  it('formats ingredient lines as name only (no recipe amounts)', () => {
    expect(formatRecipeIngredient({ name: 'Chicken', quantity: 500, unit: 'g' })).toBe('Chicken');
  });

  it('builds at-a-glance chips', () => {
    expect(recipeAtAGlance({ cuisine: 'Peranakan', min_qty: 5 }, 5)).toEqual([
      'Peranakan',
      '~60 min',
      'Min 5 portions',
    ]);
  });

  it('recipeStoryProps bundles card fields', () => {
    const props = recipeStoryProps({ id: 'dish_nasi_lemak_prawn_001', cuisine: 'Peranakan' }, 'Auntie Rose');
    expect(props.steps.length).toBeGreaterThan(0);
    expect(props.cookName).toBe('Auntie Rose');
  });
});
