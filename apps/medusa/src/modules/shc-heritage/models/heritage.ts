import { model } from "@medusajs/framework/utils";

// shc_heritage for Phase 8 permanent cook recipe archive (published even if cook inactive; add from dashboard).
// Not in core frozen types yet; local shape + used in routes. Ties to shc_cook.
export const Heritage = model.define("shc_heritage", {
  id: model.id().primaryKey(),
  cook_id: model.text(),
  title: model.text(),
  story: model.text(),
  photo_stub: model.text().nullable(),
  published: model.boolean().default(true),
});

export type Heritage = any;
