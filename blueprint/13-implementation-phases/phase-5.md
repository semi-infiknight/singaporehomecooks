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

**Integration wave note (2026-06-14):** All core 5.x flows now fully implemented + locally testable in mobile via mock-service (which *exactly* enforces the E2E acceptance above using contracts + business-rules). PayNow ref capture + transition call, post-paid address release, polling chat 4.5s, state buttons on cook side, earnings everywhere, allergen/one-cook/min-qty gates. See LOCAL_TEST.md for exact exercise steps + LOCAL host. Real Medusa will replace mock (routes examples added, contracts already consumed in modules). Phase-5 E2E green in local demo. Self-update per protocol.

**Mid-Phase Stitching:** After 5.1–5.3 + state machine
**Final Stitching:** After full E2E acceptance + Maestro flows green

**Mobile-Agent 2026-06-14 update (core of wave):** 5.1-5.13 mobile parts: cart cook conflict/enforce (via rules), checkout complete (allergen+slot picker+PayNowPanel), OrderChat polling 4.5s implemented + route at (shared)/chat/[orderId], cook orders list + Accept/Prepare/Ready/Collected calling transition (validateOrder + SHCErrorCode display), customer orders list + detail + address release, earnings snapshot, dashboard actions. Local mock service sophisticated state machine. All schema + rules client enforced. Polling detail added to 10-mobile. E2E customer order + cook fulfil functional typed. (Maestro + real backend next wave.)

**Production Gates:** 100% Maestro E2E coverage on critical flow, audit logging on every status change, rate limiting on mark-payment-sent, error handling for all edge cases (expired cert, network failure, duplicate reference).