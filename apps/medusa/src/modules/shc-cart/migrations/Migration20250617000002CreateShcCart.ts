import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250617000002CreateShcCart extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_cart" (
        "id" text PRIMARY KEY,
        "customer_id" text UNIQUE NOT NULL,
        "cook_id" text,
        "items_json" text NOT NULL DEFAULT '[]',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_cart_customer" ON "shc_cart" ("customer_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_cart";`);
  }
}