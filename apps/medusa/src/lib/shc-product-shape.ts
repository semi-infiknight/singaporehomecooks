import ShcAvailabilityModuleService from "../modules/shc-availability/service";
import ShcCookModuleService from "../modules/shc-cook/service";
import { productTitleFromId } from "./shc-product-titles";

/** Shape product meta + availability into client-friendly object (mock parity). */
export async function shapeProduct(
  meta: any,
  scope: any,
  cookService?: ShcCookModuleService,
  availService?: ShcAvailabilityModuleService
) {
  const cookSvc: ShcCookModuleService = cookService || scope.resolve("shcCook");
  const availSvc: ShcAvailabilityModuleService = availService || scope.resolve("shcAvailability");
  const avail = await availSvc.getAvailability(meta.product_id).catch(() => null);
  const [cooks] = await cookSvc.listAndCountCooks({ id: meta.cook_id } as any, { take: 1 }).catch(() => [[]]);
  const cook = (cooks as any[])?.[0];
  const title = productTitleFromId(meta.product_id);
  return {
    id: meta.product_id,
    name: title,
    price: meta.min_qty ? meta.min_qty * 12 : 12,
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
    shc_availability: avail,
    heritage_note: meta.heritage_note || "",
    description: meta.description || "",
    image_url: meta.image_url || null,
  };
}