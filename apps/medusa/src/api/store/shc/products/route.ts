import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import ShcProductMetaModuleService from "../../../../modules/shc-product-meta/service";
import ShcAvailabilityModuleService from "../../../../modules/shc-availability/service";
import { createSHCError } from "@shc/types";

const QuerySchema = z.object({
  cook_id: z.string().optional(),
  cuisine: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().default(12),
  offset: z.coerce.number().default(0),
}).strict();

/**
 * GET /store/shc/products
 * Lists SHC product meta (+ availability). Medusa core Product join optional later.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad query params", parse.error.format() as any) });
  }
  const { cook_id, cuisine, q, limit, offset } = parse.data;

  const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMeta") as any;
  const availService: ShcAvailabilityModuleService = req.scope.resolve("shcAvailability") as any;

  const [metas] = await metaService.listAndCountProductMetas({}, { skip: offset, take: limit });

  let filtered = metas as any[];
  if (cook_id) filtered = filtered.filter((m) => m.cook_id === cook_id);
  if (cuisine) filtered = filtered.filter((m) => m.cuisine?.toLowerCase().includes(cuisine.toLowerCase()));
  if (q) {
    const ql = q.toLowerCase();
    filtered = filtered.filter((m) =>
      m.product_id?.toLowerCase().includes(ql) ||
      m.cuisine?.toLowerCase().includes(ql) ||
      m.occasion_tags?.some((t: string) => t.toLowerCase().includes(ql))
    );
  }

  const products = await Promise.all(
    filtered.map(async (meta) => {
      const avail = await availService.getAvailability(meta.product_id).catch(() => null);
      return {
        id: meta.product_id,
        title: meta.product_id.replace(/_/g, " ").replace(/prod /i, ""),
        shc_meta: meta,
        shc_availability: avail,
        price_cents: meta.min_qty ? meta.min_qty * 1200 : 1200,
      };
    })
  );

  res.json({ products, count: products.length });
}