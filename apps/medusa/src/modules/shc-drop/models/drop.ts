import { model } from "@medusajs/framework/utils";

/** Cook-led “Cooking soon” batch listing */
export const Drop = model.define("shc_drop", {
  id: model.id().primaryKey(),
  cook_id: model.text(),
  title: model.text(),
  note: model.text().nullable(),
  image_url: model.text().nullable(),
  product_id: model.text().nullable(),
  price_cents: model.number(),
  min_qty: model.number().default(0),
  max_qty: model.number(),
  ordered_qty: model.number().default(0),
  cook_date: model.text(), // YYYY-MM-DD
  collection_slot: model.text(),
  order_by: model.text(), // ISO datetime
  status: model
    .enum(["open", "paused", "sold_out", "closed", "cancelled_min_not_met"])
    .default("open"),
  visibility: model.enum(["marketplace", "kitchen_only"]).default("marketplace"),
});

export type Drop = any;
