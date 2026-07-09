import { model } from "@medusajs/framework/utils";

export const TiffinSubscription = model.define("shc_tiffin_subscription", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  cook_id: model.text(),
  meals_per_week: model.number(),
  status: model.enum(["active", "cancelled"]).default("active"),
});

export type TiffinSubscription = any;