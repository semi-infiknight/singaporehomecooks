import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250731120000CookPaynowFields extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_cook" ADD COLUMN IF NOT EXISTS "paynow_mobile" text;`);
    this.addSql(`ALTER TABLE "shc_cook" ADD COLUMN IF NOT EXISTS "paynow_uen" text;`);
    this.addSql(`ALTER TABLE "shc_cook" ADD COLUMN IF NOT EXISTS "payout_legal_name" text;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_cook" DROP COLUMN IF EXISTS "payout_legal_name";`);
    this.addSql(`ALTER TABLE "shc_cook" DROP COLUMN IF EXISTS "paynow_uen";`);
    this.addSql(`ALTER TABLE "shc_cook" DROP COLUMN IF EXISTS "paynow_mobile";`);
  }
}
