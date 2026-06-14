import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";

/**
 * POST /store/shc/checkout-credits
 * Compat for api-client checkoutWithCredits real toggle (growth items: credits + corporate).
 * Returns same shape as mock. Delegates to demo-complete logic or enhanced in future.
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

  // Mirror demo complete
  const orderId = `SHC-CR-${Date.now().toString().slice(-6)}`;
  const order = {
    id: orderId,
    shc_status: 'paid',
    collection_date: collection.date,
    collection_slot: collection.slot,
    credits_applied: creditsToApply,
    is_corporate: isCorporate,
  };
  const logger = (req.scope as any).resolve?.("logger") || console;
  logger.info?.(`[SHC-STORE] /checkout-credits real toggle path credits=${creditsToApply}`);
  res.json({ order, shc_meta: order, earningsPreview: 85 /* percent calc stub */ });
}
