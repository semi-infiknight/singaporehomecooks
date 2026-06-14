import { model } from "@medusajs/framework/utils";

// Minimal credit wallet for Phase 9 Home Credits (earn 5% on complete, redeem at checkout, 12m expiry tier stub).
// Balance tracked here; redemptions/earnings post to shc-ledger for money audit (Credit-Issuance / Credit-Redemption).
export const CreditWallet = model.define("shc_credit_wallet", {
  id: model.id().primaryKey(),
  customer_id: model.text().unique(),
  balance_cents: model.number().default(0), // units (4 ~ S$1)
  lifetime_spend_cents: model.number().default(0),
  tier: model.enum(["Bronze", "Silver", "Gold"]).default("Bronze"),
  last_earn_at: model.dateTime().nullable(),
});

export type CreditWallet = any;
