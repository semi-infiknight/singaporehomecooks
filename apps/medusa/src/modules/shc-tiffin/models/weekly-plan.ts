import { model } from "@medusajs/framework/utils";

/** week_start null = recurring template; ISO Monday date = week-specific override */
export const TiffinWeeklyPlan = model.define("shc_tiffin_weekly_plan", {
  id: model.id().primaryKey(),
  subscription_id: model.text(),
  week_start: model.text().nullable(),
  slots: model.json().default([] as any),
});

export type TiffinWeeklyPlan = any;