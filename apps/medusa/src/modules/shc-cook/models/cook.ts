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
  collection_time_slots: model.json().default([] as any),
  avatar_url: model.text().nullable(),
  hero_image_url: model.text().nullable(),
  status: model.enum(["pending", "active", "paused", "suspended"]).default("pending"),
  availability_paused: model.boolean().default(false),
  expo_push_token: model.text().nullable(),
  sfa_reg_number: model.text().nullable(),
  wsq_cert_expiry: model.dateTime().nullable(),
  login_email: model.text().nullable(),
  password_hash: model.text().nullable(),
  paynow_mobile: model.text().nullable(),
  paynow_uen: model.text().nullable(),
  payout_legal_name: model.text().nullable(),
  contact_mobile: model.text().nullable(),
  whatsapp_number: model.text().nullable(),
  email_verified_at: model.dateTime().nullable(),
  mobile_verified_at: model.dateTime().nullable(),
  responsible_person_name: model.text().nullable(),
  nric_fin_last4: model.text().nullable(),
  alternate_contact: model.text().nullable(),
  kitchen_halal_certified: model.boolean().nullable(),
  terms_accepted_at: model.dateTime().nullable(),
  terms_version: model.text().nullable(),
  onboarding_completed_at: model.dateTime().nullable(),
  pdpa_consent_at: model.dateTime().nullable(),
  pdpa_consent_version: model.text().nullable(),
});

// Do not define created_at/updated_at/deleted_at explicitly - Medusa DML adds them automatically.
// Workaround for ts-node/DML inference during `medusa develop`.
export type Cook = any; // typeof Cook.$inferType;
