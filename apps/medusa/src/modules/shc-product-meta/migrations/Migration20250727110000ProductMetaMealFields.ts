import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250727110000ProductMetaMealFields extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_product_meta" ADD COLUMN IF NOT EXISTS "meal_extras" jsonb NOT NULL DEFAULT '[]';`);
    this.addSql(`ALTER TABLE "shc_product_meta" ADD COLUMN IF NOT EXISTS "meal_addons" jsonb NOT NULL DEFAULT '[]';`);
    this.addSql(`ALTER TABLE "shc_product_meta" ADD COLUMN IF NOT EXISTS "recipe_steps" jsonb NOT NULL DEFAULT '[]';`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_product_meta" DROP COLUMN IF EXISTS "recipe_steps";`);
    this.addSql(`ALTER TABLE "shc_product_meta" DROP COLUMN IF EXISTS "meal_addons";`);
    this.addSql(`ALTER TABLE "shc_product_meta" DROP COLUMN IF EXISTS "meal_extras";`);
  }
}
