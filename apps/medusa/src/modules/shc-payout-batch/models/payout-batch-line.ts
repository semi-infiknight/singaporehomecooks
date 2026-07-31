// @ts-nocheck - Medusa DML patterns match other shc-* modules
import { model } from "@medusajs/framework/utils";

export const PayoutBatchLine = model.define("shc_payout_batch_line", {
  id: model.id().primaryKey(),
  batch_id: model.text(),
  cook_id: model.text(),
  amount_cents: model.number().default(0),
  order_count: model.number().default(0),
  transfer_ref: model.text().nullable(),
  status: model.enum(["pending", "approved", "paid", "skipped"]).default("pending"),
});

export type PayoutBatchLine = typeof PayoutBatchLine.$inferType;
