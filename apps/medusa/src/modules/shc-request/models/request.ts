import { model } from "@medusajs/framework/utils";

// shc_request per frozen 05-data-model + @shc/types shcRequestSchema (Phase 8)
export const Request = model.define("shc_request", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  body: model.text(),
  youtube_url: model.text().nullable(),
  party_size: model.number().nullable(),
  budget_cents: model.number().nullable(),
  date: model.text().nullable(), // YYYY-MM-DD
  status: model.enum(["open", "bidding", "matched", "closed"]).default("open"),
});

export type Request = any;
