import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250614000008CreateShcCreditWallet extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_credit_wallet" (
        "id" text PRIMARY KEY,
        "customer_id" text UNIQUE NOT NULL,
        "balance_cents" integer NOT NULL DEFAULT 0,
        "lifetime_spend_cents" integer NOT NULL DEFAULT 0,
        "tier" text NOT NULL DEFAULT 'Bronze',
        "last_earn_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_credit_wallet_customer" ON "shc_credit_wallet" ("customer_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_credit_wallet";`);
  }
}
