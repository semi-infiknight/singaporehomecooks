import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250614000009CreateShcHeritage extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_heritage" (
        "id" text PRIMARY KEY,
        "cook_id" text NOT NULL,
        "title" text NOT NULL,
        "story" text NOT NULL,
        "photo_stub" text,
        "published" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_heritage_cook" ON "shc_heritage" ("cook_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_heritage_published" ON "shc_heritage" ("published");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_heritage";`);
  }
}
