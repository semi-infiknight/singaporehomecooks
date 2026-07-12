import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260712000001CreateShcDrop extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_drop" (
        "id" text PRIMARY KEY,
        "cook_id" text NOT NULL,
        "title" text NOT NULL,
        "note" text,
        "image_url" text,
        "product_id" text,
        "price_cents" integer NOT NULL,
        "min_qty" integer NOT NULL DEFAULT 0,
        "max_qty" integer NOT NULL,
        "ordered_qty" integer NOT NULL DEFAULT 0,
        "cook_date" text NOT NULL,
        "collection_slot" text NOT NULL,
        "order_by" text NOT NULL,
        "status" text NOT NULL DEFAULT 'open',
        "visibility" text NOT NULL DEFAULT 'marketplace',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_drop_status" ON "shc_drop" ("status");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_drop_cook" ON "shc_drop" ("cook_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_drop_cook_date" ON "shc_drop" ("cook_date");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_drop_visibility" ON "shc_drop" ("visibility");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_drop";`);
  }
}
