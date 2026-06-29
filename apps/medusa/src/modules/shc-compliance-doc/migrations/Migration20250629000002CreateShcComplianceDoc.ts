import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250629000002CreateShcComplianceDoc extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_compliance_doc" (
        "id" text PRIMARY KEY,
        "cook_id" text NOT NULL,
        "type" text NOT NULL,
        "file_key" text NOT NULL,
        "expiry_date" timestamptz,
        "verified_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_compliance_doc_cook_id" ON "shc_compliance_doc" ("cook_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_compliance_doc";`);
  }
}
