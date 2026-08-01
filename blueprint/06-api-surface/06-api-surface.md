# 06 — API Surface (Canonical Routes)

**Related Files:**
- [../CURRENT_STATE.md](../CURRENT_STATE.md) — **implemented route file map + client wiring matrix (authoritative snapshot)**
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../11-medusa-modules/11-medusa-modules.md](../11-medusa-modules/11-medusa-modules.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)

**Last Updated:** 2026-07-29 — Ledger-backed earnings; mock-service removed; `pnpm smoke:admin-ops`.

**Contracts Track owns this file after Phase 0.** (Wave 1: Zod schemas ready for all payloads/routes; contract tests added; see 05 for data; ERROR_CODES for errors. Backend to implement using imports from @shc/types)

## Implementation Status (2026-06-15)

**Canonical spec** for all planned routes remains in the sections below. For **what is implemented today** (file paths, methods, client wiring, gaps), see **[CURRENT_STATE.md §3–§5](../CURRENT_STATE.md)**.

| Area | Status | Notes |
|------|--------|-------|
| Store discovery (cooks, products, slots) | ✅ Implemented | `/store/shc/cooks`, `/products`, `/products/:id/slots`, search |
| Cart + checkout | ✅ Implemented | `shc-cart` Postgres module + `demo-complete` (PDPA, credits, corporate, **collection_notes** + **customer_collection_lat/lng/postal/line1**) + `checkout-credits` + complete route |
| Orders + messages + transitions + review | ✅ Implemented | Full per-order list (enriched with id + items snapshot + total for UI) /detail/transition/messages/review. Items+total snapshotted at checkout. |
| Growth (credits, requests, bids, ai) | ✅ Implemented | Full Phase 8–9 routes + ledger ties |
| Earnings, listings, compliance, notifications, push-token | ✅ Implemented | **`GET /store/shc/earnings`** — ledger-backed (completed orders + `shc_ledger`); commission from business rules. Listings: GET/POST `/store/shc/listings`, PATCH/DELETE `/store/shc/listings/:id` (cook owner); compliance DB-backed; notifications via shc-notification; push wired |
| Search | ✅ Implemented | `/store/shc/search` delegates to product list + suggestions |
| Auth (login/register JWT) | ✅ Implemented | Customer (Medusa + profile), Cook register/login/profile (SHC JWT + scrypt hash on shc_cook) + /me |
| Admin (payment-confirm, payouts, ledger, verification) | ✅ Implemented | See `apps/medusa/src/api/admin/shc/` |
| Media upload (MinIO/S3) | ✅ Full server upload (base64 -> backend putObject to MinIO with auth) + presigned mode + 400px WebP derivative via Sharp. POST /store/shc/upload supports mode=server or presigned. Integrated with listings. | done (core) |
| Reviews | ✅ Implemented | GET/POST /orders/:id/review (customer post-collection only) |
| **Tiffin subscription** | ✅ Implemented | See tiffin routes table below; `@shc/api-client` + mobile hooks |

**Tiffin routes (2026-07-09):**

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/store/shc/tiffin/kitchens` | GET | public | Browse enabled kitchens + eligible dishes |
| `/store/shc/tiffin/kitchens/:cookId` | GET | public | Single kitchen menu for subscribe flow |
| `/store/shc/tiffin/kitchens` | GET | public | Browse enabled kitchens + `subscriber_count` |
| `/store/shc/tiffin/kitchens/:cookId` | GET | public | Single kitchen menu for subscribe flow |
| `/store/shc/tiffin/subscription` | GET, POST, DELETE | customer JWT | Active sub (+ `ledger[]`, `balance_cents`); subscribe (pg-first); cancel |
| `/store/shc/tiffin/subscription/pause` | POST | customer JWT | `{ days }` — flex pause + ledger |
| `/store/shc/tiffin/subscription/resume` | POST | customer JWT | Resume paused sub |
| `/store/shc/tiffin/subscription/recharge` | POST | customer JWT | `{ weeks, paynow_ref? }` — direct ledger extend (smoke/ops; UI uses HitPay path) |
| `/store/shc/tiffin/subscription/recharge/paynow` | POST | customer JWT | `{ weeks }` — HitPay QR; webhook completes recharge |
| `/store/shc/orders/corporate/invoices` | GET | customer JWT | `?from=&to=&format=json\|zip` — paid corporate tax invoices bundle; `?issue_url=1` → signed ZIP hook URL for mobile |
| `/store/shc/tiffin/weekly-plan` | GET, PUT | customer JWT | Recurring template (`week_start` null) |
| `/store/shc/tiffin/weekly-plan/next-week` | PUT | customer JWT | Override plan for upcoming week only |
| `/store/shc/tiffin/orders` | GET | customer JWT | Calendar meal instances `?from&to` |
| `/store/shc/tiffin/orders/skip` | POST | customer JWT | Skip one collection day (8h cutoff + flex) |
| `/store/shc/tiffin/orders/customize` | POST | customer JWT | `{ collection_date, extra_lines[], amount_cents? }` — HomelyEats add extras (≥8h) |
| `/store/shc/tiffin/subscription/notes` | PATCH | customer JWT | `{ cooking_notes?, collection_notes? }` |
| `/store/shc/tiffin/orders/kitchen-cancel` | POST | cook JWT | Cancel kitchen day for all subs |
| `/store/shc/tiffin/cook/config` | GET, PUT | cook JWT | Enable kitchen; returns `subscriber_count` |
| `/store/shc/tiffin/cook/menu` | GET, PUT | cook JWT | Publish/read day menu |

**GET subscription body:** `{ subscription, kitchen, ledger[], plans, slots_*, current_week, next_week }`  
**Tables:** `shc_tiffin_subscription`, `shc_tiffin_weekly_plan`, `shc_tiffin_sub_meta` (flex, expires, deliveries_left, balance_cents), `shc_tiffin_ledger`

Client methods: `getTiffinKitchens`, `getTiffinKitchen`, `getTiffinSubscription`, `subscribeTiffin`, `cancelTiffinSubscription`, `pauseTiffinSubscription`, `resumeTiffinSubscription`, `rechargeTiffinSubscription`, `createTiffinRechargePayNow`, `getTiffinWeeklyPlan`, `saveTiffinWeeklyPlan`, `saveTiffinNextWeekPlan`, `getTiffinCookConfig`, `updateTiffinCookConfig`, `skipTiffinMeal`, `publishTiffinDayMenu`, `kitchenCancelTiffinDay`.

Smoke: `pnpm smoke:tiffin` · Ship: `bash scripts/ship-tiffin-wave7.sh`

**Order invoices (SG):**
- **Dish invoice (cook → customer):** `GET /store/shc/orders/:id/invoice` — customer JWT only (cook JWT → 403 + weekly payout hint). JSON + `pdf_base64` + HTML; `?format=pdf` streams PDF; `?issue_url=1` → signed `download_url` (`GET /hooks/shc/invoice?…`). Supplier on PDF = cook; SHC shown as facilitator. Built via `@shc/utils` `buildOrderInvoice` / `invoiceToPdfBase64`.
- **Weekly payout invoice (SHC → cook):** `GET /store/shc/earnings/payouts/:batchId/invoice` — cook JWT; same response shapes + `GET /hooks/shc/payout-invoice?…` signed URL. Built via `@shc/utils` `buildPayoutInvoice` / `payoutInvoiceToPdfBase64`.
- **Corporate bundle:** `GET /store/shc/orders/corporate/invoices?format=zip` or `?issue_url=1` → `GET /hooks/shc/corporate-invoices?…`.

**PayNow (HitPay):** `POST /store/shc/orders/:id/paynow` (customer JWT) → HitPay `paynow_online` QR (`qr_image_data_url`). `POST /hooks/shc/hitpay` — HitPay webhook (`charge.created` / `payment_request.completed`) → `markOrderPaid`. No customer manual confirm. Ops: `POST /admin/shc/payment-confirm`. See `content/hitpay-setup.md`.

**Cooking soon (drops):** `GET/POST /store/shc/drops`; marketplace list = open + orderable + **cook_date within 7 days**. Customer kitchen page uses `?cook_id=` active filter with same window.

**Admin / Ops** (Medusa Admin **SHC Ops** UI at `/app/shc-ops/*` + `/admin/shc/*`; web `/ops` redirects):
| Path | Purpose |
|------|---------|
| `GET /admin/shc/overview` | KPI snapshot: active orders, GMV sample, cooks, disputes, requests |
| `GET /admin/shc/charts` | Unified chart payloads for all ops domains (`?days=7–90`) — orders, listings, payouts, compliance, disputes, ledger |
| `GET /admin/shc/analytics` | Order/GMV trends + conversion rate (`?days=7–90`) |
| `GET /admin/shc/hitpay` | HitPay payment-requests list (Railway `HITPAY_API_KEY`) |
| `GET /admin/shc/orders` | Cross-app order board (status/cook/customer filters) |
| `GET /admin/shc/compliance` | SFA/WSQ review queue + summary funnel |
| `GET/POST/DELETE /admin/shc/categories` | Catalog cuisine presets (not cook-owned) |
| `GET/POST/DELETE /admin/shc/discover-promos` | Discover home promo carousel slides |
| `GET/POST /admin/shc/customer-config` | Aggregated browse chrome (occasions, copy, thresholds) |
| `GET/POST /admin/shc/business-rules` | Marketplace tunables (commission fallback, drops window, tiffin cutoff, cart, reviews) |
| `GET/POST /admin/shc/cook-config` | Cook portal chrome (dashboard tiles, compliance links, listing presets, chat replies) |
| `GET/POST /store/shc/drops` | Cooking soon marketplace list + cook create batch |
| `GET/PATCH /store/shc/drops/:id` | Drop detail + cook pause/close/extend |
| `POST /store/shc/drops/:id/order` | Customer capacity-aware batch order (fixed collection) |
| `GET /store/shc/categories` | Public mind-row categories for discover |
| `GET /store/shc/discover-promos` | Public discover home promo carousel slides |
| `GET /store/shc/customer-config` | Aggregated customer browse chrome (categories + promos + occasions + copy) |
| `GET /store/shc/business-rules` | Public marketplace rule hints (tiffin cutoff, cart policy, drop window) |
| `GET /store/shc/cook-config` | Cook portal chrome + order chat quick replies |
| Existing | feature-flags, disputes, payouts, ledger, commission-rules, search-synonyms, platform-stats, payment-confirm |

**Admin refresh policy:** SHC Ops UI uses React Query polling (30s hot paths, 45s default) + refetch on tab focus — not WebSocket push. See `apps/medusa/ADMIN.md` + `src/admin/lib/shc-ops-polling.ts`.

**Client integration:** All runtimes (`apps/web`, `apps/mobile-customer`, `apps/mobile-cook`) use `@shc/api-client` (no runtime mock) → Medusa `/store/shc/*`. Legacy `apps/mobile-*/lib/mock-service.ts` **removed** (2026-07-29). Failed responses throw `ShcRequestError` with optional `SHCErrorCode` from `{ error: { code, message } }`. Cook portal web uses `cook-api-client.ts` (separate token). See CURRENT_STATE §3 and packages/shc-api-client. Bootstrap writes .env.local for real base + publishable key.

**Admin smoke (Tier 4):** `pnpm smoke:admin-ops` — `scripts/smoke-admin-ops.ts` logs into Railway Medusa admin, round-trips GET/POST for `customer-config`, `business-rules`, `cook-config`, `discover-promos`, restores prod values.

**Listings routes (2026-07-24):**
- `GET /store/shc/listings` — cook JWT; returns cook's listings
- `POST /store/shc/listings` — cook JWT; create listing (name, price, description, cuisine, allergens, availability, halal, min_qty)
- `PATCH /store/shc/listings/:id` — cook JWT; update owned listing (`ListingUpdateSchema` from `shc-listing-schema.ts`); supports `meal_extras`, `meal_addons`, `recipe_steps`
- `DELETE /store/shc/listings/:id` — cook JWT; soft-delete owned listing
- Cook profile: `GET/PATCH /store/shc/auth/cook/profile` accepts `collection_address`, `collection_instructions`, `availability_paused`, `avatar_url`, `hero_image_url`, PDPA

Client methods: `getCookListings`, `createCookListing`, `updateCookListing`, `deleteCookListing`.

## Standard Medusa Store API (Use SDK)

(Full list from original blueprint preserved — customer register/login, cart, line item, complete, orders, etc.)

## Cook Auth Actor Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/store/shc/auth/cook/register` | POST | Public | New cook sign-up → `shc_cook` + JWT |
| `/store/shc/auth/cook/login` | POST | Public | Existing cook login |
| `/store/shc/auth/cook/profile` | PATCH | Cook JWT | Onboarding/profile (story, **collection_address**, collection_instructions, **availability_paused**, **avatar_url**, **hero_image_url**, pdpa_consent) |

Cook login uses SHC JWT (issueCookToken) verifying against `shc_cook.login_email` + `password_hash` (scrypt). Dev plaintext fallback behind `SHC_COOK_ALLOW_DEV_PLAINTEXT`. Customer uses Medusa auth + ensureStoreCustomer. See 07-auth.md + shc-auth.ts + seed.

**Wiring verification:** `pnpm verify:cook-wiring` — Railway HTTP when register route deployed; falls back to in-process handler test (`wiring.integration.test.ts`) until deploy.

## SHC Store API (`/store/shc/*`)

All routes require Authorization except public ones. Full table of 30+ routes preserved (upload, cooks, products/search, profile, compliance, orders, messages, review, push-token, etc.).

**Push token route (added final wave):** POST /store/shc/push-token { cook_id, expo_push_token } — registers for targeted pushes on order events (paid, ready_for_collection, completed). See subscriber + 03-railway.md. Real Expo service (expo-server-sdk) required in prod.

**Compliance route (2026-06-29 launch pass):** GET/POST `/store/shc/compliance` — cook JWT required; persists SFA/WSQ document references in `shc_compliance_doc` for admin review.

## SHC Admin API (`/admin/shc/*`)

Verification, payments confirm, disputes, payouts, ledger, commission-rules, exports, receipts.

## Internal Worker Routes (`/admin/shc/internal/*`)

Protected by WORKER_API_KEY (certificates, payouts, analytics, digest).

**Production Note:** Every route must have Zod validation + typed error codes. See production-hardening.md.

**Backend-Completion (2026-06-14 final wave):** Added real growth routes for Phase 8-9 (using frozen shc_request/bid schemas + @shc/types + business-rules):
- /store/shc/requests (GET list open, POST create; + /[id] GET)
- /store/shc/bids (GET list by cook/request, POST create; /[id]/accept POST for matched order-originated)
- /store/shc/credits (GET balance+history, POST redeem with ledger post)
- /store/shc/ai (POST calorie-estimate from ingredients [stub + Claude notes/rate/cost], GET photo-tips)
Tied corporate flag, notifs via events. Enhanced /store/shc/carts/[id]/complete + /orders + payment-confirm + workflows/subscribers for credits/requests/corporate + ledger credit flows + full audits (actor/action/before-after) + Zod/SHCError on all. New minimal modules shc-request/shc-bid/shc-credit-wallet (extend order-meta/ledger for parity). **`shc-heritage` module removed 2026-07-24** (unwired; dish story = `description`). Seed updated. Mobile (toggle) now gets real data. "Backend-Completion done". See 11-medusa + phases.