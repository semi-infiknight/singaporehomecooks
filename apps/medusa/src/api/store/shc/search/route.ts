import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { listShcProducts } from "../../../../lib/shc-product-list";

/** GET /store/shc/search?q=... — product search (delegates to listShcProducts) */
const QuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().default(12),
  offset: z.coerce.number().default(0),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = req.query as Record<string, unknown>;
  const parse = QuerySchema.safeParse({ q: q.q, limit: q.limit, offset: q.offset });
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "q required") });
  }

  try {
    const { q: query, limit, offset } = parse.data;
    const { products, total } = await listShcProducts(req.scope, { q: query, limit, offset });
    res.json({
      query,
      results: products,
      count: products.length,
      total,
      suggestions: total === 0 ? ["Nasi Lemak", "Ayam Buah Keluak", "Peranakan", "Hari Raya"] : undefined,
    });
  } catch (e: any) {
    return res.status(500).json({ error: createSHCError("SHC-GENERIC-001", e?.message || "Search failed") });
  }
}