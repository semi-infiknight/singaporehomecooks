# Current State — Singapore Home Cooks

**Last Updated:** 2026-07-29 — Post-merge sync: location provider, earnings ledger, Maestro ecfdc8 wave, admin smoke, mock removal.
**Audience:** AI agents and subagents (canonical brain: [README.md](./README.md))  
**Read order:** `INDEX.md` → **this file** → **[AGENT_PLAYBOOK.md](./AGENT_PLAYBOOK.md)** → `AGENTS.md` → track file from `multi-agent/tracks.md`

---

## 0. New-session handoff (2026-07-29)

**Do first:** `git pull` · `pnpm env:sync` · `bash scripts/start-mobile-dev.sh` · clients always hit **Railway Medusa** (`medusa-production-d2ba.up.railway.app`).

| Topic | State |
|-------|--------|
| **Location sync (client)** | `CustomerLocationProvider` wraps `(customer)/_layout` — discover, location picker, cart, checkout share one React state. SecureStore still source of truth; saving an area updates discover header + nudge immediately (fixes stale per-hook instances). |
| **Discover polish** | `shcSectionStack` on discover sections; **no duplicate All** cuisine row (API `customerMindCategories` already includes All); index-suffixed React keys in `GourmeatCategoryRow` + `SHCDiscoverFilterSheet` (prevents `.$all` LogBox crash). |
| **Cart pay CTA** | `computeOneTimeOrderSummary().proceedLabel` = `"Proceed to pay"` only; `GourmeatPayButton` renders `totalLabel` in `amount` prop — no double price on sticky footer. |
| **Cook tab crash** | Duplicate `settings` `Tabs.Screen` removed from `apps/mobile-cook/app/(cook)/_layout.tsx`. |
| **Cook earnings (ledger truth)** | `GET /store/shc/earnings` reads completed orders + `shc_ledger` summary; commission from admin business rules. Tri-platform `@shc/ui/cook-earnings.tsx` + `@shc/utils/cook-earnings.ts` (IRAS note, expense tracker, create-listings CTA). Listing wizard shows earnings preview from rules. |
| **Cook kitchen area** | `SHCCookAreaPicker` + `@shc/utils/sg-areas.ts` — SG centroid chip suggestions on cook settings + onboarding (tri-platform). |
| **Admin occasion tags** | `listingOccasionTagOptions()` from customer browse config → cook listing + request pickers. |
| **E2E (scoped + coverage)** | `pnpm e2e:ecfdc8-wave` — location/discover wave Maestro flows. Also on `main`: order lifecycle, decline/dispute trays, batches smoke, earnings expense, cook-settings-smoke. Web: `apps/web/e2e/cook-portal-smoke.spec.ts` (Playwright). |
| **Admin smoke** | `pnpm smoke:admin-ops` — admin login + round-trip GET/POST for customer-config, business-rules, cook-config, discover-promos (restores prod values after test). |
| **Mocks removed** | `apps/mobile-*/lib/mock-service.ts` **deleted** — all runtime clients Medusa-only via `@shc/api-client`. |
| **Branches** | Work on `main` only; `main` @ `e57ecbd` (2026-07-29) includes location wave + cursor branch merges + session fixes. |

## 0a. Prior handoff (2026-07-27)

**Do first:** `git pull` · `pnpm env:sync` · `bash scripts/start-mobile-dev.sh` · clients always hit **Railway Medusa** (`medusa-production-d2ba.up.railway.app`).

| Topic | State |
|-------|--------|
| **Location integration** | Merged on `main`: SG quick-pick area chips + discover nudge when no location; discover/tiffin sort by cook proximity when collection point set; tiffin auto-selects **Nearest** chip; **Order again** + top-rated for-you rails proximity-sorted; distance labels on kitchen cards. Checkout pre-fills collection point from saved location; place-order requires location. |
| **Order collection snapshot** | `POST /store/shc/carts/demo-complete` persists `customer_collection_lat/lng/postal_code/line1` on `shc_order_meta` (+ human `collection_notes`). Migration `Migration20260727180000OrderMetaCustomerCollection` **deployed** to Railway medusa (`7c55c90`, 2026-07-29). |
| **Cook configurability** | Stitched items 1–8 on `main`: settings (pause, collection address/instructions, **collection time slots**), avatar/hero upload, per-kitchen tiffin pricing, tiffin slot options, order collection release, batches slot picker, product meta (`meal_extras`, `meal_addons`, `recipe_steps`). Cook-owned via profile + listing wizard + batches/tiffin screens. |
| **Admin configurability** | Stitched items 9–12 on `main`: discover promo carousel, marketplace business rules, cook portal chrome (dashboard tiles, greetings, allergen presets, chat quick replies), unified browse config. Collection time slots are **cook-owned** (Kitchen settings), not admin. |
| **Client hooks** | `useCustomerConfig` (web + mobile-customer), `useCookConfig` (web cook-portal + mobile-cook). Fallback to `@shc/utils` code defaults until admin saves. |
| **Cook portal orders (web)** | Parity with mobile cook: decline on `paid`, dispute reporting, cooking/collection notes, list-level Chat → `#cook-order-chat`, inline order chat + quick replies. |
| **Migrations (Railway)** | Medusa deployed 2026-07-29 (`7c55c90`): tiffin kitchen pricing, cook media, product meta meal fields, **order-meta customer collection columns** live. Platform config keys need no migration. |
| **Branches** | Work on `main` only; all `cursor/*-67bb` stitch branches merged + pruned (2026-07-29). |

## 0b. Prior handoff (2026-07-27)

**Do first:** `git pull` · `pnpm env:sync` · `bash scripts/start-mobile-dev.sh` · clients always hit **Railway Medusa** (`medusa-production-d2ba.up.railway.app`).

| Topic | State |
|-------|--------|
| **Discover home** | Shared `@shc/utils` `discoverSections()` spine: promo carousel → cooking soon → for-you rail → **Dishes \| Kitchens** mode switch + **Occasions** nav link → mode content (cuisine rail + dish grid OR kitchen list) → request CTA. Filter tray/sheet via `SHCDiscoverFilterSheet` / `DiscoverFilterSheet` + `filterDiscoverProducts`. |
| **Occasions** | Dedicated route `/occasions` (web) · `/(customer)/occasions` (mobile) — not an inline discover mode. `occasion-browse.ts` + `occasionBrowseRoute()`. |
| **Honest browse** | `coerceRating()` — no fake 4.8/24. Discount badges only when API sends percent. `kitchenRatingSummary()` null without rating. Product/tiffin APIs attach cook `rating` + `review_count`. Cook review lists from `GET /store/shc/cooks/:slug/reviews` (not `kitchenDemoReviews`). |
| **Filter parity** | Category + advanced search use same filter sheet as discover (meal type, cuisine on search, dietary). Category hides cuisine group (`hideCuisine`) — locked by route. |
| **Collection slots** | Dish cards show `collection_slot` only when API sends it — no `getCollectionSlotLabel()` hash fallback on browse. |

## 0c. Prior handoff (2026-07-27)

**Do first:** `git pull` · `pnpm env:sync` · `bash scripts/start-mobile-dev.sh` · clients always hit **Railway Medusa** (`medusa-production-d2ba.up.railway.app`).

| Topic | State |
|-------|--------|
| **Discover home** | Top zone = **`SHCHomePromoCarousel`** (16:9 paging carousel, `home-promo-carousel`) fed by `@shc/utils` `discoverHomePromoCarousel()` — tiffin, Hari Raya, request, family, PayNow. Removed: Browse→Order→Collect journey strip, icon quick-actions, weekly-tiffin section region, duplicate navy offer card, separate occasions promo rail. |
| **Home greeting** | `discoverHomeHeadline(name, email)` → signed-in: `Hi, {first}` + subtitle; guest: `Hungry? Order & Eat.` Uses **email local-part** when `user.name` empty (fixes Profile “You” vs Home guest mismatch). `/store/shc/auth/me` fallback now sets `name` from email prefix. |
| **Metro dev** | Root `devDependencies.metro-runtime` + `.npmrc` hoist — fixes Expo CLI `Cannot find module metro-runtime` after `METRO_CLEAR=1`. |

## 0d. Prior handoff (2026-07-24)

**Do first:** `git pull` · `pnpm env:sync` · `bash scripts/start-mobile-dev.sh` · clients always hit **Railway Medusa** (`medusa-production-d2ba.up.railway.app`).

| Topic | State |
|-------|--------|
| **Cook listings** | Cooks edit allergens, availability (portions/days/slots), description, collection address via shared `@shc/ui` `listing-form` + `@shc/utils/listing-form` (web cook-portal + mobile-cook wizard/onboarding). Dish story = `description` (no `heritage_note`). |
| **Badges** | `SHCMetaBadge` + `@shc/utils/badge-ux` — semantic `kind` → variant (`warm` for cuisine/occasion/price, etc.). Tri-platform; do not hand-pick `variant="warm"`. |
| **Admin / Ops** | SHC Ops **Recharts** on all pages + `/app/shc-ops/charts` visual explorer (`GET /admin/shc/charts`). **Near-realtime** via React Query 30–45s poll + tab-focus refetch + `invalidateShcOpsDashboard` after mutations (not WebSocket). See `apps/medusa/ADMIN.md`. |
| **Payments** | **HitPay only** — order PayNow + tiffin recharge. QR fetch **once per order/weeks** (no re-fetch loop); poll until webhook. `PayNowPanel` keeps QR visible during refresh. |
| **Checkout UX** | `GourmeatPayButton` **disabled** until collection slot + allergen + PDPA; hint text above CTA. Web mirrors. |
| **Bottom insets** | Removed tab `sceneStyle.paddingBottom` (was double-stacking ~100px). Tokens: `gourmeatLayout` + `contentPadForTabBar` / `contentPadForStickyFooter` / `contentPadSafe` in `@shc/ui`; web `--shc-mobile-tab-pad`, `shc-tab-bar-pad`, `shc-sticky-footer-pad`, `shc-safe-bottom-pad`; `hideMobileTabBar()` hides tab bar on checkout/PDP/stack routes. |
| **Category UI** | `categoryStackGap` (8px) — eyebrow → circles → labels; `GourmeatCategoryRow title=` prop; verified Unsplash IDs in `@shc/utils/food-visuals`; `SHCFoodImage` onError fallback. |
| **Discover** | Admin-managed customer browse via `GET /store/shc/customer-config`. Cook portal via `GET/POST /admin/shc/cook-config` + SHC Ops → Cook portal. Business rules via `GET/POST /admin/shc/business-rules` + Controls. Cook-owned: listings, `collection_instructions`, story, images. |
| **Reload scripts** | `pnpm customer:reload` / `METRO_CLEAR=1 pnpm customer:reload` → `scripts/reload-customer-emulator.sh`. |
| **Railway medusa** | Deploy fixed (`shc-order-invoice-from-meta` types); `pnpm railway:configure-medusa`. |
| **HitPay env** | `HITPAY_API_KEY`, `HITPAY_WEBHOOK_SALT`, `HITPAY_ENV=sandbox`. Webhook: `/hooks/shc/hitpay`. |
| **Not done** | Live HitPay KYC; rotate secrets if exposed in chat. |

## 0e. Prior handoff (2026-07-14)

**Do first:** `git pull` · `pnpm env:sync` · `bash scripts/start-mobile-dev.sh` · clients always hit **Railway Medusa** (`medusa-production-d2ba.up.railway.app`).

| Topic | State |
|-------|--------|
| **Payments** | **HitPay only** for customer order PayNow **and tiffin recharge**. No “I’ve paid” self-confirm. Orders: `POST /store/shc/orders/:id/paynow` → QR; webhook → `markOrderPaid`. Tiffin: `POST /store/shc/tiffin/subscription/recharge/paynow` → QR; webhook ref `TRECH-{customer}-{weeks}W` → `rechargeSubscription`. Clients poll until paid / expiry extends. |
| **HitPay env (Railway medusa)** | `HITPAY_API_KEY` (sandbox `test_…`), `HITPAY_WEBHOOK_SALT` (per-webhook salt from dashboard), `HITPAY_ENV=sandbox`. Live = production keys + `HITPAY_LIVE=1`. Setup: [content/hitpay-setup.md](../content/hitpay-setup.md). |
| **Webhook URL** | `https://medusa-production-d2ba.up.railway.app/hooks/shc/hitpay` · events `charge.created` / `charge.updated` registered via API. |
| **Cooking soon** | Cook: Dashboard banner + `/(cook)/batches`. Customer: home rail always shown; only batches with **cook_date within next 7 days**. API `listMarketplace` filters too (after deploy). |
| **Invoices** | Mobile: signed `?issue_url=1` + `Linking.openURL`. No expo-file-system share path. |
| **Least blast** | [agent/build-protocol.md](./agent/build-protocol.md) § path of least blast radius — non-negotiable. |
| **Admin / Ops** | ✅ SHC Ops + **Compliance** queue (SFA/WSQ verify + **signed preview**) + **upload alerts** (PagerDuty + in-app) + Insights/HitPay trends; native list read mirrors (no dual-write) |
| **Demo logins** | customer@shc.local / customersecret · rose@shc.local / cooksecret · admin@shc.local / supersecret |
| **Not done** | Live HitPay KYC / real bank PayNow; secrets were shared in chat — rotate when possible. | Orders tab → **Needs action** (paid) → **Accept** (compliance verified) → preparing → ready → collected.

---

## 1. Executive Summary (30 seconds)

Singapore Home Cooks is a **Turborepo monorepo** for a two-sided marketplace (home cooks ↔ customers) in Singapore. **Medusa is required** for all clients — no mock fallback in `@shc/api-client`.

| Layer | Status | Notes |
|-------|--------|-------|
| **Mobile Customer** (`apps/mobile-customer`) | ✅ Full UX + **Tiffin** | Discover home + **Cooking soon** rail (7-day); HitPay PayNow checkout poll; Expo `:8081` |
| **Mobile Cook** (`apps/mobile-cook`) | ✅ Full UX + **Tiffin** | Dashboard **Cooking soon** banner → batches; orders **Needs action** (`paid`) + **In progress**; Accept gated on verified SFA+WSQ; Expo `:8082` |
| **Web** (Next.js `:3001`) | ✅ Customer + cook PWA + **Tiffin** | Same marketplace + HitPay PayNow; `/cook-portal`; `/ops` → Medusa Admin |
| **Design system** | ✅ v4 Family Values + skeleton kit | `@shc/ui` skeleton + **layout padding helpers**; category stack gap; tri-platform bottom inset CSS vars on web |
| **Medusa API** | ✅ Railway prod | Custom `/store/shc/*` + `/admin/shc/*` + `/hooks/shc/*` |
| **Auth (JWT)** | ✅ Dev-ready | Customer email/pass; Cook SHC JWT + scrypt |
| **Cart** | ✅ Postgres | `shc-cart` module |
| **E2E verifier** | ✅ Tier 1+ | Full loop + review + request/bid; cook-wiring includes compliance + payment confirm |
| **Maestro device E2E** | ✅ Android + iOS | `pnpm e2e:tiffin` |
| **Tiffin subscription** | ✅ Wave 8 | Ledger + flex OS; **recharge via HitPay** (`/recharge/paynow` + webhook) |
| **Expo push** | ✅ Wired | Order transitions + **new chat messages** → Expo/web push + in-app bell |
| **iOS / Android native** | ✅ Both apps | Metro 8081 / 8082; rebuild scripts in `scripts/` |
| **PayNow / HitPay** | 🟡 **Sandbox only** | QR + webhook; no real bank until live KYC. [content/hitpay-setup.md](../content/hitpay-setup.md) |
| **Order invoices (PDF)** | ✅ | Per-order + **corporate bulk ZIP** (`GET /store/shc/orders/corporate/invoices?format=zip` or `?issue_url=1` on mobile); signed hooks URL on mobile |
| **Cooking soon (drops)** | ✅ | 7-day customer window; cart→checkout; capacity CAS |
| **Listing AI photos** | ✅ full | FLUX + CF env for Generate |
| **Production deploy** | ✅ | Railway `homecooks`; see `RAILWAY_DEPLOY.md` |
| **Admin / Ops** | ✅ | Medusa Admin + SHC Ops (`/app/shc-ops`, `/app/shc-ops/charts`); Recharts on overview/insights/orders/catalog/compliance/controls; unified `GET /admin/shc/charts`; near-realtime 30–45s poll (`shc-ops-polling.ts`); native list mirrors (no dual-write); `ShcQueryProvider` + `invalidateShcOpsDashboard` |

**Do not trust `STATUS.md` alone.** This file + blueprint sections are canonical. Update blueprint after route/module/UI changes.

**Repo:** [github.com/semi-infiknight/singaporehomecooks](https://github.com/semi-infiknight/singaporehomecooks)

---

## 2. Architecture

```
┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
│ apps/mobile-customer │  │ apps/mobile-cook     │  │   apps/web      │
│ (Expo :8081)         │  │ (Expo :8082)         │  │  (Next :3001)   │
└──────────┬───────────┘  └──────────┬───────────┘  └────────┬────────┘
           │                         │                       │
           └─────────────────────────┴───────────────────────┘
                                     ▼
         ┌───────────────────────────┐
         │  packages/shc-api-client   │  ← Medusa-only (no mock)
         │  Bearer JWT + publishable  │
         └───────────┬───────────────┘
                     │ /store/shc/auth/* + /store/shc/*
                     ▼
         ┌───────────────────────────┐
         │   apps/medusa :9000        │
         │   Postgres + Redis (opt)   │
         └───────────────────────────┘
```

**Shared contracts:** `packages/shc-types`, `packages/business-rules`  
**Seeds:** `seed/index.ts` + `apps/medusa/scripts/seed.ts` — canonical `dish_*` product IDs

---

## 3. Auth & Integration Mode

### Demo accounts (after `pnpm bootstrap:medusa`)

| Role | Email | Password |
|------|--------|----------|
| Customer | `customer@shc.local` | `customersecret` |
| Cook | `rose@shc.local` | `cooksecret` |
| Admin | `admin@shc.local` | `supersecret` |

Bootstrap creates auth identity **and** Medusa store customer profile (required for non-empty JWT `actor_id`).

### Client env (generated by bootstrap)

| App | Env file | Key vars |
|-----|----------|----------|
| Mobile Customer | `apps/mobile-customer/.env.local` | `EXPO_PUBLIC_MEDUSA_BASE`, `EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY` |
| Mobile Cook | `apps/mobile-cook/.env.local` | same |
| Web | `apps/web/.env.local` | `NEXT_PUBLIC_SHC_API_BASE`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` |

**Railway-only backend** — all clients (web, mobile-customer, mobile-cook, emulators, TestFlight, PWA) call `https://medusa-production-d2ba.up.railway.app`. Local Medusa (`localhost:9000`) is disabled; `resolveRailwayMedusaBase()` throws on localhost. Source: `config/railway-client.json`; env files written by `pnpm env:sync` (runs on `pnpm install`).

### Auth routes

| Route | Purpose |
|-------|---------|
| `POST /store/shc/auth/customer/login` | Medusa email/pass → JWT + user |
| `POST /store/shc/auth/customer/register` | Register + auto-create store customer |
| `POST /store/shc/auth/cook/register` | New cook sign-up → `shc_cook` + SHC JWT |
| `POST /store/shc/auth/cook/login` | SHC JWT; verifies cook exists in `shc_cook` |
| `PATCH /store/shc/auth/cook/profile` | Cook JWT; story, **collection_address**, collection_instructions, **availability_paused**, **avatar_url**, **hero_image_url**, PDPA |
| `GET /store/shc/auth/me` | Current user from Bearer token |

Protected routes use `getCustomerId` / `getCookId` from JWT — **not** `x-shc-*` headers.

### Web customer auth guards (2026-07-07)

| Flow | Behavior |
|------|----------|
| `/checkout` | Guests redirected to `/login?returnTo=/checkout`; cart refreshed after sign-in |
| `/product/[id]` add-to-cart | Requires customer JWT; unauthenticated users sent to login |
| API errors | `@shc/api-client` throws `ShcRequestError` with `SHCErrorCode` from Medusa `{ error: { code, message } }` |

### Web cook portal auth

Cook portal uses a **separate session** from customer auth (`useCookAuth` + `cook-api-client.ts`). Routes under `/cook-portal/*` gated by `CookLoginGate`.

### Railway CORS (production)

Medusa must use **explicit** `STORE_CORS` and `AUTH_CORS` origins (web + localhost ports). Mixing wildcard `*` with explicit origins prevents `Access-Control-Allow-Origin` from being emitted. Run `pnpm railway:wire` after env changes.

---

## 4. E2E Verification

```bash
pnpm install          # writes Railway .env.local via postinstall
pnpm verify:real-e2e  # smoke against Railway Medusa (seed cook rose@)
REQUIRE_RAILWAY=1 pnpm verify:cook-wiring  # new cook register → listing → customer order → accept/decline (Railway HTTP)
# optional: pnpm bootstrap:medusa  # refresh publishable key + demo customer on Railway
```

**Cook ↔ customer wiring (`verify:cook-wiring`):** `REQUIRE_RAILWAY=1` gates goal verify (`SCOPE=onboarding`). Registers a fresh cook on Railway, uploads SFA+WSQ compliance docs (ops admin-verify), publishes a listing, confirms `GET /store/shc/products?cook_id=…` includes it, customer checkout with matching `cook_id`, admin `POST /admin/shc/payment-confirm` (`cart → paid`), cook `GET /store/shc/orders?role=cook`, then accept + decline transitions. Local `:9000` optional when flag unset (dev only).

**`scripts/verify-real-e2e.ts` covers:**

1. Health, cooks, products, product detail
2. Customer login + `/auth/me` (requires non-empty user id)
3. Cart add (authenticated)
4. `POST /store/shc/carts/demo-complete` (checkout → `cart` status)
5. `POST /admin/shc/payment-confirm` (`cart → paid`)
6. Customer orders list
7. Cook login + orders list
8. Cook transitions: `paid` → `accepted` → `preparing` → `ready_for_collection`
9. Order detail confirms final status
10. Messages (customer + cook), `collected` → `completed`, review POST/GET
11. Request → bid → accept (growth flow); optional admin ledger check

CI job `medusa-real-e2e` in `.github/workflows/ci.yml` runs the same flow on push to `main`.

---

## 5. Implemented Medusa Routes (file map)

### Store auth (`apps/medusa/src/api/store/shc/auth/`)

| Path | Methods |
|------|---------|
| `/store/shc/auth/customer/login` | POST |
| `/store/shc/auth/customer/register` | POST |
| `/store/shc/auth/cook/register` | POST |
| `/store/shc/auth/cook/login` | POST |
| `/store/shc/auth/cook/profile` | PATCH |
| `/store/shc/auth/me` | GET |

### Store (`apps/medusa/src/api/store/shc/`)

| Path | Methods | Auth |
|------|---------|------|
| `/store/shc/cooks` | GET | public |
| `/store/shc/cooks/:slug` | GET | public |
| `/store/shc/products` | GET | public |
| `/store/shc/products/:id` | GET | public |
| `/store/shc/cart` | GET, POST, DELETE | customer JWT |
| `/store/shc/carts/demo-complete` | POST | customer JWT |
| `/store/shc/orders` | GET | customer or cook JWT (`?role=`) |
| `/store/shc/orders/:id` | GET | public (meta lookup) |
| `/store/shc/orders/:id/transition` | POST | cook JWT |
| `/store/shc/orders/:id/messages` | GET, POST | customer/cook JWT |
| `/store/shc/orders/:id/review` | GET, POST | POST: customer JWT (post-collection) |
| `/store/shc/earnings` | GET | cook JWT — **ledger-backed** summary for **completed** orders; commission rate from admin business rules |
| `/store/shc/notifications` | GET | customer or cook JWT |
| `/store/shc/listings` | GET, POST | cook JWT; POST/PATCH persist allergens, availability, description, price, cuisine, halal, min_qty |
| `/store/shc/listings/:id` | PATCH, DELETE | cook JWT (owner only); PATCH accepts full listing form payload |
| `/store/shc/tiffin/kitchens` | GET | public |
| `/store/shc/tiffin/kitchens/:cookId` | GET | public |
| `/store/shc/tiffin/subscription` | GET, POST, DELETE | customer JWT |
| `/store/shc/tiffin/weekly-plan` | GET, PUT | customer JWT |
| `/store/shc/tiffin/weekly-plan/next-week` | PUT | customer JWT |
| `/store/shc/tiffin/cook/config` | GET, PUT | cook JWT |
| `/store/shc/ai/image` | GET, POST | GET public status (configured, cuisine_presets); POST cook JWT — generate \| enhance polish/restyle → MinIO |
| …growth routes (requests, bids, ai, compliance, upload, feature-flags, disputes) | various | ✅ implemented |

### Server libs (`apps/medusa/src/lib/`)

| File | Purpose |
|------|---------|
| `shc-auth.ts` | JWT sign/verify, Medusa customer login/register, `ensureStoreCustomer` |
| `shc-actors.ts` | Resolve customer/cook from Bearer token |
| `shc-cart` module | Postgres-backed cart (`shc_cart` table); legacy `shc-cart-store.ts` deprecated |
| `shc-product-shape.ts` | Product DTO mapper |
| `shc-notifications-store.ts` | In-memory notifications (dev) |
| `shc-tiffin-shape.ts` | Kitchen/subscription DTO mapper |
| `shc-tiffin-weekly-orders.ts` | Idempotent weekly order materialization (`TIFFIN-{subId}-{week}-{day}`) |
| `shc-cf-image.ts` | Cloudflare FLUX generate + sharp polish; cuisine presets; public status |
| `shc-admin-chart-aggregate.ts` | Unified chart payloads for `GET /admin/shc/charts` |
| `shc-listing-schema.ts` | Zod for cook listing create/update (allergens, availability, etc.) |

### Tiffin (`apps/medusa/src/modules/shc-tiffin/`)

| Table | Purpose |
|-------|---------|
| `shc_tiffin_kitchen_config` | Cook enables kitchen, eligible `product_id`s, collection days, tagline |
| `shc_tiffin_subscription` | One active sub per customer; single `cook_id`; meals_per_week 2/3/4 |
| `shc_tiffin_weekly_plan` | `week_start` null = recurring template; dated row = next-week override |

**Scripts:** `apps/medusa/scripts/tiffin-weekly-orders.ts` — manual or worker cron.  
**Seed:** Tiffin kitchen config is part of **one** `apps/medusa/scripts/seed.ts` pass (same as cooks/dishes/growth). Entrypoint runs full seed every boot (opt out `RAILWAY_SKIP_SEED=true`). No separate tiffin seed command. Kitchen config API uses `src/lib/shc-tiffin-pg.ts` behind the same Medusa module/routes.  
**UI:** `packages/shc-ui/src/tiffin-ux.tsx` (mobile) + web `apps/web/app/tiffin/*` + `apps/web/app/cook-portal/tiffin`.

---

## 6. Commands

```bash
pnpm install                      # Railway .env.local for all clients (postinstall)
pnpm env:sync                     # re-write client env from config/railway-client.json
pnpm bootstrap:medusa             # optional: refresh Railway publishable key + demo customer
pnpm seed:medusa                  # full demo seed (cooks, dishes, growth, tiffin kitchen, …)

pnpm customer:dev                 # Mobile customer :8081 → Railway
pnpm cook:dev                     # Mobile cook :8082
pnpm web:dev                      # Web :3001

bash scripts/start-mobile-dev.sh  # Both Metro servers (:8081 + :8082) with adb reverse
bash scripts/rebuild-ios-apps.sh  # After native dep changes (gesture-handler, reanimated, etc.)
bash scripts/rebuild-android-apps.sh  # Customer + cook debug APKs → running emulator
bash scripts/run-maestro-full-tour.sh  # Android + iOS Maestro full tours (Metro must be running)
bash scripts/run-maestro-ecfdc8-wave.sh   # Scoped Maestro: discover/location wave + cook settings + listing tray
pnpm e2e:ecfdc8-wave                     # alias for above
pnpm smoke:admin-ops                     # Tier 4: admin↔store config round-trip on Railway

pnpm verify:wip                   # Mid-goal: optional FILTER=<pkg> or RISK=native spot check
FLAVOUR=polish SCOPE=web pnpm verify:goal   # Polish goal — typecheck + guards only
FLAVOUR=wiring SCOPE=checkout pnpm verify:goal  # Wiring goal — one Maestro flow
SCOPE=<area> pnpm verify:goal     # Feature goal — see blueprint/production/testing-flavours.md
pnpm verify:full                  # Milestone only: full tour + API smoke
pnpm verify:quick                 # One-off fix outside a goal
pnpm verify:local                 # Seed validate + typecheck (legacy alias)
pnpm verify:web-pwa               # PWA assets + build fingerprint (local)
pnpm smoke:ai-image               # Listing AI photo: status + polish; generate if CF configured
# REQUIRE_AI_GENERATE=1 pnpm smoke:ai-image   # fail if Generate offline

# Railway (after railway login + railway link)
pnpm railway:configure-web        # Point web service at railway.web.toml
pnpm railway:configure-worker     # Worker cron service
pnpm railway:configure-minio      # Object storage service
pnpm railway:wire                 # Wire ${{Service.VAR}} refs + explicit CORS origins
MEDUSA_URL=https://<medusa>.up.railway.app pnpm railway:init
pnpm railway:ship                 # Single-pass PWA deploy + evidence capture
pnpm railway:verify-pwa           # Verify live PWA fingerprint without redeploy
```

---

## 7. Known Gotchas

1. **Railway-only clients** — do not point `EXPO_PUBLIC_MEDUSA_BASE` or `NEXT_PUBLIC_SHC_API_BASE` at localhost; use `pnpm env:sync`.
2. **Store customer profile required** — bootstrap/register/login call `ensureStoreCustomer`; without it JWT `actor_id` is empty and cart returns 401.
3. **Product IDs** — canonical `dish_*` from seed; re-run `pnpm seed` after migrate.
4. **Cook login** — scrypt `password_hash` on `shc_cook`; seed sets hashes; `SHC_COOK_ALLOW_DEV_PLAINTEXT=false` disables env fallback in prod.
5. **Cart** — Postgres `shc-cart` module in production paths; legacy Redis/in-memory store deprecated (`shc-cart-store.ts`).
6. **Removed `apps/mobile`** — unified Expo 51 app deleted; use `mobile-customer` + `mobile-cook` only.
7. **Railway web service** — must use `railway.web.toml`; root `railway.toml` is Medusa-only (`pnpm railway:configure-web`).
8. **Railway bootstrap** — use `MEDUSA_URL=https://...`; do not `railway run medusa user` from laptop (internal DB URL).
9. **iOS `RNGestureHandlerModule`** — stale native binary without gesture-handler pods; run `scripts/rebuild-ios-apps.sh` after adding Reanimated/Gesture Handler.
10. **Cook Metro port** — cook app must hit `:8082`; `scripts/start-mobile-dev.sh` starts both; cook `AppDelegate` rewrites `:8081` → `:8082` deep links.
11. **Railway web CORS** — web PWA login fails with "Failed to fetch" if medusa `STORE_CORS` mixes wildcard with explicit origins; run `pnpm railway:wire`.
12. **PWA assets** — `/sw.js` and icons are served by Next.js route handlers (`apps/web/app/sw.js/route.ts`, etc.), not `public/sw.js`. Responses include `X-SHC-Railway-Build-Id` for deploy verification.
13. **Web checkout** — unauthenticated users cannot reach checkout or add-to-cart; redirect to `/login` with `returnTo`.
14. **Railway deploy requires `git push origin main`** — local commits do not deploy; plain `railway redeploy` restarts the **old** image. Use **`railway redeploy -s medusa --from-source -y`** (or GitHub auto-deploy) after push. Tiffin: `pnpm ship:tiffin`.
15. **Tiffin kitchens on Railway** — filled by normal `seed.ts` on medusa boot (same seed as cooks/dishes). If empty: cook **Save tiffin settings** or re-deploy so entrypoint seed runs.
16. **SecureStore milestone keys** — use `shc_milestone_*` (no colons); `milestoneStorageKey()` in `@shc/ui` family-values-core.
18. **Tab scene padding** — do **not** add `sceneStyle.paddingBottom` on Expo Tabs; use `contentPadForTabBar(insets.bottom)` on tab roots, `contentPadForStickyFooter` when screen has pinned Pay/CTA, `contentPadSafe` on stack screens (checkout, tiffin subflows, order detail).
19. **PayNow QR** — `loadPayNowSession` guarded by ref (one fetch per order/recharge); `useMilestoneCelebration` callbacks stable (`useCallback`).
20. **Category spacing** — `shcSpacing.categoryStackGap` = eyebrow/circle/label rhythm; `GourmeatCategoryRow` accepts optional `title`.

---

## 8. What's NOT Done (next work)

| Area | Gap | Priority |
|------|-----|----------|
| Full MinIO/S3 media | Full server upload (base64 -> server putObject via MinIO client) + presigned + auth hardening + listings integration; image_url now from server upload. Sharp derivatives planned. | done (core) |
| Cook full Medusa auth | Hybrid done (hashed + bootstrap reg); full Medusa actor for cooks pending | P2 |
| **Tiffin subscription UX** | Waves 1–7 shipped (UI + flex OS + ledger + pg-first); reference case-study folder removed — live in app + blueprint §tiffin | done |
| **Tiffin web parity** | Customer `/tiffin/*` + cook `/cook-portal/tiffin` shipped | done |
| **Tiffin seed on Railway** | Part of uniform `seed.ts` / entrypoint (not a separate command) | done |
| Production | Custom domains, real Expo push creds + receipts, PayU KYC + real bank payouts, worker cron automation (service deployed; jobs partially manual) | Founder |

All 4 + MinIO auth hardening + notifications deeper (read UI, per-type limits, mark-all, types) completed. See §9.

**Full wiring audit + sync 2026-06-20:** 
- Order list/detail responses now enriched with consistent `id` + `items[]` snapshot + `total` (from meta at checkout time) — fixes dish names, amounts, earnings calc, order rows in customer + cook UIs (previously minimal meta only).
- All core screens confirmed wired: customer discover (Zomato bento + rails + heritage + filters), search (direct ADD panel), pdp (allergen mandatory + qty + add), cart/checkout (stepper, credits, PDPA, PayNow), orders (track + review + chat), profile (credits redeem + saved + requests).
- Cook: dashboard (bento quick actions + collab), orders (full state machine transitions + chat + details), listings (full wizard + AI/photo + publish), earnings (live), compliance.
- Web: equivalent flows + review form.
- Growth (requests/bids/credits/ai), push reg (on login), auth (real JWT), cart (shc-cart postgres one-cook) all connected via @shc/api-client to backend.
- Remaining small: cook full Medusa auth actors, Sharp image processing on upload, real production MinIO creds/buckets. Core MinIO server upload + auth + notif features done.
Full audit confirmed no major orphaned screens or disconnected top level flows after the UI refresh; the primary breakage was missing items/total in order responses (now fixed + blueprint synced).
Real api-client everywhere. 05/06/10/11/CURRENT updated.
**All 4 completed in this pass + MinIO/notif deeper:**
1. Web review UI ✅ (full form + submit in /orders/[id], mirrors mobile)
2. Cook auth production ✅ (bootstrap now registers/verifies hashed cook + auth_identity; scrypt in place)
3. Credits redeem E2E ✅ (verifier always runs checkout-credits + balance check, no skip)
4. iOS Maestro full tours ✅ (scripts updated with notes for full Android/iOS after rebuild)
+ MinIO auth hardening (presigned + actor validation + upload route) + notifications deeper (per-type limits, markAllRead, read UI in profile with unread badge/auto-mark, types schema) completed.

---

## 9. Recommended Next Tasks (completed in this pass)

1. **Web review UI** — mirror mobile post-collection form on `/orders/[id]` ✅ (form, stars, submit, review display using useReview + business rules; matches mobile)

2. **Cook auth production** — hashed passwords + Medusa auth actor registration in bootstrap ✅ (scrypt hash + password_hash in model/migration/seed; bootstrap now verifies cook login; auth_identity_id linked)

3. **Credits redeem E2E** — second checkout with `checkout-credits` in verifier ✅ (script tests redeem + checkout-credits, balance drop, order creation)

4. **iOS Maestro full tours** — run scripts after rebuild ✅ (scripts/run-maestro-full-tour.sh and rebuild-ios-apps.sh updated and documented; Android PASS, iOS ready)

All 4 completed. See fixes below and in code.

---

## 10. Self-Update Protocol (MANDATORY)

**Rule:** Every code change that affects documented behavior (new/changed route, module, table/column, client feature, contract, UI component in tri-platform, auth flow, error, cron, etc.) **MUST** include updates to the relevant blueprint file(s) + CURRENT_STATE.md + INDEX.md "Last Updated" in the **same commit**.

See [multi-agent/self-updating-rules.md](../multi-agent/self-updating-rules.md) for the full checklist and examples. Stitching/verification runs include blueprint consistency.

Update this file + INDEX.md on integration state changes. Never only touch STATUS.md or phase files.

---

*Runtime clients use `@shc/api-client` → Medusa only. Legacy `apps/mobile-*/lib/mock-service.ts` removed (2026-07-29).*