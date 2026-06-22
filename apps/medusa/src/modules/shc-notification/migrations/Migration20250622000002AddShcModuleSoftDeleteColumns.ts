import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/** MedusaService models expect deleted_at on all custom tables. */
export class Migration20250622000002AddShcModuleSoftDeleteColumns extends Migration {
  async up(): Promise<void> {
    const tables = [
      "shc_notification",
      "shc_review",
      "shc_request",
      "shc_bid",
      "shc_availability",
      "shc_product_meta",
      "shc_heritage",
      "shc_credit_wallet",
      "shc_ledger_entry",
      "shc_payout_batch",
    ];
    for (const table of tables) {
      this.addSql(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;`);
    }
  }

  async down(): Promise<void> {
    const tables = [
      "shc_payout_batch",
      "shc_ledger_entry",
      "shc_credit_wallet",
      "shc_heritage",
      "shc_product_meta",
      "shc_availability",
      "shc_bid",
      "shc_request",
      "shc_review",
      "shc_notification",
    ];
    for (const table of tables) {
      this.addSql(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "deleted_at";`);
    }
  }
}