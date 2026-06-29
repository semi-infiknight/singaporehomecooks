import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250629000005CreateShcCookExpense extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_cook_expense" (
        "id" text PRIMARY KEY,
        "cook_id" text NOT NULL,
        "amount_cents" integer NOT NULL,
        "category" text NOT NULL,
        "receipt_key" text,
        "date" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_cook_expense_cook_id" ON "shc_cook_expense" ("cook_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_cook_expense";`);
  }
}
