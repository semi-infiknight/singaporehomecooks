import type { MedusaRequest } from "@medusajs/framework/http";
import { calculateCookEarnings } from "@shc/business-rules";
import { createSHCError, SHCOrderStatus } from "@shc/types";
import ShcOrderMetaModuleService from "../modules/shc-order-meta/service";
import ShcCartModuleService from "../modules/shc-cart/service";
import ShcDropModuleService from "../modules/shc-drop/service";
import { getCustomerId } from "./shc-actors";
import ShcNotificationModuleService from "../modules/shc-notification/service";

export type DemoCheckoutInput = {
  collection_date: string;
  collection_slot: string;
  allergen_acked: boolean;
  pdpa_consent: boolean;
  isCorporate?: boolean;
  cooking_notes?: string | null;
  collection_notes?: string | null;
  customer_collection_lat?: number | null;
  customer_collection_lng?: number | null;
  customer_collection_postal_code?: string | null;
  customer_collection_line1?: string | null;
};

export async function completeDemoCartCheckout(req: MedusaRequest, input: DemoCheckoutInput) {
  const customerId = getCustomerId(req);
  let {
    collection_date,
    collection_slot,
    allergen_acked,
    pdpa_consent,
    isCorporate = false,
    cooking_notes = null,
    collection_notes = null,
    customer_collection_lat = null,
    customer_collection_lng = null,
    customer_collection_postal_code = null,
    customer_collection_line1 = null,
  } = input;

  const trimNote = (v: string | null | undefined) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s.slice(0, 2000) : null;
  };
  cooking_notes = trimNote(cooking_notes);
  collection_notes = trimNote(collection_notes);

  const cartService: ShcCartModuleService = req.scope.resolve("shcCart") as any;
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;

  const cart = await cartService.getCart(customerId);
  if (!cart.items?.length) {
    throw createSHCError("SHC-GENERIC-001", "Cart is empty — add items before checkout");
  }

  // Cooking soon: reserve capacity + lock collection from the batch (ignore free-picked slots)
  let originDropId: string | null = null;
  const dropLines = cart.items.filter((i: any) => i.drop_id);
  if (dropLines.length) {
    const dropId = String(dropLines[0].drop_id);
    const qty = dropLines.reduce((s: number, i: any) => s + Number(i.qty || 0), 0);
    originDropId = dropId;
    try {
      const dropService: ShcDropModuleService = req.scope.resolve("shcDrop") as any;
      const { drop } = await dropService.reserveQty(dropId, qty);
      collection_date = drop.cook_date;
      collection_slot = drop.collection_slot;
      // Sync line snapshot with reserved batch
      for (const line of cart.items as any[]) {
        if (line.drop_id === dropId) {
          line.collection_date = drop.cook_date;
          line.collection_slot = drop.collection_slot;
          line.price = Number(drop.price_cents) / 100;
        }
      }
    } catch (e: any) {
      // Do not clear cart — customer can retry or pick another qty
      if (e?.code) throw e;
      throw createSHCError("SHC-GENERIC-001", e?.message || "Batch no longer available");
    }
  }

  const cookId = cart.cookId || cart.items[0]?.cook_id;
  if (!cookId) {
    throw createSHCError("SHC-GENERIC-001", "Cart has no cook — add items from a published listing first");
  }
  const total = cart.items.reduce((s: number, i: any) => s + i.price * i.qty * 100, 0) || 4500;
  const orderId = `SHC-${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 6)}`;

  await metaService.createOrUpdateMeta({
    order_id: orderId,
    cook_id: cookId,
    customer_id: customerId,
    collection_date,
    collection_slot,
    // Awaiting HitPay — paynow + webhook mark paid (do not stamp paid at place-order)
    shc_status: "cart" as SHCOrderStatus,
    allergen_acked_at: allergen_acked ? new Date().toISOString() : undefined,
    pdpa_consent_at: pdpa_consent ? new Date().toISOString() : undefined,
    pdpa_consent_version: pdpa_consent ? "v1.0-pdpa-2025" : undefined,
    is_corporate: !!isCorporate,
    corporate_note: isCorporate
      ? `Corporate/group order — multi-dish note for ops.`
      : originDropId
        ? `Cooking soon batch ${originDropId}`
        : undefined,
    cooking_notes,
    collection_notes,
    customer_collection_lat,
    customer_collection_lng,
    customer_collection_postal_code: customer_collection_postal_code?.trim() || null,
    customer_collection_line1: customer_collection_line1?.trim() || null,
    origin_request_id: originDropId ? `drop:${originDropId}` : undefined,
    items: cart.items,
    total_cents: total,
  } as any);

  if (allergen_acked) {
    const msg = originDropId
      ? `Thanks for joining my batch! Collection ${collection_date} · ${collection_slot}.`
      : "Order received! I'll prepare with care. Collection details released 2h before slot.";
    await metaService.addOrderMessage(orderId, "cook", cookId, msg);
  }
  if (cooking_notes) {
    await metaService.addOrderMessage(orderId, "customer", customerId, `Cooking note: ${cooking_notes}`);
  }
  if (collection_notes) {
    await metaService.addOrderMessage(orderId, "customer", customerId, `Collection note: ${collection_notes}`);
  }

  await cartService.clearCart(customerId);
  const notifService: ShcNotificationModuleService = req.scope.resolve("shcNotification") as any;
  await notifService.push(customerId, {
    type: "order",
    body: `Order ${orderId} placed — waiting for your cook to confirm.`,
  });
  await notifService.push(cookId, {
    type: "order",
    body: originDropId ? `Batch order ${orderId}` : `New order ${orderId} — confirm or decline in your dashboard.`,
  });

  const order = {
    id: orderId,
    cook_id: cookId,
    customer_id: customerId,
    items: cart.items,
    // Awaiting HitPay — paynow + webhook mark paid (do not stamp paid at place-order)
    shc_status: "cart" as SHCOrderStatus,
    collection_date,
    collection_slot,
    allergen_acked_at: allergen_acked ? new Date().toISOString() : undefined,
    pdpa_consent_at: pdpa_consent ? new Date().toISOString() : undefined,
    is_corporate: isCorporate,
    total,
    origin_drop_id: originDropId,
  };
  const shc_meta = await metaService.getOrderMetaWithMessages(orderId);
  return { order, shc_meta, earningsPreview: calculateCookEarnings(Math.round(total * 100)) / 100 };
}
