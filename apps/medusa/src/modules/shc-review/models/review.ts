import { model } from "@medusajs/framework/utils";

export const Review = model.define("shc_review", {
  id: model.id().primaryKey(),
  order_id: model.text().unique(),
  cook_id: model.text(),
  customer_id: model.text(),
  rating: model.number(),
  body: model.text().nullable(),
});

export type Review = any;