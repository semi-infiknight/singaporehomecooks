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
  creditsToApply: z.number().optional().default(0),
  isCorporate: z.boolean().optional().default(false),
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
    const { collection_date, collection_slot, allergen_acked, pdpa_consent, creditsToApply, isCorporate } = parse.data;
    const result = await completeDemoCartCheckout(req, {
      collection_date,
      collection_slot,
      allergen_acked,
      pdpa_consent,
      creditsToApply,
      isCorporate,
    });
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.(`[SHC-STORE] demo-complete persisted order=${result.order.id} credits=${creditsToApply}`);
    res.json(result);
  } catch (e: any) {
    return res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", e?.message || "Checkout failed"),
    });
  }
}