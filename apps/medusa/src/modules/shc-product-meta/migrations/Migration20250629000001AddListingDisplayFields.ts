import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250629000001AddListingDisplayFields extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_product_meta" ADD COLUMN IF NOT EXISTS "name" text;`);
    this.addSql(`ALTER TABLE "shc_product_meta" ADD COLUMN IF NOT EXISTS "description" text;`);
    this.addSql(`ALTER TABLE "shc_product_meta" ADD COLUMN IF NOT EXISTS "price_cents" integer;`);
    this.addSql(`ALTER TABLE "shc_product_meta" ADD COLUMN IF NOT EXISTS "heritage_note" text;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_product_meta" DROP COLUMN IF EXISTS "heritage_note";`);
    this.addSql(`ALTER TABLE "shc_product_meta" DROP COLUMN IF EXISTS "price_cents";`);
    this.addSql(`ALTER TABLE "shc_product_meta" DROP COLUMN IF EXISTS "description";`);
    this.addSql(`ALTER TABLE "shc_product_meta" DROP COLUMN IF EXISTS "name";`);
  }
}
