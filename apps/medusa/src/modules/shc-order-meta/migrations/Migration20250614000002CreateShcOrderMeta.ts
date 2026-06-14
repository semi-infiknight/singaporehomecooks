import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250614000002CreateShcOrderMeta extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_order_meta" (
        "id" text PRIMARY KEY,
        "order_id" text UNIQUE NOT NULL,
        "cook_id" text NOT NULL,
        "collection_date" text NOT NULL,
        "collection_slot" text NOT NULL,
        "allergen_acked_at" timestamptz,
        "address_released_at" timestamptz,
        "paynow_reference" text,
        "shc_status" text NOT NULL DEFAULT 'cart',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_order_meta_order_id" ON "shc_order_meta" ("order_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_order_meta_cook_id" ON "shc_order_meta" ("cook_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_order_meta_shc_status" ON "shc_order_meta" ("shc_status");`);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_order_message" (
        "id" text PRIMARY KEY,
        "order_id" text NOT NULL,
        "sender_actor" text NOT NULL,
        "sender_id" text NOT NULL,
        "body" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_order_message_order_id" ON "shc_order_message" ("order_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_order_message";`);
    this.addSql(`DROP TABLE IF EXISTS "shc_order_meta";`);
  }
}
