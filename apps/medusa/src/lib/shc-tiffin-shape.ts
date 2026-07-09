import type { MedusaContainer } from "@medusajs/framework/types";
import ShcCookModuleService from "../modules/shc-cook/service";
import ShcProductMetaModuleService from "../modules/shc-product-meta/service";
import { shapeProduct } from "./shc-product-shape";
import type { TiffinKitchenConfigDTO } from "../modules/shc-tiffin/service";

export async function shapeTiffinKitchen(
  config: TiffinKitchenConfigDTO,
  scope: MedusaContainer
) {
  const cookService: ShcCookModuleService = scope.resolve("shcCook") as any;
  const metaService: ShcProductMetaModuleService = scope.resolve("shcProductMeta") as any;
  const [cooks] = await cookService.listAndCountCooks({ id: config.cook_id } as any, { take: 1 }).catch(() => [[]]);
  const cook = (cooks as any[])?.[0];
  const dishes = await Promise.all(
    (config.eligible_product_ids || []).map(async (pid) => {
      const meta = await metaService.getMetaForProduct(pid);
      if (!meta) return null;
      return shapeProduct(meta, scope);
    })
  );
  return {
    ...config,
    cook: cook
      ? {
          id: cook.id,
          display_name: cook.display_name,
          area: cook.area,
          slug: cook.slug,
          story: cook.story,
        }
      : { id: config.cook_id },
    dishes: dishes.filter(Boolean),
  };
}