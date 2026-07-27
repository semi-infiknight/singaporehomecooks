import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250727120000CookCollectionTimeSlots extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "shc_cook" ADD COLUMN IF NOT EXISTS "collection_time_slots" jsonb DEFAULT '[]'::jsonb;`
    );
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_cook" DROP COLUMN IF EXISTS "collection_time_slots";`);
  }
}
