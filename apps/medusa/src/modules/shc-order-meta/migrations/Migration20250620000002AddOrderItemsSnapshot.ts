import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250620000002AddOrderItemsSnapshot extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "items" jsonb;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "total_cents" integer;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "items";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "total_cents";`);
  }
}
