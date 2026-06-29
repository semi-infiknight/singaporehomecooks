import { model } from "@medusajs/framework/utils";

export const Dispute = model.define("shc_dispute", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  raised_by: model.enum(["customer", "cook", "ops"]),
  type: model.enum(["customer_complaint", "cook_cancelled_late", "quality", "other"]),
  status: model.enum(["open", "resolved", "cancelled"]).default("open"),
  notes: model.text().nullable(),
  resolution: model.text().nullable(),
});

export type Dispute = any;
