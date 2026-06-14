import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250614000007CreateShcBid extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_bid" (
        "id" text PRIMARY KEY,
        "request_id" text NOT NULL,
        "cook_id" text NOT NULL,
        "price_cents" integer NOT NULL,
        "message" text,
        "status" text NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_bid_request" ON "shc_bid" ("request_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_bid_cook" ON "shc_bid" ("cook_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_bid_status" ON "shc_bid" ("status");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_bid";`);
  }
}
