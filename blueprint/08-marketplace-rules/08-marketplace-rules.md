# 08 — Marketplace Rules

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../09-order-state/09-order-state.md](../09-order-state/09-order-state.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [DECISION_TREES/commission-structure.md](../DECISION_TREES/commission-structure.md)
- [DECISION_TREES/dispute-refund-policy.md](../DECISION_TREES/dispute-refund-policy.md)

**Last Updated:** 2026-06-14 by Contracts-Agent (rules implemented in business-rules with 95 tests; see phase-0.md for one-cook/allergen-ack/.../cook-status-gates; cross-ref 05 for schemas)
**Owner:** Contracts Track

## Overview

Marketplace rules define the core business logic that governs interactions between customers and cooks. These rules are versioned, centrally enforced in the Contracts layer, and never bypassed by application code. They ensure fairness, safety, regulatory compliance, and sustainable economics for the platform.

## Core Marketplace Rules (Immutable after Phase 0)

1. **One Cook Per Cart / Order**  
   A single cart or order may only contain products from one cook. This simplifies collection logistics, reduces cross-cook disputes, and matches Singapore home-cook operational reality. Enforced at cart creation and line-item addition.

2. **Product Visibility & Discovery**  
   - Products are visible only when the cook's `status = active`, `availability_paused = false`, and at least one `shc_availability` slot exists for the requested date.
   - Search results apply cuisine, occasion, halal, allergen, and calorie filters.
   - Cooks can pause individual products or entire availability without affecting historical orders.

3. **Collection Address Gating**  
   Customers must acknowledge the cook's collection address and instructions before payment. The address is only revealed after payment confirmation (`address_released_at` timestamp). This protects cook privacy.

4. **Allergen & Dietary Acknowledgment**  
   Before checkout, customers must explicitly acknowledge any allergens present in the order (`allergen_acked_at`). Orders without acknowledgment are blocked.

5. **Minimum Order & Portion Rules**  
   Each product has `min_qty`. Orders below the minimum are rejected at cart validation. Portions are strictly enforced via `portions_per_day` in availability.

6. **Commission & Payout Rules**  
   - Commission rate is versioned via `shc_commission_rule`.
   - Payouts are batched weekly (Monday cron) only for orders with `shc_status = completed`.
   - See `DECISION_TREES/commission-structure.md` for full logic.

7. **Cancellation Windows**  
   - Customer cancellation before payment: full refund, no penalty.
   - After payment but before collection: subject to dispute flow (see `DECISION_TREES/cook-cancellation-after-payment.md` and `dispute-refund-policy.md`).
   - Cook cancellation after acceptance: automatic full refund + platform penalty + negative performance score.

8. **Review & Rating Integrity**  
   Reviews can only be submitted after collection confirmation. One review per order. Ratings influence cook visibility and performance governance.

## Enforcement Points

All rules are implemented as:
- Zod schema validations in `shc-types`
- Medusa cart/order workflows and subscribers
- API middleware guards in custom `/store/shc` routes
- Mobile client-side validation (optimistic) + server re-validation

No rule may be overridden by feature flags or admin actions without a corresponding contract change.

## Production Considerations

- Rules are evaluated on every relevant mutation (add to cart, checkout, order state transition).
- Performance: rules are cached where possible; hot paths use Redis for availability checks.
- Audit: every rule violation attempt is logged with actor, timestamp, and context for compliance.
- Regulatory: SFA/WSQ verification status gates cook actions (accept order, request payout).

## Multi-Agent Notes

- **Contracts Track** is the sole owner of this file and all rule implementations after Phase 0.
- Any new marketplace rule or modification to an existing rule requires a Contracts Track PR.
- Backend and Mobile tracks consume these rules via imported schemas and must never duplicate logic.
- When a rule change affects customer UX, Content Track updates onboarding copy in parallel via stitching protocol.

## Related Decision Trees

- `DECISION_TREES/commission-structure.md`
- `DECISION_TREES/dispute-refund-policy.md`
- `DECISION_TREES/cook-cancellation-after-payment.md`
- `DECISION_TREES/cook-performance-governance.md`

**Contracts Track Rule:** This file and the rules herein are frozen after Phase 0. All future changes require explicit approval and version bump of the commission rule or marketplace rule set.
