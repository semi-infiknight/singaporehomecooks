import { model } from "@medusajs/framework/utils";

export const Availability = model.define("shc_availability", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(),
  portions_per_day: model.number(),
  collection_days: model.json(), // e.g. [0,1,2,3,4,5,6] Sunday=0
  time_slots: model.json(), // ["18:00-19:00", ...]
  paused: model.boolean().default(false),
});

export type Availability = any;
