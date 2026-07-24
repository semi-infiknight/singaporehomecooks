import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/** shc_heritage module removed — dish story lives on listing description + cook profile story. */
export class Migration20250724000002DropShcHeritageTable extends Migration {
  async up(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_heritage";`);
  }

  async down(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_heritage" (
        "id" text PRIMARY KEY,
        "cook_id" text NOT NULL,
        "title" text NOT NULL,
        "story" text NOT NULL,
        "photo_stub" text,
        "published" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_heritage_cook" ON "shc_heritage" ("cook_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_heritage_published" ON "shc_heritage" ("published");`);
  }
}
