import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250615000002OrderMetaSoftDelete extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;`);
    this.addSql(`ALTER TABLE "shc_order_message" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();`);
    this.addSql(`ALTER TABLE "shc_order_message" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_order_message" DROP COLUMN IF EXISTS "deleted_at";`);
    this.addSql(`ALTER TABLE "shc_order_message" DROP COLUMN IF EXISTS "updated_at";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "deleted_at";`);
  }
}