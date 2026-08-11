# Project Learnings

> Managed by `/learn` + agent session catch-up. Append-only — latest entry wins on conflicts.
> SHC canonical product truth remains `blueprint/CURRENT_STATE.md` (this file is session memory).

## Patterns

### guest-orders-device-local
- **Insight:** Guest checkout must `recordGuestOrder`; Orders list uses `getCustomerOrders()` (JWT list OR hydrate guest order ids via getOrder) — never `enabled: isAuthenticated()` only.
- **Confidence:** 9/10
- **Source:** session-2026-08-10
- **Files:** apps/mobile-customer/lib/api-client.ts, apps/web/lib/api-client.ts, packages/shc-utils/src/guest-session.ts
- **Date:** 2026-08-10

### push-prefs-not-inbox
- **Insight:** Product wants no in-app notification inbox or home bells; push opt-in lives only in profile/settings; attention is Orders/Requests.
- **Confidence:** 10/10
- **Source:** session-2026-08-10
- **Files:** apps/mobile-customer/app/(customer)/profile/index.tsx, apps/mobile-cook/app/(cook)/settings.tsx
- **Date:** 2026-08-10

## Pitfalls

### leftover-jsx-after-panel-delete
- **Insight:** Removing collapsible notif panels mid-file left orphan JSX and broke ScrollView close tags on profile — delete the whole block, then parse/typecheck.
- **Confidence:** 10/10
- **Source:** session-2026-08-10
- **Files:** apps/mobile-customer/app/(customer)/profile/index.tsx
- **Date:** 2026-08-10

### guest-gate-triple-layer
- **Insight:** Guest-first failed while tab bar tray + SHCAuthSessionGate + useOrders enabled:isAuthenticated still blocked Orders — fix all three layers together.
- **Confidence:** 10/10
- **Source:** session-2026-08-10
- **Files:** apps/mobile-customer/components/CustomerTabBar.tsx, apps/mobile-customer/app/(customer)/orders/index.tsx, apps/web/app/components/AppMobileTabBar.tsx
- **Date:** 2026-08-10

### blueprint-self-update-skipped
- **Insight:** Agents shipped multi-day product UX without patching CURRENT_STATE/INDEX/section files; self-updating-rules require same-session docs — catch-up was explicit user ask.
- **Confidence:** 10/10
- **Source:** session-2026-08-10
- **Files:** blueprint/CURRENT_STATE.md, blueprint/multi-agent/self-updating-rules.md
- **Date:** 2026-08-10

### getSlots-unwrap
- **Insight:** Slots API returning `{ slots, order_window_copy }` broke callers that mapped the payload directly — always unwrap slots array.
- **Confidence:** 8/10
- **Source:** session-2026-08-10
- **Files:** packages/shc-utils/src/order-window.ts, apps/mobile-customer/app/(customer)/checkout.tsx
- **Date:** 2026-08-10

## Preferences

### no-home-notification-ui
- **Insight:** User: permanent inbox not wanted; remove bells entirely; settings may have push only.
- **Confidence:** 10/10
- **Source:** user-request
- **Date:** 2026-08-10

### guest-first-orders
- **Insight:** User: sign-in non-mandatory; local order data + phone link on DB; Orders must work signed-out.
- **Confidence:** 10/10
- **Source:** user-request
- **Date:** 2026-08-10

## Architecture

### order-window-on-listing
- **Insight:** min_order_lead_days/hours + order_cutoff_time live on listing/availability; pure logic in order-window.ts; enforce on slots + checkout.
- **Confidence:** 8/10
- **Source:** session-2026-08-10
- **Files:** packages/shc-utils/src/order-window.ts
- **Date:** 2026-08-10

## Tools

(none yet)
