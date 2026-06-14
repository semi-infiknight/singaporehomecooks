import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250614000004CreateShcLedger extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_ledger_entry" (
        "id" text PRIMARY KEY,
        "order_id" text,
        "debit_account" text NOT NULL,
        "credit_account" text NOT NULL,
        "amount_cents" integer NOT NULL,
        "batch_id" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_ledger_entry_order_id" ON "shc_ledger_entry" ("order_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_ledger_entry_batch_id" ON "shc_ledger_entry" ("batch_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_ledger_entry_debit" ON "shc_ledger_entry" ("debit_account");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_ledger_entry_credit" ON "shc_ledger_entry" ("credit_account");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_ledger_entry";`);
  }
}
