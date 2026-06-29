import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250629000006CreateShcFeatureFlag extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_feature_flag" (
        "id" text PRIMARY KEY,
        "key" text NOT NULL UNIQUE,
        "enabled" boolean NOT NULL DEFAULT false,
        "cohort_filter" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      );
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_feature_flag";`);
  }
}
