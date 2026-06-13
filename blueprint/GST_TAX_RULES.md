# GST & Tax Rules

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [DECISION_TREES/commission-structure.md](../DECISION_TREES/commission-structure.md)
- [production/compliance-pdpa.md](../production/compliance-pdpa.md)
- [16-references/16-references.md](../16-references/16-references.md)

**Last Updated:** 2026-06-13 (Contracts Track owns)
**Owner:** Contracts Track

## Singapore GST Context for Marketplace

- Platform operator (Singapore Home Cooks) is responsible for GST registration once turnover threshold is met.
- Commission income is subject to GST.
- Cooks may or may not be GST-registered depending on their individual turnover.

## Platform Rules

1. Commission invoices clearly separate GST where applicable.
2. `shc_ledger_entry` records include tax breakdown fields.
3. Customer receipts show platform commission + GST if registered.
4. Annual reporting and filing handled via external accountant + automated data export.

## Implementation in Data Model

- `shc_commission_rule` includes `gst_rate` field (versioned).
- Payout batches produce GST-compliant reports.
- Feature flag `gst_enabled` gates full tax logic rollout.

## Multi-Agent Notes

Contracts Track owns tax calculation logic and schema. Backend Track implements the ledger and payout implications. Content Track maintains customer-facing tax disclosure copy.

**Contracts Rule:** Tax logic is versioned and auditable. Never hard-code rates.
