import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260731130000BidLineItemsJson extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_bid" ADD COLUMN IF NOT EXISTS "line_items_json" text;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_bid" DROP COLUMN IF EXISTS "line_items_json";`);
  }
}
