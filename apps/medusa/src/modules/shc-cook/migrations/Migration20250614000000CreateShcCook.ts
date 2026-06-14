import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250614000000CreateShcCook extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_cook" (
        "id" text PRIMARY KEY,
        "auth_identity_id" text UNIQUE NOT NULL,
        "slug" text UNIQUE NOT NULL,
        "display_name" text NOT NULL,
        "story" text,
        "area" text NOT NULL,
        "collection_address" text,
        "collection_instructions" text,
        "status" text NOT NULL DEFAULT 'pending',
        "availability_paused" boolean NOT NULL DEFAULT false,
        "expo_push_token" text,
        "sfa_reg_number" text,
        "wsq_cert_expiry" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      );
    `);
    // Index for common queries
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_cook_slug" ON "shc_cook" ("slug");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_cook_status" ON "shc_cook" ("status");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_cook";`);
  }
}
