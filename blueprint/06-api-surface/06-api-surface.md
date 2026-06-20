# 06 — API Surface (Canonical Routes)

**Related Files:**
- [../CURRENT_STATE.md](../CURRENT_STATE.md) — **implemented route file map + client wiring matrix (authoritative snapshot)**
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../11-medusa-modules/11-medusa-modules.md](../11-medusa-modules/11-medusa-modules.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)

**Last Updated:** 2026-06-20 (full sync) — all listed areas now ✅ except noted production items. See CURRENT_STATE for live file map + client wiring. Auth, cart (Postgres), reviews, search live.

**Contracts Track owns this file after Phase 0.** (Wave 1: Zod schemas ready for all payloads/routes; contract tests added; see 05 for data; ERROR_CODES for errors. Backend to implement using imports from @shc/types)

## Implementation Status (2026-06-15)

**Canonical spec** for all planned routes remains in the sections below. For **what is implemented today** (file paths, methods, client wiring, gaps), see **[CURRENT_STATE.md §3–§5](../CURRENT_STATE.md)**.

| Area | Status | Notes |
|------|--------|-------|
| Store discovery (cooks, products, slots) | ✅ Implemented | `/store/shc/cooks`, `/products`, `/products/:id/slots`, search |
| Cart + checkout | ✅ Implemented | `shc-cart` Postgres module + `demo-complete` + `checkout-credits` + complete route (PDPA, credits, corporate) |
| Orders + messages + transitions + review | ✅ Implemented | Full per-order: list/detail/transition/messages/review |
| Growth (credits, requests, bids, heritage, ai) | ✅ Implemented | Full Phase 8–9 routes + ledger ties |
| Earnings, listings, notifications, push-token | ✅ Implemented | Notifications dev in-mem; push registration + dispatch wired |
| Search | ✅ Implemented | `/store/shc/search` delegates to product list + suggestions |
| Auth (login/register JWT) | ✅ Implemented | Customer (Medusa + profile), Cook (SHC JWT + scrypt hash on shc_cook) + /me |
| Admin (payment-confirm, payouts, ledger, verification) | ✅ Implemented | See `apps/medusa/src/api/admin/shc/` |
| Media upload (MinIO/S3) | ❌ Not implemented | Deferred |
| Reviews | ✅ Implemented | GET/POST /orders/:id/review (customer post-collection only) |

**Client integration:** All runtimes (`apps/web`, `apps/mobile-customer`, `apps/mobile-cook`) use `@shc/api-client` (no runtime mock) → Medusa `/store/shc/*`. Mocks only for unit tests in `mock-service.ts`. See CURRENT_STATE §3 and packages/shc-api-client. Bootstrap writes .env.local for real base + publishable key.

## Standard Medusa Store API (Use SDK)

(Full list from original blueprint preserved — customer register/login, cart, line item, complete, orders, etc.)

## Cook Auth Actor Routes

Cook login uses SHC JWT (issueCookToken) verifying against `shc_cook.login_email` + `password_hash` (scrypt). Dev plaintext fallback behind `SHC_COOK_ALLOW_DEV_PLAINTEXT`. Customer uses Medusa auth + ensureStoreCustomer. See 07-auth.md + shc-auth.ts + seed.

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