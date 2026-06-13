# Centralized Error Codes

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../09-order-state/09-order-state.md](../09-order-state/09-order-state.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [OPERATIONS_RUNBOOK.md](../OPERATIONS_RUNBOOK.md)

**Last Updated:** 2026-06-13 (Contracts Track owns)
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
| SHC-CART-001      | Cart              | Multiple cooks detected in cart              | Enforce one-cook rule               |
| SHC-PAY-001       | Payment           | PayNow reference already used                | Reject duplicate                    |
| SHC-COMPLIANCE-001| Compliance        | Cook missing required SFA/WSQ doc            | Block order acceptance              |
| SHC-AVAIL-001     | Availability      | Requested slot no longer available           | Refresh availability, suggest alternatives |
| SHC-DISPUTE-001   | Dispute           | Dispute window closed                        | Reject with explanation             |

## Usage

- Frontend maps codes to localized messages and UI states.
- Backend throws typed errors that serialize to these codes.
- Ops runbook links each code to remediation steps.

**Contracts Rule:** New error codes must be added here before use in code. Never invent ad-hoc error strings.
