import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250731180000CookOnboardingV2 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "shc_cook"
      ADD COLUMN IF NOT EXISTS "contact_mobile" text NULL,
      ADD COLUMN IF NOT EXISTS "whatsapp_number" text NULL,
      ADD COLUMN IF NOT EXISTS "email_verified_at" timestamptz NULL,
      ADD COLUMN IF NOT EXISTS "mobile_verified_at" timestamptz NULL,
      ADD COLUMN IF NOT EXISTS "responsible_person_name" text NULL,
      ADD COLUMN IF NOT EXISTS "nric_fin_last4" text NULL,
      ADD COLUMN IF NOT EXISTS "alternate_contact" text NULL,
      ADD COLUMN IF NOT EXISTS "kitchen_halal_certified" boolean NULL,
      ADD COLUMN IF NOT EXISTS "terms_accepted_at" timestamptz NULL,
      ADD COLUMN IF NOT EXISTS "terms_version" text NULL,
      ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamptz NULL,
      ADD COLUMN IF NOT EXISTS "pdpa_consent_at" timestamptz NULL,
      ADD COLUMN IF NOT EXISTS "pdpa_consent_version" text NULL;
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "shc_cook"
      DROP COLUMN IF EXISTS "contact_mobile",
      DROP COLUMN IF EXISTS "whatsapp_number",
      DROP COLUMN IF EXISTS "email_verified_at",
      DROP COLUMN IF EXISTS "mobile_verified_at",
      DROP COLUMN IF EXISTS "responsible_person_name",
      DROP COLUMN IF EXISTS "nric_fin_last4",
      DROP COLUMN IF EXISTS "alternate_contact",
      DROP COLUMN IF EXISTS "kitchen_halal_certified",
      DROP COLUMN IF EXISTS "terms_accepted_at",
      DROP COLUMN IF EXISTS "terms_version",
      DROP COLUMN IF EXISTS "onboarding_completed_at",
      DROP COLUMN IF EXISTS "pdpa_consent_at",
      DROP COLUMN IF EXISTS "pdpa_consent_version";
    `);
  }
}
