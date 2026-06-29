// @ts-nocheck
import { model } from "@medusajs/framework/utils";

export const ProductMeta = model.define("shc_product_meta", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(), // 1:1 with product for MVP
  cook_id: model.text(), // denorm or link via link
  name: model.text().nullable(),
  description: model.text().nullable(),
  cuisine: model.text(),
  occasion_tags: model.json().default([] as any),
  allergen_tiers: model.json().default({ tier1: [], tier2: [], tier3: [] }),
  halal: model.boolean().default(false),
  calories: model.number().nullable(),
  calories_confidence: model.enum(["full", "category"]).default("category"),
  ingredients: model.json().default([] as any),
  min_qty: model.number().default(1),
  price_cents: model.number().nullable(),
  last_minute_premium_pct: model.number().nullable(),
  heritage_note: model.text().nullable(),
  image_url: model.text().nullable(), // for dish photos / listings (small gap fix for media)
});

export type ProductMeta = any; // typeof ProductMeta.$inferType;
