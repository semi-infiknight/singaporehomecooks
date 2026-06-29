import type { MedusaRequest } from "@medusajs/framework/http";
import { SHCOrderStatus } from "@shc/types";
import ShcOrderMetaModuleService from "../modules/shc-order-meta/service";
import ShcCartModuleService from "../modules/shc-cart/service";
import ShcCreditWalletModuleService from "../modules/shc-credit-wallet/service";
import { getCustomerId } from "./shc-actors";
import ShcNotificationModuleService from "../modules/shc-notification/service";

export type DemoCheckoutInput = {
  collection_date: string;
  collection_slot: string;
  allergen_acked: boolean;
  pdpa_consent: boolean;
  creditsToApply?: number;
  isCorporate?: boolean;
};

export async function completeDemoCartCheckout(req: MedusaRequest, input: DemoCheckoutInput) {
  const customerId = getCustomerId(req);
  const { collection_date, collection_slot, allergen_acked, pdpa_consent, creditsToApply = 0, isCorporate = false } = input;

  const cartService: ShcCartModuleService = req.scope.resolve("shcCart") as any;
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const credService: ShcCreditWalletModuleService = req.scope.resolve("shcCreditWallet") as any;

  const cart = await cartService.getCart(customerId);
  if (!cart.items?.length) {
    throw new Error("Cart is empty — add items before checkout");
  }

  let creditsApplied = 0;
  if (creditsToApply > 0) {
    const r = await credService.redeemCredits(customerId, creditsToApply, req.scope);
    creditsApplied = r.used || 0;
  }

  const cookId = cart.cookId || "cook_rose_tampines_001";
  const total = cart.items.reduce((s, i) => s + i.price * i.qty * 100, 0) || 4500;
  const orderId = `SHC-${Date.now().toString().slice(-8)}`;

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
    credits_applied_cents: creditsApplied || 0,
    is_corporate: !!isCorporate,
    corporate_note: isCorporate ? `Corporate/group order — invoice stub queued for ops.` : undefined,
    items: cart.items,
    total_cents: total,
  } as any);

  if (allergen_acked) {
    await metaService.addOrderMessage(orderId, "cook", cookId, "Order received! I'll prepare with care. Collection details released 2h before slot.");
  }

  await cartService.clearCart(customerId);
  const notifService: ShcNotificationModuleService = req.scope.resolve("shcNotification") as any;
  await notifService.push(customerId, { type: "order", body: `Order ${orderId} placed.` });
  await notifService.push(cookId, { type: "order", body: `New order ${orderId} — check your dashboard.` });

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
    credits_applied: creditsApplied,
    is_corporate: isCorporate,
    total,
  };
  const shc_meta = await metaService.getOrderMetaWithMessages(orderId);
  return { order, shc_meta, earningsPreview: Math.round(total * 0.85), credits_applied: creditsApplied };
}