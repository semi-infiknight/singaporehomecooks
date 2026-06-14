import { model } from "@medusajs/framework/utils";

// shc_bid per frozen 05-data-model + @shc/types shcBidSchema (Phase 8)
export const Bid = model.define("shc_bid", {
  id: model.id().primaryKey(),
  request_id: model.text(),
  cook_id: model.text(),
  price_cents: model.number(),
  message: model.text().nullable(),
  status: model.enum(["pending", "accepted", "rejected"]).default("pending"),
});

export type Bid = any;
