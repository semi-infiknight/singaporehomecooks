# 05 — Data Model

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../08-marketplace-rules/08-marketplace-rules.md](../08-marketplace-rules/08-marketplace-rules.md)
- [../11-medusa-modules/11-medusa-modules.md](../11-medusa-modules/11-medusa-modules.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)

**Last Updated:** 2026-06-29 (launch-readiness wiring) — `shc_product_meta` now persists cook-provided name/description/price_cents/heritage_note; all previously paper-only custom tables now have Medusa modules/migrations; compliance docs route wired.

## Medusa Native Tables (Configured, Not Custom)

- `product`, `product_variant`, `product_image`
- `customer`, `customer_address`
- `cart`, `line_item`, `order`, `order_item`
- `payment`, `fulfillment`
- `sales_channel`, `region`, `stock_location`

## Custom Tables (Full Definitions — Contracts Track Source of Truth)

**Exact columns used for all .strict() Zod schemas in @shc/types (no extras allowed post-freeze). All tables include standard audit (created_at, updated_at) + PDPA where personal data per production/compliance-pdpa.md and DATA_RETENTION_MATRIX.md. Updated 2026-06-14 by Contracts-Agent.**

| Table | Full Columns (exact) | Types / Notes | Multi-Agent Notes |
| --- | --- | --- | --- |
| `shc_cook` | id, auth_identity_id, slug, display_name, story, area, collection_address, collection_instructions, status, availability_paused, expo_push_token, sfa_reg_number, wsq_cert_expiry, **login_email**, **password_hash** (scrypt), pdpa_consent_at, pdpa_consent_version, created_at, updated_at | status: enum pending\|active\|paused\|suspended; login_email for cook auth; password_hash never exposed; PDPA required (07-auth) | Linked to auth_identity; cook login now supports real hashed + dev fallback; status machine + compliance |
| `shc_product_meta` | product_id, cook_id, **name**, **description**, cuisine, occasion_tags, allergen_tiers (JSON...), halal, calories, calories_confidence, ingredients (JSON...), min_qty, **price_cents**, last_minute_premium_pct, **heritage_note**, **image_url**, created_at, updated_at | name/price/description/heritage are persisted for cook-created listings; image_url prefers server-generated WebP derivative | One cook per product enforced (business-rules + cart) |
| `shc_availability` | product_id, portions_per_day, collection_days (int[] 0-6), time_slots (JSON array of slot strings or objects), paused, created_at, updated_at | portions_per_day >0; used for portions check | Checked at checkout + availability rule |
| `shc_compliance_doc` | id, cook_id, type (sfa\|wsq), file_key, expiry_date, verified_at, created_at, updated_at | MinIO cook-certs bucket; verified_at set by ops | Compliance gates for accept/payout |
| `shc_order_meta` | order_id, cook_id, collection_date (YYYY-MM-DD), collection_slot (e.g. "18:00-19:00"), allergen_acked_at, address_released_at, paynow_reference, shc_status, **items** (json snapshot), **total_cents**, origin_request_id, credits_applied_cents, is_corporate, corporate_note, created_at, updated_at | shc_status from 09-order-state enum; items+total snapshot for UI list/detail (dish names, amounts) | Core state machine — see 09-order-state.md; one-cook, allergen rules |
| `shc_order_message` | id, order_id, sender_actor (customer\|cook\|ops), sender_id, body, created_at, updated_at | | Order-scoped chat (see 10-mobile) |
| `shc_review` | id, order_id, cook_id, customer_id, rating (1-5), body, created_at, updated_at | Post collection only per rules | One review per order; used for cook perf |
| `shc_dispute` | id, order_id, raised_by (customer\|cook\|ops), type, status (open\|resolved\|cancelled), notes, resolution, created_at, updated_at | | Ops + flag-issue flow; audit required |
| `shc_commission_rule` | id, version, rate_pct (0-100), effective_from, gst_rate?, created_by, created_at, updated_at | Versioned from Phase 6 | See DECISION_TREES/commission-structure.md + GST_TAX_RULES |
| `shc_ledger_entry` | id, order_id, debit_account, credit_account, amount_cents, batch_id, created_at, updated_at | Double-entry invariant: sum debits = sum credits | Phase 6 money engine; immutable |
| `shc_payout_batch` | id, week_start (YYYY-MM-DD), status (pending\|approved\|paid), total_cents, transfer_ref, approved_at, created_at, updated_at | Monday cron | Linked to ledger entries |
| `shc_cook_expense` | id, cook_id, amount_cents, category, receipt_key, date, created_at, updated_at | Receipt upload to MinIO | For cook tax/earnings net |
| `shc_feature_flag` | key, enabled, cohort_filter (JSON), created_at, updated_at | | Growth features; see FEATURE_FLAGS.md |
| `shc_search_synonym` | term, expansions (text[]), created_at, updated_at | | FTS support in discovery |
| `shc_platform_stat` | key, value (JSON or number), updated_at | | Analytics cron; see CRON_JOBS.md |
| `shc_notification` | id, actor_id, type, body, read, created_at, updated_at | Persisted notifications for in-app bell (customer/cook) | Replaces in-mem store for prod |
| `shc_request` | id, customer_id, body, youtube_url, party_size, budget_cents, date, status, created_at, updated_at | Phase 8 custom orders | |
| `shc_bid` | id, request_id, cook_id, price_cents, message, status (pending\|accepted\|rejected), created_at, updated_at | Phase 8 | |
| `shc_cart` | id (or customer_id PK), customer_id, items (JSON array of {product_id, name, qty, price, cook_id}), cook_id (enforced one-cook), created_at, updated_at | Postgres-backed; one-cook cart enforced at add time via business-rules; used by /store/shc/cart | Core for checkout; legacy shc-cart-store deprecated |

**Medusa Native Tables (Configured, Not Custom):** product, product_variant, product_image, customer, customer_address, cart, line_item, order, order_item, payment, fulfillment, sales_channel, region, stock_location (links defined below). All custom SHC tables reference their IDs.

## Module Links (Medusa Link Definitions)

```text
shc_cook ↔ product        (one cook, many products)
shc_cook ↔ order          (one cook per order — MVP rule)
```

**Production Note:** All tables include audit columns (created_at, updated_at) and PDPA consent/retention fields where personal data is stored. See `production/compliance-pdpa.md`.

**Contracts Track Rule:** Only the Contracts Agent may modify this file after Phase 0. All other agents must open a task against the Contracts Track for schema changes.

**Schemas Implemented (Contracts Wave 1):** All 17 custom tables now have matching .strict() Zod schemas in packages/shc-types/src/schemas/ + re-exports + contract tests. See phase-0.md / INDEX.md. (2026-06-14 by Contracts-Agent)

**Completed Fields (marked by Contracts-Agent 2026-06-14):** All key + full columns listed above have Zod coverage in @shc/types (cook, product_meta, availability, compliance_doc, order_meta, order_message, review, dispute, commission_rule, ledger_entry, payout_batch, cook_expense, feature_flag, search_synonym, platform_stat, request, bid + links). No more placeholders. Tests + typecheck green. Next: backend impl only (read-only for contracts).