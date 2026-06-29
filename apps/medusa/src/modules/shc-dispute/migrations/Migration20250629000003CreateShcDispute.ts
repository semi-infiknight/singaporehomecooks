import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250629000003CreateShcDispute extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_dispute" (
        "id" text PRIMARY KEY,
        "order_id" text NOT NULL,
        "raised_by" text NOT NULL,
        "type" text NOT NULL,
        "status" text NOT NULL DEFAULT 'open',
        "notes" text,
        "resolution" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_dispute_order_id" ON "shc_dispute" ("order_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_dispute";`);
  }
}
