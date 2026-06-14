import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250614000006CreateShcRequest extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_request" (
        "id" text PRIMARY KEY,
        "customer_id" text NOT NULL,
        "body" text NOT NULL,
        "youtube_url" text,
        "party_size" integer,
        "budget_cents" integer,
        "date" text,
        "status" text NOT NULL DEFAULT 'open',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_request_status" ON "shc_request" ("status");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_request_customer" ON "shc_request" ("customer_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_request";`);
  }
}
