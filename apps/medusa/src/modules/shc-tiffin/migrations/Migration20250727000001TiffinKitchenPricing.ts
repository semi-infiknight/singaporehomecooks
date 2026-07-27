import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250727000001TiffinKitchenPricing extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "shc_tiffin_kitchen_config"
      ADD COLUMN IF NOT EXISTS "pricing_by_meals_per_week" jsonb NOT NULL DEFAULT '{"2":12,"3":11,"4":10}';
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "shc_tiffin_kitchen_config"
      DROP COLUMN IF EXISTS "pricing_by_meals_per_week";
    `);
  }
}
