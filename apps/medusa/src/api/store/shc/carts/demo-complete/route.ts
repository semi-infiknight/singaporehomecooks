import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError, SHCOrderStatus } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../../modules/shc-order-meta/service";
import { getCustomerId } from "../../../../../lib/shc-actors";
import { getCart, clearCart } from "../../../../../lib/shc-cart-store";
import { pushNotification } from "../../../../../lib/shc-notifications-store";

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
  const { collection_date, collection_slot, allergen_acked, pdpa_consent, creditsToApply, isCorporate } = parse.data;
  const customerId = getCustomerId(req);
  const cart = getCart(customerId);
  const cookId = cart.cookId || "cook_rose_tampines_001";
  const total = cart.items.reduce((s, i) => s + i.price * i.qty * 100, 0) || 4500;
  const orderId = `SHC-${Date.now().toString().slice(-8)}`;

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  await metaService.createOrUpdateMeta({
    order_id: orderId,
    cook_id: cookId,
    customer_id: customerId,
    collection_date,
    collection_slot,
    shc_status: "paid" as SHCOrderStatus,
    allergen_acked_at: allergen_acked ? new Date().toISOString() : undefined,
    pdpa_consent_at: pdpa_consent ? new Date().toISOString() : undefined,
    pdpa_consent_version: pdpa_consent ? "v1.0-pdpa-2025" : undefined,
    credits_applied_cents: creditsToApply || 0,
    is_corporate: !!isCorporate,
  } as any);

  if (allergen_acked) {
    await metaService.addOrderMessage(orderId, "cook", cookId, "Order received! I'll prepare with care. Collection details released 2h before slot.");
  }

  clearCart(customerId);
  pushNotification(customerId, { type: "order", body: `Order ${orderId} placed. PayNow reference pending.` });
  pushNotification(cookId, { type: "order", body: `New order ${orderId} — check your dashboard.` });

  const order = {
    id: orderId,
    cook_id: cookId,
    customer_id: customerId,
    items: cart.items,
    shc_status: "paid" as SHCOrderStatus,
    collection_date,
    collection_slot,
    allergen_acked_at: allergen_acked ? new Date().toISOString() : undefined,
    pdpa_consent_at: pdpa_consent ? new Date().toISOString() : undefined,
    credits_applied: creditsToApply,
    is_corporate: isCorporate,
    total,
  };
  const shc_meta = await metaService.getOrderMetaWithMessages(orderId);
  const logger = (req.scope as any).resolve?.("logger") || console;
  logger.info?.(`[SHC-STORE] demo-complete persisted order=${orderId} credits=${creditsToApply}`);
  res.json({ order, shc_meta, earningsPreview: Math.round(total * 0.85) });
}
