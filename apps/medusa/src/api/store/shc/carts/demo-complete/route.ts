import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCustomerId, unauthorized } from "../../../../../lib/shc-actors";
import { completeDemoCartCheckout } from "../../../../../lib/shc-demo-checkout";

/**
 * POST /store/shc/carts/demo-complete
 * Persists order meta to DB (real wiring). Uses server cart if present.
 */
const BodySchema = z.object({
  collection_date: z.string(),
  collection_slot: z.string(),
  allergen_acked: z.boolean().default(false),
  pdpa_consent: z.boolean().default(true),
  isCorporate: z.boolean().optional().default(false),
  cooking_notes: z.string().max(2000).nullable().optional(),
  collection_notes: z.string().max(2000).nullable().optional(),
  customer_collection_lat: z.number().min(1.15).max(1.48).nullable().optional(),
  customer_collection_lng: z.number().min(103.6).max(104.1).nullable().optional(),
  customer_collection_postal_code: z.string().regex(/^\d{6}$/).nullable().optional(),
  customer_collection_line1: z.string().max(200).nullable().optional(),
}).strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid demo complete", parse.error.format() as any) });
  }
  try {
    getCustomerId(req);
  } catch {
    return unauthorized(res, "Customer login required");
  }

  try {
    const {
      collection_date,
      collection_slot,
      allergen_acked,
      pdpa_consent,
      isCorporate,
      cooking_notes,
      collection_notes,
      customer_collection_lat,
      customer_collection_lng,
      customer_collection_postal_code,
      customer_collection_line1,
    } = parse.data;
    const result = await completeDemoCartCheckout(req, {
      collection_date,
      collection_slot,
      allergen_acked,
      pdpa_consent,
      isCorporate,
      cooking_notes,
      collection_notes,
      customer_collection_lat,
      customer_collection_lng,
      customer_collection_postal_code,
      customer_collection_line1,
    });
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.(`[SHC-STORE] demo-complete persisted order=${result.order.id}`);
    res.json(result);
  } catch (e: any) {
    // Capacity / business errors → 400 (cart kept for retry)
    if (e?.code) {
      return res.status(400).json({ error: e });
    }
    const msg = e?.message || "Checkout failed";
    const isBiz =
      /batch|capacity|sold out|closed|empty|cook|Cannot order|window/i.test(msg);
    return res.status(isBiz ? 400 : 500).json({
      error: createSHCError("SHC-GENERIC-001", msg),
    });
  }
}