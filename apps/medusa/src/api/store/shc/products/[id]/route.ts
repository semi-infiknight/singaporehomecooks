import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcProductMetaModuleService from "../../../../../modules/shc-product-meta/service";
import ShcAvailabilityModuleService from "../../../../../modules/shc-availability/service";
import ShcCookModuleService from "../../../../../modules/shc-cook/service";
import { productTitleFromId } from "../../../../../lib/shc-product-titles";

/** GET /store/shc/products/:id — single product with meta + availability */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMeta") as any;
  const availService: ShcAvailabilityModuleService = req.scope.resolve("shcAvailability") as any;
  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;

  const meta = await metaService.getMetaForProduct(id);
  if (!meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Product not found: ${id}`) });
  }

  const avail = await availService.getAvailability(meta.product_id).catch(() => null);
  const [cooks] = await cookService.listAndCountCooks({ id: meta.cook_id } as any, { take: 1 }).catch(() => [[]]);
  const cook = (cooks as any[])?.[0];

  const title = productTitleFromId(meta.product_id);

  res.json({
    product: {
      id: meta.product_id,
      name: title,
      title,
      price: meta.min_qty ? meta.min_qty * 12 : 12,
      cook_id: meta.cook_id,
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
      shc_meta: meta,
      heritage_note: (meta as any).heritage_note || "",
      description: (meta as any).description || "",
    },
  });
}