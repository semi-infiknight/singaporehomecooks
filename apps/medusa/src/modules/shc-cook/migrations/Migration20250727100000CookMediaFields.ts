import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250727100000CookMediaFields extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_cook" ADD COLUMN IF NOT EXISTS "avatar_url" text;`);
    this.addSql(`ALTER TABLE "shc_cook" ADD COLUMN IF NOT EXISTS "hero_image_url" text;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_cook" DROP COLUMN IF EXISTS "avatar_url";`);
    this.addSql(`ALTER TABLE "shc_cook" DROP COLUMN IF EXISTS "hero_image_url";`);
  }
}
