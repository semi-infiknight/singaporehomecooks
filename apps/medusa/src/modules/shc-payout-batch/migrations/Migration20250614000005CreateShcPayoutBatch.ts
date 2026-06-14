import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250614000005CreateShcPayoutBatch extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_payout_batch" (
        "id" text PRIMARY KEY,
        "week_start" text NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "total_cents" integer NOT NULL DEFAULT 0,
        "transfer_ref" text,
        "approved_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_payout_batch_week_start" ON "shc_payout_batch" ("week_start");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_payout_batch_status" ON "shc_payout_batch" ("status");`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_shc_payout_batch_week" ON "shc_payout_batch" ("week_start");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_payout_batch";`);
  }
}
