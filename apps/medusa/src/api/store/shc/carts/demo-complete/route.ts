import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError, SHCOrderStatus } from "@shc/types";

/**
 * POST /store/shc/carts/demo-complete
 * Demo-compat route for api-client real wiring toggle (used when EXPO_PUBLIC_USE_REAL_MEDUSA).
 * Mirrors mock checkoutWithCredits + complete exactly for growth (credits, corporate, pdpa).
 * Delegates core logic or returns matching shape {order, shc_meta, earningsPreview}.
 * Use real cart id routes in prod.
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
  const { collection_date, collection_slot, allergen_acked, pdpa_consent, creditsToApply, isCorporate } = parse.data;

  // Simplified demo response matching mock exactly (full rules in mobile mock or real complete)
  const orderId = `SHC-DEMO-${Date.now().toString().slice(-6)}`;
  const order = {
    id: orderId,
    shc_status: 'paid' as SHCOrderStatus,
    collection_date,
    collection_slot,
    allergen_acked_at: allergen_acked ? new Date().toISOString() : undefined,
    pdpa_consent_at: pdpa_consent ? new Date().toISOString() : undefined,
    pdpa_consent_version: pdpa_consent ? 'v1.0-pdpa-2025' : undefined,
    credits_applied: creditsToApply,
    is_corporate: isCorporate,
    total: 4500, // stub
  };
  const logger = (req.scope as any).resolve?.("logger") || console;
  logger.info?.(`[SHC-STORE] demo-complete wired (toggle real) credits=${creditsToApply} corporate=${isCorporate}`);
  res.json({
    order,
    shc_meta: order,
    earningsPreview: 3825, // 85%
    note: "Demo real path for api-client toggle + growth items (credits/corporate/pdpa). Use /carts/:id/complete + full cartService in prod.",
  });
}
