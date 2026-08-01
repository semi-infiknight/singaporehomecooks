import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260801120000OrderMetaGuestContact extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "guest_name" text;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "guest_email" text;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "guest_phone" text;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "guest_phone";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "guest_email";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "guest_name";`);
  }
}
