import { model } from "@medusajs/framework/utils";

export const PlatformStat = model.define("shc_platform_stat", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  value: model.json(),
});

export type PlatformStat = any;
