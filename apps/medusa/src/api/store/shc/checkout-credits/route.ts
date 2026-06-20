import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { completeDemoCartCheckout } from "../../../../lib/shc-demo-checkout";
import { unauthorized } from "../../../../lib/shc-actors";

/**
 * POST /store/shc/checkout-credits
 * Growth checkout with Home Credits redemption — same persistence as demo-complete.
 */
const BodySchema = z.object({
  allergenAck: z.boolean(),
  collection: z.object({ date: z.string(), slot: z.string() }),
  creditsToApply: z.number().int().min(0).default(0),
  isCorporate: z.boolean().default(false),
}).strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid checkout-credits", parse.error.format() as any) });
  }
  const { allergenAck, collection, creditsToApply, isCorporate } = parse.data;

  try {
    const result = await completeDemoCartCheckout(req, {
      collection_date: collection.date,
      collection_slot: collection.slot,
      allergen_acked: allergenAck,
      pdpa_consent: true,
      creditsToApply,
      isCorporate,
    });
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.(`[SHC-STORE] /checkout-credits order=${result.order.id} credits=${result.credits_applied}`);
    res.json(result);
  } catch (e: any) {
    if (e?.message?.includes("login required") || e?.message?.includes("Customer login")) {
      return unauthorized(res, "Customer login required");
    }
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e?.message || "Checkout with credits failed") });
  }
}