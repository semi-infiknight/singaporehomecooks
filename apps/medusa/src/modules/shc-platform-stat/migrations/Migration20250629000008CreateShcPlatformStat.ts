import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250629000008CreateShcPlatformStat extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_platform_stat" (
        "id" text PRIMARY KEY,
        "key" text NOT NULL UNIQUE,
        "value" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      );
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_platform_stat";`);
  }
}
