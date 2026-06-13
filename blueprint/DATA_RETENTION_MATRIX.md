# Data Retention & PDPA Matrix

**Related Files:** `05-data-model.md`, `production/compliance-pdpa.md`

| Table | Retention Period | Deletion Trigger | Legal Basis |
|-------|------------------|------------------|-------------|
| `shc_cook` | 3 years after last order or account closure | User request or 3y inactivity | PDPA |
| `shc_order_meta` | 7 years | End of financial year + 7y | Singapore tax law |
| `shc_order_message` | 3 years | Order resolved + 3y | PDPA |
| `shc_ledger_entry` | 7 years | Financial year close + 7y | Tax / audit |
| `shc_compliance_doc` | 3 years after expiry | Certificate expiry + 3y | PDPA |
| `shc_dispute` | 7 years | Resolution + 7y | Legal hold |

**Deletion Workflow:** Soft delete first (status=deleted), hard delete after 30 days with audit log. Provide data export endpoint for subject access requests.