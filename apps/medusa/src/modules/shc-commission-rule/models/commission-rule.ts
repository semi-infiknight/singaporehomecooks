import { model } from "@medusajs/framework/utils";

export const CommissionRule = model.define("shc_commission_rule", {
  id: model.id().primaryKey(),
  version: model.number(),
  rate_pct: model.number(),
  effective_from: model.dateTime(),
  gst_rate: model.number().nullable(),
  created_by: model.text(),
});

export type CommissionRule = any;
