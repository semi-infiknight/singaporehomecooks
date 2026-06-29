import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcProductMetaModuleService from "../../../../../modules/shc-product-meta/service";
import { shapeProduct } from "../../../../../lib/shc-product-shape";

/** GET /store/shc/products/:id — single product with meta + availability */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMeta") as any;

  const meta = await metaService.getMetaForProduct(id);
  if (!meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Product not found: ${id}`) });
  }

  const product = await shapeProduct(meta, req.scope);
  res.json({ product: { ...product, shc_meta: meta } });
}