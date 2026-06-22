import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250620000003AddImageUrl extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_product_meta" ADD COLUMN IF NOT EXISTS "image_url" text;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_product_meta" DROP COLUMN IF EXISTS "image_url";`);
  }
}
