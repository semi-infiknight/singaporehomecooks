import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250617000001CreateShcReview extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_review" (
        "id" text PRIMARY KEY,
        "order_id" text UNIQUE NOT NULL,
        "cook_id" text NOT NULL,
        "customer_id" text NOT NULL,
        "rating" integer NOT NULL,
        "body" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_review_cook" ON "shc_review" ("cook_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_review_customer" ON "shc_review" ("customer_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_review";`);
  }
}