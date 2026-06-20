import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250617000003CookLoginEmail extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "shc_cook" ADD COLUMN IF NOT EXISTS "login_email" text;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shc_cook_login_email" ON "shc_cook" ("login_email") WHERE "login_email" IS NOT NULL;`);
    this.addSql(`UPDATE "shc_cook" SET "login_email" = 'rose@shc.local' WHERE "id" = 'cook_rose_tampines_001' AND "login_email" IS NULL;`);
    this.addSql(`UPDATE "shc_cook" SET "login_email" = 'doris@shc.local' WHERE "id" = 'cook_doris_katong_002' AND "login_email" IS NULL;`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_shc_cook_login_email";`);
    this.addSql(`ALTER TABLE "shc_cook" DROP COLUMN IF EXISTS "login_email";`);
  }
}