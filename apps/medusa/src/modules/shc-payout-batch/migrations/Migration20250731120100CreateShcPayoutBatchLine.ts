import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250731120100CreateShcPayoutBatchLine extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_payout_batch_line" (
        "id" text PRIMARY KEY,
        "batch_id" text NOT NULL,
        "cook_id" text NOT NULL,
        "amount_cents" integer NOT NULL DEFAULT 0,
        "order_count" integer NOT NULL DEFAULT 0,
        "transfer_ref" text,
        "status" text NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shc_payout_batch_line_batch_id" ON "shc_payout_batch_line" ("batch_id");`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shc_payout_batch_line_cook_id" ON "shc_payout_batch_line" ("cook_id");`
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_shc_payout_batch_line_batch_cook" ON "shc_payout_batch_line" ("batch_id", "cook_id");`
    );
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_payout_batch_line";`);
  }
}
