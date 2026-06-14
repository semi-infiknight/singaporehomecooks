import { model } from "@medusajs/framework/utils";

export const OrderMeta = model.define("shc_order_meta", {
  id: model.id().primaryKey(),
  order_id: model.text().unique(), // 1:1 link to medusa order
  cook_id: model.text(),
  collection_date: model.text(), // YYYY-MM-DD
  collection_slot: model.text(),
  allergen_acked_at: model.dateTime().nullable(),
  address_released_at: model.dateTime().nullable(),
  paynow_reference: model.text().nullable(),
  shc_status: model.enum([
    "cart",
    "paid",
    "accepted",
    "preparing",
    "ready_for_collection",
    "collected",
    "completed",
    "cancelled",
    "disputed",
    "resolved",
  ]).default("cart"),
  // Growth extensions (Phase 8-9, additive; request-originated orders, credits redemption at complete, corporate flag). Persisted here for /orders metadata.
  // Not changing frozen @shc/types shcOrderMetaSchema (API responses additive only).
  origin_request_id: model.text().nullable(),
  credits_applied_cents: model.number().nullable(),
  is_corporate: model.boolean().default(false),
  corporate_note: model.text().nullable(),
});

export type OrderMeta = any;

export const OrderMessage = model.define("shc_order_message", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  sender_actor: model.enum(["customer", "cook", "ops"]),
  sender_id: model.text(),
  body: model.text(),
});

export type OrderMessage = any;
