import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260718160000OrderMetaCustomerNotes extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "cooking_notes" text;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "collection_notes" text;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "cooking_notes";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "collection_notes";`);
  }
}
