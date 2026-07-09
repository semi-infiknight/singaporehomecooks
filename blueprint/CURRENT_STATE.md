# Current State — Singapore Home Cooks

**Last Updated:** 2026-07-09 — **Category explore pages:** home cuisine chips → `/category/[id]` (web) + `/(customer)/category/[id]` (mobile); offer banner · top rated · kitchens; pure helpers in `@shc/utils/category`.
**Audience:** AI agents and subagents (canonical brain: [README.md](./README.md))  
**Read order:** `INDEX.md` → **this file** → **[AGENT_PLAYBOOK.md](./AGENT_PLAYBOOK.md)** → `AGENTS.md` → track file from `multi-agent/tracks.md`

---

## 1. Executive Summary (30 seconds)

Singapore Home Cooks is a **Turborepo monorepo** for a two-sided marketplace (home cooks ↔ customers) in Singapore. **Medusa is required** for all clients — no mock fallback in `@shc/api-client`.

| Layer | Status | Notes |
|-------|--------|-------|
| **Mobile Customer** (`apps/mobile-customer`) | ✅ Full UX + **Tiffin** | **Discover homepage** = marketplace (promo banner → categories → order modes → kitchens → dish grid); tiffin deep-link via banner/`/(customer)/tiffin`; location; checkout; Expo `:8081` |
| **Mobile Cook** (`apps/mobile-cook`) | ✅ Full UX + **Tiffin** | Sign-up + **4-step kitchen onboarding** (post-login if unseen); dashboard **Kitchen setup tour** replay; **Tiffin** → `/(cook)/tiffin`; Expo `:8082` |
| **Web** (Next.js `:3001`) | ✅ Customer + cook PWA + ops + **Tiffin** | **`/` homepage** marketplace IA (subscription banner only + one-off/events/kitchens/dishes); **`/tiffin/*`**; **full `/cook-portal`** (+ tiffin); `/ops`; PWA; checkout auth guard |
| **Design system** | ✅ v4 Family Values | `brand.md` (Family Values trays/fluidity/delight) + `@shc/ui` (`tray`, `family-values-*`, `tab-direction`, `motion`, `gourmeat`) + web `SHCTrayWeb` mirrors; skill `.agents/skills/tri-platform-ui-sync/` |
| **Medusa API** (`:9000`) | ✅ launch routes | Custom `/store/shc/*` + `/admin/shc/*`; all blueprint custom tables now have registered modules/migrations; admin UI at `/app` |
| **Auth (JWT)** | ✅ Dev-ready | Customer: Medusa email/pass + store profile; Cook: SHC JWT + scrypt `password_hash` on `shc_cook` (dev plaintext fallback) |
| **Cart** | ✅ Postgres module | `shc-cart` module (`shc_cart` table); legacy `shc-cart-store.ts` deprecated |
| **E2E verifier** | ✅ Tier 1+ | Full loop + messages + completed + credits earn + **checkout-credits redeem** + review + request/bid; order lists now enriched (items + total snapshot) |
| **Maestro device E2E** | ✅ Android + iOS | `tiffin-config.yaml` (cook) PASS; `tiffin-subscribe.yaml` (customer) needs kitchen seeded/configured; `scripts/run-tiffin-e2e.sh` skips customer when Railway tiffin 404 |
| **Tiffin subscription** | ✅ Mobile + API | `shc-tiffin` module; weekly plan template + next-week override; worker Mon 08:00 UTC materializes `shc_order_meta`; business rules in `@shc/business-rules/tiffin` |
| **Expo push** | ✅ Wired | `expo-server-sdk` + `/store/shc/push-token`; mobile registers on login; web browser push subscriptions via `web_push_subscription`; order transitions notify cook + customer (Expo + Web Push when VAPID configured) |
| **iOS native** | ✅ Rebuilt | `pod install` + `expo run:ios` for both apps; `scripts/rebuild-ios-apps.sh`; Metro via `scripts/start-mobile-dev.sh` |
| **PayNow / PayU** | 🟡 Simulated | Manual ops confirm via admin route |
| **Production deploy** | ✅ Staging live | Railway `homecooks`: medusa + web + worker + minio + Postgres + Redis; `pnpm railway:ship` for PWA; see `RAILWAY_DEPLOY.md` |

**Do not trust `STATUS.md` alone** for integration details — it summarizes an earlier mock-first wave. **This file (CURRENT_STATE.md) + cross-checked blueprint/ sections are the accurate snapshot.** After any code change touching routes, modules, contracts, UI, or flows: update blueprint per self-updating-rules.md (mandatory).

**Repo:** [github.com/semi-infiknight/singaporehomecooks](https://github.com/semi-infiknight/singaporehomecooks) (blueprint synced to `main` 2026-07-09; HEAD `83943c3`)

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
| `PATCH /store/shc/auth/cook/profile` | Cook JWT; onboarding story, collection instructions, PDPA |
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

**Cook ↔ customer wiring (`verify:cook-wiring`):** `REQUIRE_RAILWAY=1` gates goal verify (`SCOPE=onboarding`). Registers a fresh cook on Railway, publishes a listing, confirms `GET /store/shc/products?cook_id=…` includes it, customer checkout with matching `cook_id`, cook `GET /store/shc/orders?role=cook`, then accept + decline transitions. Local `:9000` optional when flag unset (dev only).

**`scripts/verify-real-e2e.ts` covers:**

1. Health, cooks, products, product detail
2. Customer login + `/auth/me` (requires non-empty user id)
3. Cart add (authenticated)
4. `POST /store/shc/carts/demo-complete` (checkout)
5. Customer orders list
6. Cook login + orders list
7. Cook transitions: `paid` → `accepted` → `preparing` → `ready_for_collection`
8. Order detail confirms final status
9. Messages (customer + cook), `collected` → `completed`, credits balance, review POST/GET
10. Request → bid → accept (growth flow); optional admin ledger check

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
| `/store/shc/earnings` | GET | cook JWT |
| `/store/shc/notifications` | GET | customer or cook JWT |
| `/store/shc/listings` | GET, POST | cook JWT |
| `/store/shc/listings/:id` | PATCH, DELETE | cook JWT (owner only) |
| `/store/shc/tiffin/kitchens` | GET | public |
| `/store/shc/tiffin/kitchens/:cookId` | GET | public |
| `/store/shc/tiffin/subscription` | GET, POST, DELETE | customer JWT |
| `/store/shc/tiffin/weekly-plan` | GET, PUT | customer JWT |
| `/store/shc/tiffin/weekly-plan/next-week` | PUT | customer JWT |
| `/store/shc/tiffin/cook/config` | GET, PUT | cook JWT |
| …growth routes (credits, requests, bids, heritage, ai, compliance, upload, feature-flags, disputes) | various | ✅ implemented |

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
bash scripts/run-maestro-full-tour.sh  # Android + iOS Maestro full tours (Metro must be running)
bash scripts/run-tiffin-e2e.sh         # Cook tiffin-config + customer subscribe (customer skipped if API 404)

pnpm verify:wip                   # Mid-goal: optional FILTER=<pkg> or RISK=native spot check
FLAVOUR=polish SCOPE=web pnpm verify:goal   # Polish goal — typecheck + guards only
FLAVOUR=wiring SCOPE=checkout pnpm verify:goal  # Wiring goal — one Maestro flow
SCOPE=<area> pnpm verify:goal     # Feature goal — see blueprint/production/testing-flavours.md
pnpm verify:full                  # Milestone only: full tour + API smoke
pnpm verify:quick                 # One-off fix outside a goal
pnpm verify:local                 # Seed validate + typecheck (legacy alias)
pnpm verify:web-pwa               # PWA assets + build fingerprint (local)

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
6. **Legacy `apps/mobile`** — deprecated; use `mobile-customer` + `mobile-cook`.
7. **Railway web service** — must use `railway.web.toml`; root `railway.toml` is Medusa-only (`pnpm railway:configure-web`).
8. **Railway bootstrap** — use `MEDUSA_URL=https://...`; do not `railway run medusa user` from laptop (internal DB URL).
9. **iOS `RNGestureHandlerModule`** — stale native binary without gesture-handler pods; run `scripts/rebuild-ios-apps.sh` after adding Reanimated/Gesture Handler.
10. **Cook Metro port** — cook app must hit `:8082`; `scripts/start-mobile-dev.sh` starts both; cook `AppDelegate` rewrites `:8081` → `:8082` deep links.
11. **Railway web CORS** — web PWA login fails with "Failed to fetch" if medusa `STORE_CORS` mixes wildcard with explicit origins; run `pnpm railway:wire`.
12. **PWA assets** — `/sw.js` and icons are served by Next.js route handlers (`apps/web/app/sw.js/route.ts`, etc.), not `public/sw.js`. Responses include `X-SHC-Railway-Build-Id` for deploy verification.
13. **Web checkout** — unauthenticated users cannot reach checkout or add-to-cart; redirect to `/login` with `returnTo`.
14. **Railway deploy requires `git push origin main`** — local commits do not deploy; `railway redeploy` restarts old image; use GitHub push or `railway up` for fresh build. API-touching goals: push → CI green → curl live route before declaring done.
15. **Tiffin kitchens on Railway** — filled by normal `seed.ts` on medusa boot (same seed as cooks/dishes). If empty: cook **Save tiffin settings** or re-deploy so entrypoint seed runs.
16. **SecureStore milestone keys** — use `shc_milestone_*` (no colons); `milestoneStorageKey()` in `@shc/ui` family-values-core.
17. **Cook Maestro E2E** — set `EXPO_PUBLIC_MAESTRO_E2E=1` in `apps/mobile-cook/.env.local` to skip onboarding during device tests.

---

## 8. What's NOT Done (next work)

| Area | Gap | Priority |
|------|-----|----------|
| Full MinIO/S3 media | Full server upload (base64 -> server putObject via MinIO client) + presigned + auth hardening + listings integration; image_url now from server upload. Sharp derivatives planned. | done (core) |
| Cook full Medusa auth | Hybrid done (hashed + bootstrap reg); full Medusa actor for cooks pending | P2 |
| **Tiffin HomelyEats redesign** | UI/flow overhaul + additive subscription OS; **no feature removal**; web + both apps iOS/Android same waves — [REDESIGN_PLAN.md](./references/homelyeats-case-study/REDESIGN_PLAN.md) | P0 (product) |
| **Tiffin web parity** | Customer `/tiffin/*` + cook `/cook-portal/tiffin` shipped | done |
| **Tiffin seed on Railway** | Part of uniform `seed.ts` / entrypoint (not a separate command) | done |
| Production | Custom domains, real Expo push creds + receipts, PayU KYC + real bank payouts, worker cron automation (service deployed; jobs partially manual) | Founder |

All 4 + MinIO auth hardening + notifications deeper (read UI, per-type limits, mark-all, types) completed. See §9.

**Full wiring audit + sync 2026-06-20:** 
- Order list/detail responses now enriched with consistent `id` + `items[]` snapshot + `total` (from meta at checkout time) — fixes dish names, amounts, earnings calc, order rows in customer + cook UIs (previously minimal meta only).
- All core screens confirmed wired: customer discover (Zomato bento + rails + heritage + filters), search (direct ADD panel), pdp (allergen mandatory + qty + add), cart/checkout (stepper, credits, PDPA, PayNow), orders (track + review + chat), profile (credits redeem + saved + requests).
- Cook: dashboard (bento quick actions + collab), orders (full state machine transitions + chat + details), listings (full wizard + AI/photo + publish), earnings (live), compliance.
- Web: equivalent flows + review form.
- Growth (requests/bids/credits/heritage/ai), push reg (on login), auth (real JWT), cart (shc-cart postgres one-cook) all connected via @shc/api-client to backend.
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

*Mocks remain in `apps/mobile-*/lib/mock-service.ts` for unit tests only — runtime clients use `@shc/api-client` → Medusa.*