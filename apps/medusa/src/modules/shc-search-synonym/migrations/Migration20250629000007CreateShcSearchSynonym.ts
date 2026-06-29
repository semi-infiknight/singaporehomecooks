import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250629000007CreateShcSearchSynonym extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_search_synonym" (
        "id" text PRIMARY KEY,
        "term" text NOT NULL UNIQUE,
        "expansions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      );
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_search_synonym";`);
  }
}
