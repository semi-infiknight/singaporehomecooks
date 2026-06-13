# 09 — Order State Machine

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../08-marketplace-rules/08-marketplace-rules.md](../08-marketplace-rules/08-marketplace-rules.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [DECISION_TREES/cook-cancellation-after-payment.md](../DECISION_TREES/cook-cancellation-after-payment.md)
- [DECISION_TREES/dispute-refund-policy.md](../DECISION_TREES/dispute-refund-policy.md)
- [ERROR_CODES.md](../ERROR_CODES.md)

**Last Updated:** 2026-06-13 (Contracts Track owns)
**Owner:** Contracts Track

## Overview

The order lifecycle is the heart of the platform. A strict finite state machine governs every order from cart creation through collection, review, payout, and archival. The state is stored in `shc_order_meta.shc_status` and is the single source of truth for all actors (customer, cook, ops, system).

## Order States & Valid Transitions

| State                  | Description                                      | Allowed Transitions                          | Triggering Actor(s)          | Business Rules Applied |
|------------------------|--------------------------------------------------|----------------------------------------------|------------------------------|------------------------|
| `cart`                 | Items in cart, not yet paid                      | → `paid`                                     | Customer                     | One-cook rule, min qty, allergen ack |
| `paid`                 | Payment received (PayNow reference captured)     | → `accepted` or `cancelled`                  | System / Cook                | Address release, cook notification |
| `accepted`             | Cook has accepted the order                      | → `preparing`, `cancelled`                   | Cook                         | Collection slot locked |
| `preparing`            | Cook is preparing the food                       | → `ready_for_collection`, `cancelled`        | Cook                         | Time window monitoring |
| `ready_for_collection` | Food is ready at collection point                | → `collected`, `cancelled`                   | Cook / Customer              | QR or PIN verification |
| `collected`            | Customer has collected the order                 | → `completed`, `disputed`                    | Customer / System            | Review window opens |
| `completed`            | Order finalized, eligible for payout             | → (terminal)                                 | System                       | Commission calculated, ledger entry |
| `cancelled`            | Order cancelled (pre or post payment)            | → (terminal)                                 | Customer / Cook / Ops        | Refund logic per policy |
| `disputed`             | Dispute raised by customer or cook               | → `resolved`, `cancelled`                    | Ops                          | Full audit trail required |

## State Machine Implementation

- Defined as a Zod enum + transition table in `shc-types`.
- Enforced via Medusa workflows (`orderStateTransitionWorkflow`) and subscribers.
- Every transition emits events for notifications, ledger updates, and performance scoring.
- Invalid transitions return standardized error codes (see `ERROR_CODES.md`).

## Key Fields on `shc_order_meta`

- `collection_date`, `collection_slot`
- `paynow_reference`
- `allergen_acked_at`
- `address_released_at`
- `shc_status` (current state)
- Timestamps for each transition

## Production Rules & Edge Cases

- No state may be skipped or jumped (e.g., cannot go directly from `paid` to `collected`).
- Time-based escalations: if cook does not accept within SLA, auto-cancel with full refund.
- Post-collection disputes have a 48-hour window.
- All state changes are immutable in the audit log.

## Multi-Agent Notes

- **Contracts Track** owns the state machine definition, transition table, and validation logic.
- Backend Track implements the workflows and subscribers that drive transitions.
- Mobile Track renders UI state based on the current `shc_status` and only shows valid action buttons.
- Any new state or transition requires Contracts approval and a versioned update to this document.

## Related Artifacts

- Full transition diagram and decision trees in `DECISION_TREES/`
- Error catalog for invalid transitions in `ERROR_CODES.md`
- Payout and commission logic tied to `completed` state in `DECISION_TREES/commission-structure.md`

**Contracts Track Rule:** The order state machine is a core contract. Changes after Phase 0 require a formal proposal, impact analysis on all tracks, and explicit update to this file with new version.
