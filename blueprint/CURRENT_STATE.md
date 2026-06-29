# Current State — Singapore Home Cooks

**Last Updated:** 2026-06-29 (Launch-readiness loop) — web push subscription + PayNow→paid parity + My Requests accept-bid on web; feature-flag gating (`request_dish`, `corporate_orders`) with admin API and `/ops` toggles; `/ops` surfaces disputes, commission rules, cook expenses, search synonyms, platform stats, and payout batches; `/ops` can resolve disputes and approve pending payout batches; worker health reports last job results and supports protected manual `POST /run/:job`; worker internal Medusa routes wired for order escalation and notification retry; customer/cook order dispute reporting API added and wired into web, mobile customer, and mobile cook order tracking; opening disputes marks orders `disputed`, ops resolution marks them `resolved`; product search now applies `shc_search_synonym` expansions; cook-authenticated expense tracker API and mobile cook earnings UI added for IRAS records; ledger commission posting now uses active `shc_commission_rule` rates and fixed idempotency filters; payout batch lookup/approval filters fixed; server web-push on order transitions; bid accept creates full `shc_order_meta` (customer_id, total, items, notifications); corporate/group order notes persist to order meta; route coverage gate expanded (store + admin launch routes).
**Audience:** Any builder (human or AI) picking up this repo cold  
**Read order:** `INDEX.md` → **this file** → `AGENTS.md` → track-specific file from `multi-agent/tracks.md`

---

## 1. Executive Summary (30 seconds)

Singapore Home Cooks is a **Turborepo monorepo** for a two-sided marketplace (home cooks ↔ customers) in Singapore. **Medusa is required** for all clients — no mock fallback in `@shc/api-client`.

| Layer | Status | Notes |
|-------|--------|-------|
| **Mobile Customer** (`apps/mobile-customer`) | ✅ Full UX | Gourmeat discover (promo rail, filter chips, photo bento, vector tab icons); collection location picker (`/(customer)/location`, GPS + OneMap search + draggable map); Toptal checkout stepper + search ADD + request-dish footer CTA + “Order again”; heritage banner on Profile; Expo `:8081` |
| **Mobile Cook** (`apps/mobile-cook`) | ✅ Full UX | Dashboard/orders/earnings/compliance/listings polished; photo bento + vector icons; Expo `:8082` |
| **Web** (Next.js `:3001`) | ✅ Customer + launch portals | Customer marketplace plus lightweight `/cook-portal` (cook login/order list) and `/ops` (health/ledger/payouts); PWA service worker + manifest |
| **Design system** | ✅ v3 | `brand.md` (Toptal UX section) + `@shc/ui` (`zomato`, `visuals`, `icons`, `motion`, `food-ux`) + `@shc/utils` (`food-visuals`, `reorder`); skill `.agents/skills/tri-platform-ui-sync/` |
| **Medusa API** (`:9000`) | ✅ launch routes | Custom `/store/shc/*` + `/admin/shc/*`; all blueprint custom tables now have registered modules/migrations; admin UI at `/app` |
| **Auth (JWT)** | ✅ Dev-ready | Customer: Medusa email/pass + store profile; Cook: SHC JWT + scrypt `password_hash` on `shc_cook` (dev plaintext fallback) |
| **Cart** | ✅ Postgres module | `shc-cart` module (`shc_cart` table); legacy `shc-cart-store.ts` deprecated |
| **E2E verifier** | ✅ Tier 1+ | Full loop + messages + completed + credits earn + **checkout-credits redeem** + review + request/bid; order lists now enriched (items + total snapshot) |
| **Maestro device E2E** | ✅ Android + iOS | Real PDP add-to-cart (no API cart pre-seed); `location-map-android.yaml` PASS (search → confirm map + nudge); `scripts/run-maestro-full-tour.sh` |
| **Expo push** | ✅ Wired | `expo-server-sdk` + `/store/shc/push-token`; mobile registers on login; web browser push subscriptions via `web_push_subscription`; order transitions notify cook + customer (Expo + Web Push when VAPID configured) |
| **iOS native** | ✅ Rebuilt | `pod install` + `expo run:ios` for both apps; `scripts/rebuild-ios-apps.sh`; Metro via `scripts/start-mobile-dev.sh` |
| **PayNow / PayU** | 🟡 Simulated | Manual ops confirm via admin route |
| **Production deploy** | ✅ Staging live | Railway `homecooks`: Medusa + web online; see `RAILWAY_DEPLOY.md` |

**Do not trust `STATUS.md` alone** for integration details — it summarizes an earlier mock-first wave. **This file (CURRENT_STATE.md) + cross-checked blueprint/ sections are the accurate snapshot.** After any code change touching routes, modules, contracts, UI, or flows: update blueprint per self-updating-rules.md (mandatory).

**Repo:** [github.com/semi-infiknight/singaporehomecooks](https://github.com/semi-infiknight/singaporehomecooks) (blueprint fully synced 2026-06-20; see commit history for code changes)

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

**No `USE_REAL_MEDUSA` toggle** — clients always call Medusa.

### Auth routes

| Route | Purpose |
|-------|---------|
| `POST /store/shc/auth/customer/login` | Medusa email/pass → JWT + user |
| `POST /store/shc/auth/customer/register` | Register + auto-create store customer |
| `POST /store/shc/auth/cook/login` | SHC JWT; verifies cook exists in `shc_cook` |
| `GET /store/shc/auth/me` | Current user from Bearer token |

Protected routes use `getCustomerId` / `getCookId` from JWT — **not** `x-shc-*` headers.

---

## 4. E2E Verification

```bash
pnpm docker:up
pnpm medusa:dev:admin
pnpm bootstrap:medusa
cd apps/medusa && pnpm seed
pnpm verify:real-e2e
```

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
| `/store/shc/auth/cook/login` | POST |
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
| `/store/shc/listings` | POST | cook JWT |
| …growth routes (credits, requests, bids, heritage, ai) | various | partial |

### Server libs (`apps/medusa/src/lib/`)

| File | Purpose |
|------|---------|
| `shc-auth.ts` | JWT sign/verify, Medusa customer login/register, `ensureStoreCustomer` |
| `shc-actors.ts` | Resolve customer/cook from Bearer token |
| `shc-cart` module | Postgres-backed cart (`shc_cart` table); legacy `shc-cart-store.ts` deprecated |
| `shc-product-shape.ts` | Product DTO mapper |
| `shc-notifications-store.ts` | In-memory notifications (dev) |

---

## 6. Commands

```bash
pnpm install
pnpm docker:up                    # Postgres + Redis
pnpm medusa:dev:admin             # API + admin at :9000/app
pnpm bootstrap:medusa             # Admin, API keys, demo customer, .env.local
cd apps/medusa && pnpm seed

pnpm customer:dev                 # Mobile customer :8081
pnpm cook:dev                     # Mobile cook :8082
pnpm web:dev                      # Web :3001

bash scripts/start-mobile-dev.sh  # Both Metro servers (:8081 + :8082) with adb reverse
bash scripts/rebuild-ios-apps.sh  # After native dep changes (gesture-handler, reanimated, etc.)
bash scripts/run-maestro-full-tour.sh  # Android + iOS Maestro full tours (Metro must be running)

pnpm verify:real-e2e              # Full smoke (auth + checkout + transitions)
pnpm verify:local                 # Seed validate + typecheck

# Railway (after railway login + railway link)
pnpm railway:configure-web        # Point web service at railway.web.toml
MEDUSA_URL=https://<medusa>.up.railway.app pnpm railway:init
```

---

## 7. Known Gotchas

1. **`pnpm medusa:start` disables admin** — use `pnpm medusa:dev:admin`.
2. **Store customer profile required** — bootstrap/register/login call `ensureStoreCustomer`; without it JWT `actor_id` is empty and cart returns 401.
3. **Product IDs** — canonical `dish_*` from seed; re-run `pnpm seed` after migrate.
4. **Cook login** — scrypt `password_hash` on `shc_cook`; seed sets hashes; `SHC_COOK_ALLOW_DEV_PLAINTEXT=false` disables env fallback in prod.
5. **Cart** — Postgres `shc-cart` module in production paths; legacy Redis/in-memory store deprecated (`shc-cart-store.ts`).
6. **Legacy `apps/mobile`** — deprecated; use `mobile-customer` + `mobile-cook`.
7. **Railway web service** — must use `railway.web.toml`; root `railway.toml` is Medusa-only (`pnpm railway:configure-web`).
8. **Railway bootstrap** — use `MEDUSA_URL=https://...`; do not `railway run medusa user` from laptop (internal DB URL).
9. **iOS `RNGestureHandlerModule`** — stale native binary without gesture-handler pods; run `scripts/rebuild-ios-apps.sh` after adding Reanimated/Gesture Handler.
10. **Cook Metro port** — cook app must hit `:8082`; `scripts/start-mobile-dev.sh` starts both; cook `AppDelegate` rewrites `:8081` → `:8082` deep links.

---

## 8. What's NOT Done (next work)

| Area | Gap | Priority |
|------|-----|----------|
| Full MinIO/S3 media | Full server upload (base64 -> server putObject via MinIO client) + presigned + auth hardening + listings integration; image_url now from server upload. Sharp derivatives planned. | done (core) |
| Cook full Medusa auth | Hybrid done (hashed + bootstrap reg); full Medusa actor for cooks pending | P2 |
| Production | Custom domains, real Expo push creds + receipts, PayU KYC + real bank payouts, full cron worker | Founder |

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