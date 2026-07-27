import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260727180000OrderMetaCustomerCollection extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "customer_collection_lat" real;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "customer_collection_lng" real;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "customer_collection_postal_code" text;`);
    this.addSql(`ALTER TABLE "shc_order_meta" ADD COLUMN IF NOT EXISTS "customer_collection_line1" text;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "customer_collection_line1";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "customer_collection_postal_code";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "customer_collection_lng";`);
    this.addSql(`ALTER TABLE "shc_order_meta" DROP COLUMN IF EXISTS "customer_collection_lat";`);
  }
}
