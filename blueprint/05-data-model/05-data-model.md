# 05 — Data Model

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../08-marketplace-rules/08-marketplace-rules.md](../08-marketplace-rules/08-marketplace-rules.md)
- [../11-medusa-modules/11-medusa-modules.md](../11-medusa-modules/11-medusa-modules.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)

**Last Updated:** 2026-06-13 (Contracts Track owns after Phase 0)

## Medusa Native Tables (Configured, Not Custom)

- `product`, `product_variant`, `product_image`
- `customer`, `customer_address`
- `cart`, `line_item`, `order`, `order_item`
- `payment`, `fulfillment`
- `sales_channel`, `region`, `stock_location`

## Custom Tables (Full Definitions — Contracts Track Source of Truth)

| Table | Key Columns | Multi-Agent Notes |
| --- | --- | --- |
| `shc_cook` | id, auth_identity_id, slug, display_name, story, area, collection_address, collection_instructions, status, availability_paused, expo_push_token, created_at | Linked to auth_identity; status machine in Phase 2 |
| `shc_product_meta` | product_id, cook_id, cuisine, occasion_tags, allergen_tiers JSON, halal, calories, calories_confidence, ingredients JSON, min_qty, last_minute_premium_pct | One cook per product enforced |
| `shc_availability` | product_id, portions_per_day, collection_days int[], time_slots JSON, paused | Checked at checkout |
| `shc_compliance_doc` | id, cook_id, type (sfa\|wsq), file_key, expiry_date, verified_at | MinIO `cook-certs` bucket |
| `shc_order_meta` | order_id, cook_id, collection_date, collection_slot, allergen_acked_at, address_released_at, paynow_reference, shc_status | Core state machine — see 09-order-state.md |
| `shc_order_message` | id, order_id, sender_actor (customer\|cook\|ops), sender_id, body, created_at | Order-scoped chat |
| `shc_review` | id, order_id, cook_id, customer_id, rating, body | Post-collection only |
| `shc_dispute` | id, order_id, raised_by, type, status, notes, resolution | Ops + flag-issue flow |
| `shc_commission_rule` | id, version, rate_pct, effective_from, created_by | Versioned from Phase 6 |
| `shc_ledger_entry` | id, order_id, debit_account, credit_account, amount_cents, batch_id, created_at | Double-entry — Phase 6 |
| `shc_payout_batch` | id, week_start, status, total_cents, transfer_ref, approved_at | Monday cron |
| `shc_cook_expense` | id, cook_id, amount_cents, category, receipt_key, date | Receipt upload |
| `shc_feature_flag` | key, enabled, cohort_filter JSON | Growth features |
| `shc_search_synonym` | term, expansions text[] | FTS support |
| `shc_platform_stat` | key, value, updated_at | Analytics cron |
| `shc_request` | id, customer_id, body, youtube_url, party_size, budget_cents, date, status | Phase 8 |
| `shc_bid` | id, request_id, cook_id, price_cents, message, status | Phase 8 |

## Module Links (Medusa Link Definitions)

```text
shc_cook ↔ product        (one cook, many products)
shc_cook ↔ order          (one cook per order — MVP rule)
```

**Production Note:** All tables include audit columns (created_at, updated_at) and PDPA consent/retention fields where personal data is stored. See `production/compliance-pdpa.md`.

**Contracts Track Rule:** Only the Contracts Agent may modify this file after Phase 0. All other agents must open a task against the Contracts Track for schema changes.