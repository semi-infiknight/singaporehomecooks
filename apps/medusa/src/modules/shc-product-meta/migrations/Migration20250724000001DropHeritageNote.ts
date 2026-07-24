import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/** heritage_note removed from product model — dish story lives in description only. */
export class Migration20250724000001DropHeritageNote extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_product_meta" DROP COLUMN IF EXISTS "heritage_note";`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_product_meta" ADD COLUMN IF NOT EXISTS "heritage_note" text;`);
  }
}
