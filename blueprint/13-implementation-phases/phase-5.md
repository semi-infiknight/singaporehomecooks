# Phase 5 — Orders and Trust (Critical Phase)

**Related Files:**
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../09-order-state/09-order-state.md](../09-order-state/09-order-state.md)
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Track Split (4 parallel sub-tracks):**
- PayNow + Cart Complete (Backend + Contracts)
- Order State Machine + Chat (Backend + Mobile)
- Cook Fulfilment + Customer Orders (Mobile)
- Notifications + Disputes (Backend + Mobile)

**Phase 5 E2E Acceptance (Must Pass Before Phase 6 — Deterministic Flow)**

```text
Customer: browse → add to cart (single-cook enforced) → checkout (allergen ack + collection date/slot required) → mark PayNow sent
Ops: confirm payment in Admin → payment_confirmed
Cook: confirm → ready_for_collection (push received on "ready") → collected
Customer: leave review (or flag dispute)
All shc_status transitions logged; address released 2h before collection; chat works; push delivered
```

**Tasks (excerpt — full list preserved from original blueprint):**
- 5.1 Cart + cook conflict (CookConflictModal + guard)
- 5.2 Checkout + complete override (POST /store/shc/carts/:id/complete)
- 5.3 PayNow provider + 24h expiry workflow
- 5.4–5.13 Order detail, cook orders, address release job, OrderChat (10s poll), reviews, push tokens, disputes, dashboard, enable CTA

**Mid-Phase Stitching:** After 5.1–5.3 + state machine
**Final Stitching:** After full E2E acceptance + Maestro flows green

**Production Gates:** 100% Maestro E2E coverage on critical flow, audit logging on every status change, rate limiting on mark-payment-sent, error handling for all edge cases (expired cert, network failure, duplicate reference).