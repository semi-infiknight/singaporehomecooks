import { model } from "@medusajs/framework/utils";

export const Availability = model.define("shc_availability", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(),
  portions_per_day: model.number(),
  collection_days: model.json(), // e.g. [0,1,2,3,4,5,6] Sunday=0
  time_slots: model.json(), // ["18:00-19:00", ...]
  paused: model.boolean().default(false),
  /** Calendar days before collection customers must order. */
  min_order_lead_days: model.number().nullable(),
  /** Hours before slot start customers must order. */
  min_order_lead_hours: model.number().nullable(),
  /** HH:MM cutoff on the lead day (e.g. "14:00"). */
  order_cutoff_time: model.text().nullable(),
});

export type Availability = any;
