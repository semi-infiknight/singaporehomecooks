import type { MedusaContainer } from "@medusajs/framework/types";
import ShcCookModuleService from "../modules/shc-cook/service";
import ShcProductMetaModuleService from "../modules/shc-product-meta/service";
import { shapeProduct } from "./shc-product-shape";
import { getCookRatingSummary } from "./shc-cook-ratings";
import type { TiffinKitchenConfigDTO } from "../modules/shc-tiffin/service";

export async function shapeTiffinKitchen(
  config: TiffinKitchenConfigDTO,
  scope: MedusaContainer
) {
  const cookService: ShcCookModuleService = scope.resolve("shcCook") as any;
  const metaService: ShcProductMetaModuleService = scope.resolve("shcProductMeta") as any;
  let subscriber_count = 0;
  try {
    const tiffin: any = scope.resolve("shcTiffin");
    if (tiffin?.subscriberCount) subscriber_count = await tiffin.subscriberCount(config.cook_id);
  } catch {
    /* optional */
  }
  const [cooks] = await cookService.listAndCountCooks({ id: config.cook_id } as any, { take: 1 }).catch(() => [[]]);
  const cook = (cooks as any[])?.[0];
  const ratingSummary = await getCookRatingSummary(scope, config.cook_id);
  const dishes = await Promise.all(
    (config.eligible_product_ids || []).map(async (pid) => {
      const meta = await metaService.getMetaForProduct(pid);
      if (!meta) return null;
      return shapeProduct(meta, scope, { cookRating: ratingSummary });
    })
  );
  return {
    ...config,
    subscriber_count,
    rating: ratingSummary.rating,
    review_count: ratingSummary.review_count,
    cook: cook
      ? {
          id: cook.id,
          display_name: cook.display_name,
          area: cook.area,
          slug: cook.slug,
          story: cook.story,
          rating: ratingSummary.rating,
          review_count: ratingSummary.review_count,
        }
      : { id: config.cook_id, rating: ratingSummary.rating, review_count: ratingSummary.review_count },
    dishes: dishes.filter(Boolean),
  };
}