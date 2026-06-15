# 06 — API Surface (Canonical Routes)

**Related Files:**
- [../CURRENT_STATE.md](../CURRENT_STATE.md) — **implemented route file map + client wiring matrix (authoritative snapshot)**
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../11-medusa-modules/11-medusa-modules.md](../11-medusa-modules/11-medusa-modules.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)

**Last Updated:** 2026-06-15 by Integration Agent (implemented routes index; canonical spec below unchanged)

**Contracts Track owns this file after Phase 0.** (Wave 1: Zod schemas ready for all payloads/routes; contract tests added; see 05 for data; ERROR_CODES for errors. Backend to implement using imports from @shc/types)

## Implementation Status (2026-06-15)

**Canonical spec** for all planned routes remains in the sections below. For **what is implemented today** (file paths, methods, client wiring, gaps), see **[CURRENT_STATE.md §3–§5](../CURRENT_STATE.md)**.

| Area | Status | Notes |
|------|--------|-------|
| Store discovery (cooks, products, slots) | ✅ Implemented | `/store/shc/cooks`, `/products`, `/products/:id/slots` |
| Cart + checkout | ✅ Partial | In-memory server cart; `demo-complete`, `checkout-credits` |
| Orders + messages + transitions | ✅ Implemented | Per-order routes under `/store/shc/orders/:id/*` |
| Growth (credits, requests, bids, heritage, ai) | ✅ Implemented | Phase 8–9 routes live |
| Earnings, listings, notifications, push-token | ✅ Implemented | Notifications in-memory (dev) |
| Search | 🟡 Stub | `/store/shc/search` returns empty |
| Auth (login/register JWT) | ❌ Not implemented | Clients use dev role switcher + mock `loginAs` |
| Admin (payment-confirm, payouts, ledger) | ✅ Implemented | See `apps/medusa/src/api/admin/shc/` |
| Media upload (MinIO/S3) | ❌ Not implemented | — |
| Reviews | ❌ Not implemented | — |

**Client integration:** `packages/shc-api-client` calls these routes when `USE_REAL_MEDUSA` is on (default after `pnpm bootstrap:medusa`). See CURRENT_STATE.md §3.

## Standard Medusa Store API (Use SDK)

(Full list from original blueprint preserved — customer register/login, cart, line item, complete, orders, etc.)

## Cook Auth Actor Routes

(Full register/login/reset for `cook` actor type — creates shc_cook row)

## SHC Store API (`/store/shc/*`)

All routes require Authorization except public ones. Full table of 30+ routes preserved (upload, cooks, products/search, profile, compliance, orders, messages, review, push-token, etc.).

**Push token route (added final wave):** POST /store/shc/push-token { cook_id, expo_push_token } — registers for targeted pushes on order events (paid, ready_for_collection, completed). See subscriber + 03-railway.md. Real Expo service (expo-server-sdk) required in prod.

## SHC Admin API (`/admin/shc/*`)

Verification, payments confirm, disputes, payouts, ledger, commission-rules, exports, receipts.

## Internal Worker Routes (`/admin/shc/internal/*`)

Protected by WORKER_API_KEY (certificates, payouts, analytics, digest).

**Production Note:** Every route must have Zod validation + typed error codes. See production-hardening.md.

**Backend-Completion (2026-06-14 final wave):** Added real growth routes for Phase 8-9 (using frozen shc_request/bid schemas + @shc/types + business-rules):
- /store/shc/requests (GET list open, POST create; + /[id] GET)
- /store/shc/bids (GET list by cook/request, POST create; /[id]/accept POST for matched order-originated)
- /store/shc/credits (GET balance+history, POST redeem with ledger post)
- /store/shc/heritage (GET by cook, POST add entry; published archive)
- /store/shc/ai (POST calorie-estimate from ingredients [stub + Claude notes/rate/cost], GET photo-tips)
Tied corporate flag, notifs via events. Enhanced /store/shc/carts/[id]/complete + /orders + payment-confirm + workflows/subscribers for credits/requests/corporate + ledger credit flows + full audits (actor/action/before-after) + Zod/SHCError on all. New minimal modules shc-request/shc-bid/shc-credit-wallet/shc-heritage (extend order-meta/ledger for parity). Seed updated. Mobile (toggle) now gets real data. "Backend-Completion done". See 11-medusa + phases.