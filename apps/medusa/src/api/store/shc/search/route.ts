import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";

/**
 * GET /store/shc/search?q=...
 * Stub search. In Phase 4+ full FTS + synonym from shc_search_synonym + AI.
 */
const QuerySchema = z.object({ q: z.string().min(1) }).strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "q required") });
  }
  const { q } = parse.data;

  // Stub: delegate to /store/shc/products with q + return note
  // Future: use shc_search_synonym + vector or pg_trgm
  res.json({
    query: q,
    results: [],
    note: "Search stub — see 06-api-surface.md + phase-4. Use /store/shc/products?q= for basic.",
    suggestions: ["Nasi Lemak", "Ayam Buah Keluak", "Peranakan", "Hari Raya"],
  });
}
