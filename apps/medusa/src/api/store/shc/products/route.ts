import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import ShcProductMetaModuleService from "../../../../modules/shc-product-meta/service";
import ShcAvailabilityModuleService from "../../../../modules/shc-availability/service";
import { createSHCError } from "@shc/types";

const QuerySchema = z.object({
  cook_id: z.string().optional(),
  cuisine: z.string().optional(),
  q: z.string().optional(), // search stub
  limit: z.coerce.number().default(12),
  offset: z.coerce.number().default(0),
}).strict();

/**
 * GET /store/shc/products
 * Products + shc_product_meta + availability joined (basic).
 * Use with publishable key + sales channel.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad query params", parse.error.format() as any) });
  }
  const { cook_id, cuisine, q, limit, offset } = parse.data;

  // Use Medusa product service + enrich (simple for Wave1)
  const productService = req.scope.resolve("productService") as any;
  const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMetaService") as any;
  const availService: ShcAvailabilityModuleService = req.scope.resolve("shcAvailabilityService") as any;

  const filter: any = { limit, offset };
  if (q) filter.q = q; // basic

  const { products, count } = await productService.listAndCountProducts(filter);

  const enriched = await Promise.all(
    products.map(async (p: any) => {
      const meta = await metaService.getMetaForProduct(p.id);
      const avail = await availService.getAvailability(p.id);
      return {
        ...p,
        shc_meta: meta || null,
        shc_availability: avail || null,
        // enforce cook visibility in full query
      };
    })
  );

  // Simple filter post (MVP)
  let filtered = enriched;
  if (cook_id) filtered = filtered.filter((p: any) => p.shc_meta?.cook_id === cook_id);
  if (cuisine && filtered.length) filtered = filtered.filter((p: any) => p.shc_meta?.cuisine?.toLowerCase().includes(cuisine.toLowerCase()));

  res.json({ products: filtered, count: filtered.length });
}
