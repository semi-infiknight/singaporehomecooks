import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250614000001CreateShcProductMeta extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_product_meta" (
        "id" text PRIMARY KEY,
        "product_id" text UNIQUE NOT NULL,
        "cook_id" text NOT NULL,
        "cuisine" text NOT NULL,
        "occasion_tags" jsonb NOT NULL DEFAULT '[]',
        "allergen_tiers" jsonb NOT NULL DEFAULT '{"tier1":[],"tier2":[],"tier3":[]}',
        "halal" boolean NOT NULL DEFAULT false,
        "calories" integer,
        "calories_confidence" text NOT NULL DEFAULT 'category',
        "ingredients" jsonb NOT NULL DEFAULT '[]',
        "min_qty" integer NOT NULL DEFAULT 1,
        "last_minute_premium_pct" integer,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_product_meta_product_id" ON "shc_product_meta" ("product_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_product_meta_cook_id" ON "shc_product_meta" ("cook_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_product_meta";`);
  }
}
