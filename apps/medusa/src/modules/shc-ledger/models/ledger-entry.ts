// @ts-nocheck - Medusa DML $inferType + model patterns match other shc-* modules (pre-existing typecheck baseline)
import { model } from "@medusajs/framework/utils";

// shc_ledger_entry per 05-data-model.md (frozen contract). Double-entry: each row is a debit/credit pair transfer of amount.
// Invariant enforced in service: for entries sharing batch_id or order_id group, construction keeps balance (each entry self-balances debit amount with credit).
export const LedgerEntry = model.define("shc_ledger_entry", {
  id: model.id().primaryKey(),
  order_id: model.text().nullable(),
  debit_account: model.text(),
  credit_account: model.text(),
  amount_cents: model.number(),
  batch_id: model.text().nullable(),
});

export type LedgerEntry = typeof LedgerEntry.$inferType;
