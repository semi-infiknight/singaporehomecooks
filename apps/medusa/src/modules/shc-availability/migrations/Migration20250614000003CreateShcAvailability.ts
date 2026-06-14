import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250614000003CreateShcAvailability extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_availability" (
        "id" text PRIMARY KEY,
        "product_id" text UNIQUE NOT NULL,
        "portions_per_day" integer NOT NULL,
        "collection_days" jsonb NOT NULL DEFAULT '[]',
        "time_slots" jsonb NOT NULL DEFAULT '[]',
        "paused" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_availability_product_id" ON "shc_availability" ("product_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_availability";`);
  }
}
