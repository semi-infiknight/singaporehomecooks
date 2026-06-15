import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { listShcProducts } from "../../../../lib/shc-product-list";

const QuerySchema = z.object({
  cook_id: z.string().optional(),
  cuisine: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().default(12),
  offset: z.coerce.number().default(0),
});

/** GET /store/shc/products — lists SHC products with meta + availability */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = req.query as Record<string, unknown>;
  const parse = QuerySchema.safeParse({
    cook_id: q.cook_id,
    cuisine: q.cuisine,
    q: q.q,
    limit: q.limit,
    offset: q.offset,
  });
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad query params", parse.error.format() as any) });
  }

  try {
    const result = await listShcProducts(req.scope, parse.data);
    res.json(result);
  } catch (e: any) {
    return res.status(500).json({ error: createSHCError("SHC-GENERIC-001", e?.message || "Products query failed") });
  }
}