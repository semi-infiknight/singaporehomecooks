# 11 — Medusa Modules & Custom Extensions

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../07-auth/07-auth.md](../07-auth/07-auth.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Last Updated:** 2026-06-14 by Backend-Money-Agent (Phase 6) — added shc-ledger + shc-payout-batch modules/services/migrations, expanded payment-confirm + subscriber + workflow for ledger posts on completed/confirm, new admin payouts/ledger routes + store orders earnings, weekly sim script, seed extension, hardening (Zod/SHC/audit/double-entry), docs + bootstrap. See phase-6.md. Pre-existing baseline type issues unchanged.
**Owner:** Backend Track

## Overview

Medusa v2 serves as the commerce foundation. Custom SHC functionality is delivered through dedicated modules, workflows, subscribers, and API route extensions rather than forking the core. This keeps upgrades straightforward and maintains clear separation of concerns.

## Custom Modules (src/modules/shc-*)

**Wave 1 Implemented (Phase 0/1 completion):**
- shc-cook (models/cook, service with status/push/verify, migration)
- shc-product-meta (linked to product, cuisine/allergen_tiers/calories/min_qty JSON, migration)
- shc-order-meta ( + shc_order_message for chat, state, paynow, collection, allergen/address timestamps, migration)
- shc-availability (portions, slots, paused, linked to product, migration)

**Phase 6 Backend-Money (2026-06-14):** 
- shc-ledger: models/ledger-entry, migration, service (postCommission using 15% business-rules calc + double-entry legs e.g. Cook-Earnings-Payable/Order-Sales + Platform-Commission; postPayout clearing leg; list + summary + verifyInvariant; audit logs).
- shc-payout-batch: models, migration, service (createOrGetWeeklyBatch, approve with sim transfer_ref=SIM-PAYOUT-..., list, markPaid).
- Registered in modules/index.ts + used in payment-confirm, order transition workflow, order-state subscriber (on completed), seed, weekly sim script, new admin/store routes.
- No schema change (use frozen types).

**Backend-Completion Wave (Phase 8-9 final, 2026-06-14):** 
- Added shc-request (models/migrations/service for create/listOpen/get/updateStatus; frozen shcRequestSchema), shc-bid (similar + accept; shcBidSchema), shc-credit-wallet (balance/tier/redeem/award + history; ties ledger postCreditIssuance/Redemption for money flows), shc-heritage (getArchiveForCook/addEntry for permanent published entries).
- Registered + services in modules/index.ts (resolve names shc*Service).
- Enhanced shc-order-meta (added origin_request_id/credits_applied_cents/is_corporate/corporate_note in model/service for wiring without contract change), shc-ledger (credit post methods).
- API: /store/shc/* growth routes (Zod/SHC/audit/health), enhanced carts complete (credits redeem + flags + request origin + PDPA), /orders (growth metadata), payment-confirm/transitions/subscriber (credit award on complete, new flows, full before/after audits).
- Workflows extended for growth. Seed (apps/medusa/scripts + root note) with samples + ledger. AI stubs improved (comments/config for Claude per DECISION_TREES, rate/cost guard). All use frozen @shc/types + business-rules. Hardening day1. Mobile toggle now real-backed for "fully functioning" claim. Targeted self-updates only. "Backend-Completion done".

Links: src/links/shc-*-*.ts using defineLink to Medusa product/order.

| Module                  | Purpose                                      | Linked Entities                  | Key Features |
|-------------------------|----------------------------------------------|----------------------------------|--------------|
| shc-cook                | Cook profile, availability, compliance       | shc_cook, shc_compliance_doc     | Status machine, availability calendar |
| shc-product-meta        | Extended product attributes (cuisine, calories, allergens) | shc_product_meta | One-cook enforcement, calorie estimation hook |
| shc-availability        | Time-slot and portion management             | shc_availability                 | Real-time stock for collection days |
| shc-order-meta          | Order state, collection details, PayNow ref  | shc_order_meta, shc_order_message| State machine driver |
| shc-review              | Post-collection ratings and feedback         | shc_review                       | One-per-order, public display rules |
| shc-dispute             | Dispute lifecycle and resolution             | shc_dispute                      | Ops workflow integration |
| shc-ledger              | Double-entry accounting for commissions/payouts | shc_ledger_entry (order_id/batch_id), shc_payout_batch | postCommission/postPayout, invariant, 15% via business-rules; immutable |
| shc-payout-batch        | Weekly batches (Mon cron-sim), approve flow  | shc_payout_batch (status, transfer_ref) | Idempotent weekly sim script, sim transfer_ref on approve |
| shc-feature-flag        | Growth experiment toggles                    | shc_feature_flag                 | Cohort-based rollout |

## Workflows (src/workflows)

**Wave 1 Implemented:**
- `createOrderWithMetaWorkflow` — validates (one-cook via @shc/business-rules + @shc/types, min_qty, allergen ack) + creates shc_order_meta. Used by cart complete override.
- `orderStateTransitionWorkflow` — uses validateOrderTransition from @shc/types + canTransition from business-rules; drives meta update. Phase 6 enhanced: includes postCommissionOnCompleteStep (ledger on 'completed').

Phase 6:
- weeklyPayoutWorkflow realized as idempotent cron-sim script (apps/medusa/scripts/weekly-payout.ts): find completed not in batch, calc 15% commission, create ledger entries + payout batch + clearing leg, auto approve sim. (Callable manually; node-cron stub ready.)
- complianceVerificationWorkflow — triggered on cook document upload. (future)

Future (per blueprint):
- `weeklyPayoutWorkflow` — Monday cron job that calculates commissions and creates payout batches.
- `complianceVerificationWorkflow` — triggered on cook document upload.

## Subscribers (src/subscribers)

**Wave 1 Implemented (basic):**
- `order-state-change.ts` — logs structured (Medusa logger) + stub notifications on state transitions and custom `shc.order.state_changed`.
- `cook-registered.ts` — stub for compliance.

**Phase 6 (Backend-Money):** Enhanced `order-state-change.ts`: on 'completed' → auto ledger postCommission (15% + earnings via business-rules) + structured audit + notify stub. Redundant with workflow step. All money actions include actor/context.

Full per blueprint:
- Order state change → push notification, email/SMS, ledger entry.
- New cook registration → compliance checklist creation.
- Payment confirmation → address release + cook acceptance prompt.

## Admin Customizations

- Custom widgets in Medusa Admin for cook management, dispute resolution, payout approval.
- New navigation sections under "Singapore Home Cooks".
- Bulk actions for ops (e.g., mass compliance verification).

## API Extensions

**Wave 1 Critical Implemented (see apps/medusa/src/api/... and 06-api-surface.md):**
- /store/shc/cooks (public list), /store/shc/products (enriched with meta+avail), /store/shc/search (stub), /store/shc/carts/[id]/complete (enforces rules + shc_order_meta via workflow)
- /admin/shc/payment-confirm (mark paid → transition, release address), /admin/shc/cooks/verification (list for ops)
- Health: /store/shc/health , /admin/shc/health
- Zod validation + SHC error codes returned on all.

**Phase 6 Money (Backend track):**
- Expanded /admin/shc/payment-confirm: + ledger post (platform 15%/cook earnings) on confirm + structured audit.
- New: /admin/shc/payouts (GET list, POST create batch), /admin/shc/payouts/[id]/approve (POST approve + sim transfer_ref).
- New: /admin/shc/ledger (GET ?order_id|cook_id|batch_id , returns entries + earnings summary).
- Enhanced /store/shc/orders: ?cook_id= returns + earnings_summary (cook_earnings_cents etc from ledger) - additive, no contract change.
- All: Zod .strict(), createSHCError codes (SHC-PAYOUT-001 etc), logger audit with actor/context, double-entry checks.

All custom routes live under:
- `/store/shc/*` — customer & cook facing
- `/admin/shc/*` — ops & admin facing
- Internal worker routes for cron and background jobs.

See `06-api-surface.md` for the full route catalog. Medusa Admin at :9000 usable for order list + payment confirm calls.
- Scripts: apps/medusa/scripts/weekly-payout.ts (manual sim; update seed + README).

## Production & Multi-Agent Notes

- **Backend Track** owns all module, workflow, and subscriber code.
- Modules must be registered in `medusa-config.ts` and exported via the package.
- Every module includes its own migration and seed data.
- Contracts Track owns the data model contracts that modules implement.
- After Phase 0, module interfaces are frozen; new modules require Contracts + Backend joint approval.

**Backend Track Rule:** All custom Medusa extensions must follow the established module pattern. Direct modifications to core Medusa files are prohibited.
