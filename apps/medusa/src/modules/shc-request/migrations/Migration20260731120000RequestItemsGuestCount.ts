import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260731120000RequestItemsGuestCount extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_request" ADD COLUMN IF NOT EXISTS "guest_count" integer;`);
    this.addSql(`ALTER TABLE "shc_request" ADD COLUMN IF NOT EXISTS "items_json" text;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_request" DROP COLUMN IF EXISTS "guest_count";`);
    this.addSql(`ALTER TABLE "shc_request" DROP COLUMN IF EXISTS "items_json";`);
  }
}
