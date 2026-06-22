import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250622000001AddShcCartSoftDelete extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_cart" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_cart" DROP COLUMN IF EXISTS "deleted_at";`);
  }
}