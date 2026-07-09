import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250709000001CreateShcTiffin extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_tiffin_kitchen_config" (
        "id" text PRIMARY KEY,
        "cook_id" text NOT NULL UNIQUE,
        "enabled" boolean NOT NULL DEFAULT false,
        "tagline" text,
        "eligible_product_ids" jsonb NOT NULL DEFAULT '[]',
        "meals_per_week_options" jsonb NOT NULL DEFAULT '[2,3,4]',
        "collection_days" jsonb NOT NULL DEFAULT '[1,2,3,4,5]',
        "default_collection_slot" text NOT NULL DEFAULT '18:00-19:00',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_tiffin_subscription" (
        "id" text PRIMARY KEY,
        "customer_id" text NOT NULL,
        "cook_id" text NOT NULL,
        "meals_per_week" integer NOT NULL,
        "status" text NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tiffin_sub_customer" ON "shc_tiffin_subscription" ("customer_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tiffin_sub_cook" ON "shc_tiffin_subscription" ("cook_id");`);
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_tiffin_weekly_plan" (
        "id" text PRIMARY KEY,
        "subscription_id" text NOT NULL,
        "week_start" text,
        "slots" jsonb NOT NULL DEFAULT '[]',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tiffin_plan_sub" ON "shc_tiffin_weekly_plan" ("subscription_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_tiffin_weekly_plan";`);
    this.addSql(`DROP TABLE IF EXISTS "shc_tiffin_subscription";`);
    this.addSql(`DROP TABLE IF EXISTS "shc_tiffin_kitchen_config";`);
  }
}