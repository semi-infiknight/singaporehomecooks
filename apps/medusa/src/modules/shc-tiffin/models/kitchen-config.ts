import { model } from "@medusajs/framework/utils";

export const TiffinKitchenConfig = model.define("shc_tiffin_kitchen_config", {
  id: model.id().primaryKey(),
  cook_id: model.text().unique(),
  enabled: model.boolean().default(false),
  tagline: model.text().nullable(),
  eligible_product_ids: model.json().default([] as any),
  meals_per_week_options: model.json().default([2, 3, 4] as any),
  pricing_by_meals_per_week: model.json().default({ "2": 12, "3": 11, "4": 10 } as any),
  collection_days: model.json().default([1, 2, 3, 4, 5] as any),
  default_collection_slot: model.text().default("18:00-19:00"),
});

export type TiffinKitchenConfig = any;