# Decision Tree: Cook Cancellation After payment_confirmed

**Related Files:** `09-order-state.md`, `06-api-surface.md` (PATCH /orders/:id/status), `multi-agent/production-hardening.md`

## Trigger
Cook taps "Cancel" on an order where `shc_status = payment_confirmed`

## Decision Branches

### Branch 1: Within 2 hours of confirmation
- Action: Allow cancellation
- System: 
  - Set `shc_status = cook_cancelled`
  - Trigger refund workflow (future Phase 6+)
  - Notify customer + ops
- Ops action: Manual review within 24h

### Branch 2: Between 2h and collection_date - 24h
- Action: Require ops approval
- System: Create `shc_dispute` with type `cook_cancelled_late`
- Block cook from new listings until resolved

### Branch 3: Within 24h of collection
- Action: Block cancellation
- Message: "Cancellations within 24h of collection require ops intervention. Contact support."

### Branch 4: After collection_date
- Impossible state — order should already be `collected` or `issue_flagged`

**Production Rule:** All branches must log to audit trail with actor, timestamp, and reason. No silent cancellations.