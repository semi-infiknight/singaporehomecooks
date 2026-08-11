import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260810000001OrderWindowFields extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "shc_availability"
      ADD COLUMN IF NOT EXISTS "min_order_lead_days" integer NULL,
      ADD COLUMN IF NOT EXISTS "min_order_lead_hours" integer NULL,
      ADD COLUMN IF NOT EXISTS "order_cutoff_time" text NULL;
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "shc_availability"
      DROP COLUMN IF EXISTS "min_order_lead_days",
      DROP COLUMN IF EXISTS "min_order_lead_hours",
      DROP COLUMN IF EXISTS "order_cutoff_time";
    `);
  }
}
