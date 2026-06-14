# Centralized Error Codes

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../09-order-state/09-order-state.md](../09-order-state/09-order-state.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [OPERATIONS_RUNBOOK.md](../OPERATIONS_RUNBOOK.md)

**Last Updated:** 2026-06-14 by Contracts-Agent (full enum expanded to 23 codes matching SHCErrorCode in @shc/types; descriptions synced; added codes for all marketplace rules, order states, ledger/payout, portions, cook gates, requests per 08/09/05)
**Owner:** Contracts Track

## Error Code Catalog

All API errors return a consistent shape:
```json
{
  "error": {
    "code": "SHC-ORDER-001",
    "message": "Human readable",
    "details": { ... }
  }
}
```

| Code              | Category          | Meaning                                      | Ops Action                          |
|-------------------|-------------------|----------------------------------------------|-------------------------------------|
| SHC-AUTH-001      | Auth              | Invalid or expired token                     | Client should refresh or re-login   |
| SHC-ORDER-001     | Order State       | Invalid state transition attempted           | Log + reject, show user-friendly msg|
| SHC-ORDER-002     | Order State       | Cook acceptance window expired               | Auto-cancel order, notify parties   |
| SHC-ORDER-003     | Order State       | Order not in valid state for this action     | UI guard + log; check shc_status    |
| SHC-ORDER-004     | Order State       | Collection slot is in the past or invalid    | Reject or suggest reschedule        |
| SHC-CART-001      | Cart              | Multiple cooks detected in cart              | Enforce one-cook rule               |
| SHC-CART-002      | Cart              | Minimum quantity not met for product         | Block add/checkout; show min_qty    |
| SHC-CART-003      | Cart              | Allergen acknowledgment is required before checkout | Require ack UI + re-validate     |
| SHC-PAY-001       | Payment           | PayNow reference already used                | Reject duplicate                    |
| SHC-COMPLIANCE-001| Compliance        | Cook missing required SFA/WSQ doc            | Block order acceptance              |
| SHC-COMPLIANCE-002| Compliance        | Cook compliance docs not verified for this action | Gate cook actions (accept etc)   |
| SHC-AVAIL-001     | Availability      | Requested slot no longer available           | Refresh availability, suggest alternatives |
| SHC-AVAIL-002     | Availability      | Requested portions exceed available for the day/slot | Enforce portions_per_day       |
| SHC-DISPUTE-001   | Dispute           | Dispute window closed                        | Reject with explanation             |
| SHC-DISPUTE-002   | Dispute           | Invalid dispute type, raised_by or status    | Validation reject                   |
| SHC-COMMISSION-001| Commission        | No matching commission rule for version/effective date | Use default or block payout calc |
| SHC-PAYOUT-001    | Payout            | Payout batch already processed or invalid status for approval | Ops review; prevent double pay |
| SHC-LEDGER-001    | Ledger            | Ledger entry would violate double-entry balance or missing accounts | Block + alert finance             |
| SHC-REVIEW-001    | Review            | Reviews only allowed for orders in collected or later state; one per order | UI hide + server guard            |
| SHC-COOK-001      | Cook              | Cook status does not permit this action (must be active, not paused/suspended) | Block dashboard actions; notify   |
| SHC-PORTIONS-001  | Portions          | Portions validation failed (min/max or availability) | Enforce at cart/checkout          |
| SHC-REQ-001       | Request/Bid       | Custom request bid window closed or invalid status | Reject bid                        |
| SHC-GENERIC-001   | Generic           | An unexpected error occurred                 | Log + generic user msg; escalate  |

## Usage

- Frontend maps codes to localized messages and UI states.
- Backend throws typed errors that serialize to these codes (use createSHCError / formatError from @shc/types).
- Ops runbook links each code to remediation steps.

**Contracts Rule:** New error codes must be added here (and to SHCErrorCode enum in @shc/types) before use in code. Never invent ad-hoc error strings. Synced with packages/shc-types/src/errors.ts . (2026-06-14 Contracts-Agent)
