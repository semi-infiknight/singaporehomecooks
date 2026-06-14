// @ts-nocheck - Medusa DML $inferType + model patterns match other shc-* modules (pre-existing typecheck baseline)
import { model } from "@medusajs/framework/utils";

// shc_payout_batch per 05-data-model.md (frozen). Weekly batches (Monday sim). Status drives approval flow.
export const PayoutBatch = model.define("shc_payout_batch", {
  id: model.id().primaryKey(),
  week_start: model.text(), // YYYY-MM-DD (Monday)
  status: model.enum(["pending", "approved", "paid"]).default("pending"),
  total_cents: model.number().default(0),
  transfer_ref: model.text().nullable(),
  approved_at: model.dateTime().nullable(),
});

export type PayoutBatch = typeof PayoutBatch.$inferType;
