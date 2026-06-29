import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250629000004CreateShcCommissionRule extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_commission_rule" (
        "id" text PRIMARY KEY,
        "version" integer NOT NULL,
        "rate_pct" integer NOT NULL,
        "effective_from" timestamptz NOT NULL,
        "gst_rate" integer,
        "created_by" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      );
    `);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shc_commission_rule_version" ON "shc_commission_rule" ("version");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_commission_rule";`);
  }
}
