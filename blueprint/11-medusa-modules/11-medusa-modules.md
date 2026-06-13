# 11 — Medusa Modules & Custom Extensions

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../07-auth/07-auth.md](../07-auth/07-auth.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Last Updated:** 2026-06-13 (Backend Track owns)
**Owner:** Backend Track

## Overview

Medusa v2 serves as the commerce foundation. Custom SHC functionality is delivered through dedicated modules, workflows, subscribers, and API route extensions rather than forking the core. This keeps upgrades straightforward and maintains clear separation of concerns.

## Custom Modules (src/modules/shc-*)

| Module                  | Purpose                                      | Linked Entities                  | Key Features |
|-------------------------|----------------------------------------------|----------------------------------|--------------|
| shc-cook                | Cook profile, availability, compliance       | shc_cook, shc_compliance_doc     | Status machine, availability calendar |
| shc-product-meta        | Extended product attributes (cuisine, calories, allergens) | shc_product_meta | One-cook enforcement, calorie estimation hook |
| shc-availability        | Time-slot and portion management             | shc_availability                 | Real-time stock for collection days |
| shc-order-meta          | Order state, collection details, PayNow ref  | shc_order_meta, shc_order_message| State machine driver |
| shc-review              | Post-collection ratings and feedback         | shc_review                       | One-per-order, public display rules |
| shc-dispute             | Dispute lifecycle and resolution             | shc_dispute                      | Ops workflow integration |
| shc-ledger              | Double-entry accounting for commissions/payouts | shc_ledger_entry, shc_payout_batch | Immutable financial records |
| shc-feature-flag        | Growth experiment toggles                    | shc_feature_flag                 | Cohort-based rollout |

## Workflows (src/workflows)

- `createOrderWithMetaWorkflow` — extends Medusa order creation with SHC metadata and state initialization.
- `orderStateTransitionWorkflow` — validates and executes state changes, emits events.
- `weeklyPayoutWorkflow` — Monday cron job that calculates commissions and creates payout batches.
- `complianceVerificationWorkflow` — triggered on cook document upload.

## Subscribers (src/subscribers)

- Order state change → push notification, email/SMS, ledger entry.
- New cook registration → compliance checklist creation.
- Payment confirmation → address release + cook acceptance prompt.

## Admin Customizations

- Custom widgets in Medusa Admin for cook management, dispute resolution, payout approval.
- New navigation sections under "Singapore Home Cooks".
- Bulk actions for ops (e.g., mass compliance verification).

## API Extensions

All custom routes live under:
- `/store/shc/*` — customer & cook facing
- `/admin/shc/*` — ops & admin facing
- Internal worker routes for cron and background jobs.

See `06-api-surface.md` for the full route catalog.

## Production & Multi-Agent Notes

- **Backend Track** owns all module, workflow, and subscriber code.
- Modules must be registered in `medusa-config.ts` and exported via the package.
- Every module includes its own migration and seed data.
- Contracts Track owns the data model contracts that modules implement.
- After Phase 0, module interfaces are frozen; new modules require Contracts + Backend joint approval.

**Backend Track Rule:** All custom Medusa extensions must follow the established module pattern. Direct modifications to core Medusa files are prohibited.
