import ShcAvailabilityModuleService from "../modules/shc-availability/service";
import ShcCookModuleService from "../modules/shc-cook/service";
import { productTitleFromId } from "./shc-product-titles";
import { getCookRatingSummary, type CookRatingSummary } from "./shc-cook-ratings";

/** Shape product meta + availability into client-friendly object (mock parity). */
export async function shapeProduct(
  meta: any,
  scope: any,
  opts?: { cookRating?: CookRatingSummary }
) {
  const cookSvc: ShcCookModuleService = scope.resolve("shcCook");
  const availSvc: ShcAvailabilityModuleService = scope.resolve("shcAvailability");
  const avail = await availSvc.getAvailability(meta.product_id).catch(() => null);
  const [cooks] = await cookSvc.listAndCountCooks({ id: meta.cook_id } as any, { take: 1 }).catch(() => [[]]);
  const cook = (cooks as any[])?.[0];
  const title = meta.name || productTitleFromId(meta.product_id);
  const priceCents = typeof meta.price_cents === "number" && meta.price_cents > 0 ? meta.price_cents : null;
  const ratingSummary =
    opts?.cookRating ??
    (meta.cook_id ? await getCookRatingSummary(scope, meta.cook_id) : { rating: null, review_count: 0 });
  return {
    id: meta.product_id,
    name: title,
    title,
    price: priceCents ? priceCents / 100 : meta.min_qty ? meta.min_qty * 12 : 12,
    price_cents: priceCents ?? (meta.min_qty ? meta.min_qty * 1200 : 1200),
    cook_id: meta.cook_id,
    cook_slug: cook?.slug || null,
    cook_name: cook?.display_name || "Home Cook",
    cuisine: meta.cuisine,
    occasion_tags: meta.occasion_tags || [],
    allergen_tiers: meta.allergen_tiers || { tier1: [] },
    halal: !!meta.halal,
    calories: meta.calories,
    calories_confidence: meta.calories_confidence || "category",
    ingredients: meta.ingredients || [],
    min_qty: meta.min_qty || 1,
    last_minute_premium_pct: meta.last_minute_premium_pct ?? null,
    shc_availability: avail,
    description: meta.description || "",
    image_url: meta.image_url || null,
    meal_extras: meta.meal_extras || [],
    meal_addons: meta.meal_addons || [],
    recipe_steps: meta.recipe_steps || [],
    rating: ratingSummary.rating,
    review_count: ratingSummary.review_count,
  };
}
