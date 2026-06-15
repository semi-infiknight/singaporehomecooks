import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250615000001OrderMetaCustomerPdpa extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "customer_id" text;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "pdpa_consent_at" timestamptz;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "pdpa_consent_version" text;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "origin_request_id" text;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "credits_applied_cents" integer;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "is_corporate" boolean DEFAULT false;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "corporate_note" text;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_order_meta_customer_id" ON "shc_order_meta" ("customer_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_shc_order_meta_customer_id";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "corporate_note";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "is_corporate";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "credits_applied_cents";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "origin_request_id";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "pdpa_consent_version";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "pdpa_consent_at";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "customer_id";`);
  }
}