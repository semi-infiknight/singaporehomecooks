import { model } from "@medusajs/framework/utils";

export const Notification = model.define("shc_notification", {
  id: model.id().primaryKey(),
  actor_id: model.text(),
  type: model.text(),
  body: model.text(),
  read: model.boolean().default(false),
  // created_at/updated_at auto
});

export type Notification = any; // typeof Notification.$inferType;