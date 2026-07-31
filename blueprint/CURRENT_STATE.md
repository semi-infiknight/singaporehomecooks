# Current State — Singapore Home Cooks

**Last updated:** 2026-07-31 (batch merge: platform gaps, P2 hardening, weekly payouts, custom-request E2E, settlement invoice gate)  
**Branch:** `main` (work here only; no feature branches unless asked)  
**Authority:** This file is the live integration snapshot. On conflict: `blueprint/` wins over `.cursor/rules/`, skills, and root `STATUS.md`.

---

## 0. Cold start (agents)

```bash
git pull origin main
pnpm install                    # postinstall → pnpm env:sync → *.env.local
bash scripts/start-mobile-dev.sh   # Metro :8081 customer, :8082 cook → Railway API
pnpm web:dev                    # Next.js :3001 → Railway API
```

| Item | Value |
|------|--------|
| **Live API** | `https://medusa-production-d2ba.up.railway.app` (`config/railway-client.json`) |
| **Admin UI** | `{medusaBase}/app` · SHC Ops at `/app/shc-ops` |
| **Staging demo accounts** | `customer@shc.local` / `customersecret` · `rose@shc.local` / `cooksecret` (seed/bootstrap only) |
| **Production sign-up** | Real email + password (8+ chars, letter + number) via **Create account** on web/mobile; `@shc.local` blocked on register |
| **Admin** | `admin@shc.local` / `supersecret` (staging bootstrap) |
| **Read next** | [INDEX.md](./INDEX.md) → [AGENT_PLAYBOOK.md](./AGENT_PLAYBOOK.md) → task section file |

**Clients never use localhost Medusa.** `resolveRailwayMedusaBase()` throws on `127.0.0.1` / `localhost:9000`. Local `:9000` is backend-dev only when explicitly editing `apps/medusa`.

---

## 1. Product (30 seconds)

Turborepo marketplace: **home cooks ↔ customers** in Singapore. HDB collection + HitPay PayNow (sandbox). Three clients + one Railway Medusa backend. Runtime data path: **screen → hook → `@shc/api-client` → `/store/shc/*`** — no in-app mocks (`apps/mobile-*/lib/mock-service.ts` removed 2026-07-29).

| Surface | Path | Port / deploy |
|---------|------|----------------|
| Mobile customer | `apps/mobile-customer` | Metro `:8081` |
| Mobile cook | `apps/mobile-cook` | Metro `:8082` |
| Web PWA | `apps/web` | `:3001` dev · Railway `web` service prod |
| API | `apps/medusa` | Railway `medusa` service |
| Worker | `apps/worker` | Railway cron (tiffin weekly orders Mon 08:00 UTC) |

---

## 2. Repository map

| Path | Role |
|------|------|
| `packages/shc-api-client` | Medusa HTTP client; throws `ShcRequestError` + `SHCErrorCode` |
| `packages/shc-types` | Zod schemas / DTO contracts |
| `packages/shc-utils` | Pure helpers: discover, location, checkout-collection, cook-earnings, customer-browse-config, … |
| `packages/shc-ui` | RN design system; web mirrors in `apps/web/app/components/SHCWebComponents.tsx` |
| `packages/business-rules` | Order state machine, tiffin rules, commission helpers |
| `apps/medusa/src/api/store/shc/` | Store routes (customer + cook JWT) |
| `apps/medusa/src/api/admin/shc/` | Admin / SHC Ops routes |
| `apps/medusa/src/modules/` | `shc-cart`, `shc-order-meta`, `shc-tiffin`, `shc-ledger`, … |
| `brand.md` | Neo-Brutalist / Peach Comfort tokens (tri-platform source with `theme.ts` + `globals.css`) |
| `scripts/verify-tier.sh` | `verify:wip` · `verify:goal` · `verify:full` · `verify:ci` |
| `.cursor/rules/` | IDE mirrors — must match blueprint |

---

## 3. Integration rules

### Env (written by `pnpm env:sync`)

| App | File | Vars |
|-----|------|------|
| mobile-customer | `apps/mobile-customer/.env.local` | `EXPO_PUBLIC_MEDUSA_BASE`, `EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY` |
| mobile-cook | `apps/mobile-cook/.env.local` | same |
| web | `apps/web/.env.local` | `NEXT_PUBLIC_SHC_API_BASE`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` |

### Auth

| Actor | Mechanism | Key routes |
|-------|-----------|------------|
| Customer | Medusa email/pass JWT; `ensureStoreCustomer` required for cart | `POST …/auth/customer/login|register`, `GET …/auth/me` |
| Cook | SHC JWT + scrypt `password_hash` on `shc_cook` | `POST …/auth/cook/login|register`, `PATCH …/auth/cook/profile` |
| Admin | Medusa admin session | `/app`, `/app/shc-ops/*` |

Protected store routes resolve identity from **Bearer JWT** (`getCustomerId` / `getCookId`) — not `x-shc-*` headers.

Web: customer checkout/PDP gated (`/login?returnTo=…`); cook portal uses separate `useCookAuth` + `cook-api-client.ts` under `/cook-portal/*`.

### Client state (must-use patterns)

| Concern | Implementation | Pitfall |
|---------|----------------|---------|
| Collection location | `CustomerLocationProvider` in `apps/mobile-customer/app/(customer)/_layout.tsx`; hook `hooks/useCustomerLocation.ts`; SecureStore key `shc_customer_location_v1` | Per-screen hook instances **do not** sync after picker — always use provider |
| Browse chrome | `useCustomerConfig()` → `GET /store/shc/customer-config`; defaults in `@shc/utils/customer-browse-config` | Do not prepend `{ id: '', label: 'All' }` — API already includes All via `customerMindCategories()` |
| Cook portal chrome | `useCookConfig()` → store + admin config | |
| Business rules | `useBusinessRules()` (cook + web) | Commission on earnings + listing preview |
| Cart pay CTA | `computeOneTimeOrderSummary().proceedLabel` = `"Proceed to pay"`; price only in `GourmeatPayButton.amount` | Embedding price in both props duplicates total |

### CORS (Railway)

`STORE_CORS` and `AUTH_CORS` must be **explicit origins** — never mix `*` with named origins. After env changes: `pnpm railway:wire`.

---

## 4. Feature inventory (shipped on `main`)

### Customer discover (`apps/mobile-customer/app/(customer)/index.tsx`)

- Composition: `@shc/utils` `discoverSections()` — promo carousel → cooking soon (7-day drops) → for-you rail → **Dishes | Kitchens** + **Occasions** nav → mode content → request CTA.
- Filters: `SHCDiscoverFilterSheet` in `@shc/ui/gourmeat.tsx` via `SHCTrayProvider`; `filterDiscoverProducts()` in utils.
- Occasions: dedicated `/(customer)/occasions` (not inline mode); `occasionBrowseRoute()`.
- Location: proximity sort on dishes + kitchens when lat/lng set; `SHCLocationNudgeBanner` when unset; header chip → `/(customer)/location`.
- Honest ratings: `coerceRating()` — no fabricated 4.8/24; discounts only when API sends percent.

### Location & checkout

- Picker: `LocationPickerExperience` (`@shc/ui/location-ux`); SG quick-pick areas; map confirm on iOS (`react-native-maps`) / Android Carto tiles.
- Checkout pre-fill: `checkoutCollectionPrefill()`; place-order requires location.
- Order snapshot: `POST /store/shc/carts/demo-complete` writes `customer_collection_*` on `shc_order_meta` (migration `Migration20260727180000OrderMetaCustomerCollection`, deployed Railway 2026-07-29).

### Cook app

- Tabs: dashboard, orders, listings, compliance (+ hidden settings, batches, tiffin, earnings, order detail).
- **Dashboard:** bento quick actions + Collaboration Board link → Orders tab; **no** inline “chat on latest order” CTA (chat from order detail only).
- **Listings tab** — nested stack (`listings/_layout.tsx`):
  - `listings/index` — dish list, search/filters, **+** (upper-right, `create-listings-btn`) → new wizard; long-press → `SHCTray` actions (`height: medium`).
  - `listings/new` — 4-step wizard (`components/CookListingWizardScreen.tsx`); **empty form** (no demo prefills); deep link `?wizardStep=1–4`.
  - `listings/[id]` — edit wizard (prefilled from API).
- Settings: pause, collection address/instructions/**time slots**, avatar/hero upload; `SHCCookAreaPicker` + `@shc/utils/sg-areas.ts`.
- Listings API: `@shc/ui/listing-form` + product meta; PATCH/DELETE `/store/shc/listings/:id`.
- Earnings: `GET /store/shc/earnings` ledger-backed; **payout status** (last/next PayNow, setup CTA) + **payout history** (`GET /store/shc/payouts/history`); UI `@shc/ui/cook-earnings.tsx` + web mirrors; weekly batch script `apps/medusa/scripts/weekly-payout.ts`.
- Orders: accept/decline on `paid`; compliance gate for accept; **cook settlement PDF** only after `accepted` (provisional until `collected`); decline/dispute trays Maestro-covered.
- **Layout:** single `settings` tab screen in `(cook)/_layout.tsx` (duplicate entry removed 2026-07-29).

### Admin / SHC Ops (`/app/shc-ops`)

Platform config in `shc_platform_stat` (no migration):

| Key | Purpose |
|-----|---------|
| `customer_browse_config` | Categories, occasions, copy, meal chips, discover modes |
| `discover_promos` | Home promo carousel slides |
| `business_rules_config` | Commission, drops window, cart policy, review rules |
| `cook_portal_config` | Dashboard tiles, greetings, allergen presets, chat quick replies |

SHC Ops: Recharts all pages; `GET /admin/shc/charts`; poll 30–45s + tab-focus refetch (`shc-ops-polling.ts`).

### Tiffin

- Routes: `/store/shc/tiffin/*`; modules `shc-tiffin`, ledger in `shc_tiffin_ledger`.
- Customer: `apps/mobile-customer/app/(customer)/tiffin/*` + web `/tiffin/*`.
- Cook: `apps/mobile-cook/app/(cook)/tiffin/` + web `/cook-portal/tiffin`.
- Recharge: HitPay `POST …/subscription/recharge/paynow` + webhook.

### Custom requests (v2 — Phases 1–4 shipped)

- Multi-dish wizard (`items[]`), per-line cook quotes (`line_items[]`), partial accept, sibling decline, PayNow on accept.
- Mobile Maestro: `pnpm e2e:custom-request` · API smoke: `pnpm verify:real-e2e` (v2 path) · Web Playwright: `pnpm e2e:custom-request-web`.
- Spec: [07-custom-requests/custom-requests-v2.md](./07-custom-requests/custom-requests-v2.md).

### Payments

HitPay sandbox only (`HITPAY_ENV=sandbox`). Webhook: `/hooks/shc/hitpay`. QR fetch once per order/recharge session. **Weekly cook payouts MVP:** `weekly-payout.ts` aggregates ledger → `shc_payout_batch` + lines; cook earnings UI shows last/next payout + history. Live KYC / real bank: **not done**.

### Platform hardening (P2)

- Redis-backed rate limiting on `/store/shc/*` + auth/login/register buckets.
- Structured worker logs + PagerDuty on job failures; client crash reporting (`POST /store/shc/ops/client-crash`).
- Image derivatives: 1200 hero + 400 thumb on upload finalize; `shapeProduct` resolution.

---

## 5. API quick index

Full spec: [06-api-surface/06-api-surface.md](./06-api-surface/06-api-surface.md). File map: `apps/medusa/src/api/store/shc/`, `…/admin/shc/`.

| Area | Store routes (representative) |
|------|-----------------------------|
| Auth | `…/auth/customer/*`, `…/auth/cook/*`, `…/auth/me` |
| Browse | `…/products`, `…/cooks`, `…/customer-config`, `…/discover-promos`, `…/drops` |
| Cart/orders | `…/cart`, `…/carts/demo-complete`, `…/orders`, `…/orders/:id/transition` |
| Cook | `…/listings`, `…/earnings`, `…/tiffin/cook/config`, `…/ai/image` |
| Growth | requests, bids, compliance upload, disputes, notifications |

Admin smoke: `pnpm smoke:admin-ops` round-trips config keys above.

---

## 6. Verification

| When | Command |
|------|---------|
| Mid-goal spot check | `FILTER=@shc/ui pnpm verify:wip` |
| Goal done (default) | `FLAVOUR=feature SCOPE=<area> pnpm verify:goal` |
| UI polish only | `FLAVOUR=polish SCOPE=web pnpm verify:goal` |
| Wired flow | `FLAVOUR=wiring SCOPE=<flow> pnpm verify:goal` |
| Tri-platform UI | `FLAVOUR=tri-platform SCOPE=tray pnpm verify:goal` |
| Pre-push CI mirror | `pnpm verify:ci` |
| API smoke (slow) | `pnpm verify:real-e2e` (includes custom requests v2) |
| Custom request web E2E | `pnpm e2e:custom-request-web` |
| Order invoice smoke | `pnpm exec tsx scripts/smoke-order-invoice.ts` |
| Cook register→order | `REQUIRE_RAILWAY=1 pnpm verify:cook-wiring` |
| Discover/location wave (sim) | `pnpm e2e:ecfdc8-wave` |
| Tiffin | `pnpm e2e:tiffin` · `pnpm smoke:tiffin` |
| Admin config | `pnpm smoke:admin-ops` |

Flavours + experience ledger: [production/testing-flavours.md](./production/testing-flavours.md).

---

## 7. Dev commands

```bash
pnpm ios:dev              # Metro daemon + boot sim + both apps
pnpm customer:reload      # hot reload customer after JS edits
pnpm cook:reload
METRO_CLEAR=1 pnpm ios:dev   # stale Metro after pnpm install

pnpm bootstrap:medusa     # refresh Railway publishable key + demo customer
pnpm seed:medusa          # demo cooks/dishes/tiffin (Railway entrypoint on deploy)

bash scripts/rebuild-ios-apps.sh      # after native dep changes
bash scripts/run-maestro-full-tour.sh # milestone E2E only
pnpm railway:ship                     # PWA deploy + fingerprint
```

---

## 8. Gotchas (agent mistakes)

1. **Railway-only clients** — never `localhost:9000` in client env.
2. **JWT `actor_id` empty** → cart 401; run bootstrap or register flow with `ensureStoreCustomer`.
3. **Location stale on discover** → missing `CustomerLocationProvider` wrapper.
4. **Duplicate React key `.$all`** → duplicate All cuisine row or `key={id \|\| 'all'}` without index; API already has All.
5. **Double cart price** → `proceedLabel` must not include `formatSGD(total)`.
6. **Cook Metro** must be `:8082`; customer `:8081`.
7. **Tab `sceneStyle.paddingBottom`** forbidden — use `contentPadForTabBar` / `contentPadForStickyFooter`.
8. **Deploy** = `git push origin main`; `railway redeploy` alone restarts old image.
9. **CORS wildcard mix** breaks web login — run `pnpm railway:wire`.
10. **Maps import** — `@shc/ui/location-ux` subpath, not barrel (avoids `RNMapsAirModule` crash).
11. **PayNow QR** — one fetch per order; do not loop `loadPayNowSession`.
12. **Product IDs** — seed uses `dish_*`; re-seed after schema migrations.
13. **Cook duplicate settings tab** — only one `Tabs.Screen name="settings"` in cook layout.
14. **SecureStore keys** — no colons; use `milestoneStorageKey()` from family-values-core.
15. **Listings wizard** — do not inline on index; route is `/(cook)/listings/new` (not flat `listings.tsx`).
16. **Listing-actions tray** — use `height: 'medium'`; `@shc/ui/tray` sheet is a `View` (backdrop is separate `Pressable`) — never wrap sheet body in `Pressable` (blocks taps).
17. **Stale Metro after hook import removal** — `METRO_CLEAR=1 pnpm ios:dev` if redbox `useMemo doesn't exist` after hot reload.

---

## 9. Open gaps

| Gap | Notes |
|-----|--------|
| HitPay live / KYC | Sandbox QR only; real bank payouts not wired |
| Cook full Medusa auth actor | Hybrid SHC JWT today; full Medusa cook actor pending |
| Production hardening | Custom domains, prod push creds; rate limits + crash reporting shipped |
| Automated payout worker | `weekly-payout.ts` manual/cron; not yet Railway worker schedule |

---

## 10. Self-update (mandatory)

Behavior changes (routes, modules, UI contracts, env, verify tiers) → update **this file** + the relevant section file + `INDEX.md` last-updated line in the **same commit**. Checklist: [multi-agent/self-updating-rules.md](./multi-agent/self-updating-rules.md).

Phase files (`13-implementation-phases/`) are historical planning — do not treat as live state.
