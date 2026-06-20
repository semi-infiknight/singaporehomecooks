import { model } from "@medusajs/framework/utils";

export const Cook = model.define("shc_cook", {
  id: model.id().primaryKey(),
  auth_identity_id: model.text().unique(),
  slug: model.text().unique(),
  display_name: model.text(),
  story: model.text().nullable(),
  area: model.text(),
  collection_address: model.text().nullable(),
  collection_instructions: model.text().nullable(),
  status: model.enum(["pending", "active", "paused", "suspended"]).default("pending"),
  availability_paused: model.boolean().default(false),
  expo_push_token: model.text().nullable(),
  sfa_reg_number: model.text().nullable(),
  wsq_cert_expiry: model.dateTime().nullable(),
  login_email: model.text().nullable(),
  password_hash: model.text().nullable(),
});

// Do not define created_at/updated_at/deleted_at explicitly - Medusa DML adds them automatically.
// Workaround for ts-node/DML inference during `medusa develop`.
export type Cook = any; // typeof Cook.$inferType;
