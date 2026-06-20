import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250620000001CookPasswordHash extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_cook" ADD COLUMN IF NOT EXISTS "password_hash" text;`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_cook" DROP COLUMN IF EXISTS "password_hash";`);
  }
}