import { model } from "@medusajs/framework/utils";

export const FeatureFlag = model.define("shc_feature_flag", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  enabled: model.boolean().default(false),
  cohort_filter: model.json().default({} as any),
});

export type FeatureFlag = any;
