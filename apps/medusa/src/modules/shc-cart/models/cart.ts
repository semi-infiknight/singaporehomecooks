import { model } from "@medusajs/framework/utils";

/** Postgres-backed customer cart — production parity (replaces Redis-only dev store). */
export const Cart = model.define("shc_cart", {
  id: model.id().primaryKey(),
  customer_id: model.text().unique(),
  cook_id: model.text().nullable(),
  items_json: model.text().default("[]"),
});

export type Cart = any;