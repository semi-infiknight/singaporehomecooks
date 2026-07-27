/**
 * Tiffin kitchen pricing helpers — per-kitchen tier map with platform defaults.
 */
import {
  defaultTiffinPricePerMeal,
  resolveTiffinPricePerMeal,
  type TiffinPricingByMeals,
} from '@shc/business-rules';

export type { TiffinPricingByMeals };
export {
  DEFAULT_TIFFIN_PRICING_BY_MEALS,
  defaultTiffinPricePerMeal,
  normalizeTiffinKitchenPricing,
  resolveTiffinPricePerMeal,
} from '@shc/business-rules';

/** Build a price function from kitchen config for plan rows / subscribe UI. */
export function tiffinPriceResolver(pricing?: TiffinPricingByMeals | null): (mealsPerWeek: number) => number {
  return (mealsPerWeek) => resolveTiffinPricePerMeal(mealsPerWeek, pricing);
}

/** Browse card range from kitchen tier pricing. */
export function tiffinKitchenPriceRange(
  pricing?: TiffinPricingByMeals | null,
  mealsOptions: number[] = [2, 3, 4]
): { from: number; to: number } {
  const opts = mealsOptions.length ? mealsOptions : [2, 3, 4];
  const prices = opts.map((m) => resolveTiffinPricePerMeal(m, pricing));
  return { from: Math.min(...prices), to: Math.max(...prices) };
}

/** Weekly subtotal in SGD — matches legacy tiffinWeeklySubtotal. */
export function tiffinWeeklySubtotal(
  mealsPerWeek: number,
  servings = 1,
  pricing?: TiffinPricingByMeals | null
): number {
  return mealsPerWeek * servings * resolveTiffinPricePerMeal(mealsPerWeek, pricing);
}
