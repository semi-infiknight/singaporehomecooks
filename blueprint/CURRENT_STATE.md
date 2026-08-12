# Current State — Singapore Home Cooks

**Last updated:** 2026-08-12 (cook onboarding completes to dashboard; pill CTAs; save-dish listing rows)
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
| Customer | Medusa email/pass JWT; optional for browse + guest order | `POST …/auth/customer/login|register`, `GET …/auth/me` |
| Guest (customer) | Device guest UUID + contact at checkout; order ids in SecureStore/localStorage | `GUEST_*` keys in `@shc/utils/guest-session`; cart actor `guest_<uuid>` |
| Cook | SHC JWT + scrypt `password_hash` on `shc_cook` | `POST …/auth/cook/login|register`, `PATCH …/auth/cook/profile` |
| Admin | Medusa admin session | `/app`, `/app/shc-ops/*` |

Protected store routes resolve identity from **Bearer JWT** (`getCustomerId` / `getCookId`) — not `x-shc-*` headers. Guest cart/checkout uses guest id headers via `ensureGuestId()`.

**Guest-first customer UX (2026-08-10):** sign-in is **not** required for Home, Cart, Checkout (phone/name contact), or **Orders**. Orders tab + screen never show “Sign in to view orders”. `getCustomerOrders()` = authenticated `GET /store/shc/orders` **or** hydrate `listGuestOrderIds()` → `getOrder(id)` each. Phone login may merge guest local data (`link-guest-to-profile`). Profile tab may still nudge sign-in for account tools; do not gate Orders.

Web cook portal uses separate `useCookAuth` + `cook-api-client.ts` under `/cook-portal/*`.

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

- Composition: `@shc/utils` `discoverSections()` — promo carousel → cooking soon → for-you rail → **Dishes | Kitchens** + mode content → request CTA.
- **Occasions browse removed** — no `/occasions` or `/(customer)/occasions` “Hari Raya spread” page; cooks do not tag by occasion. Custom **request** wizard may still ask “what’s the occasion?” for context. Festive promos deep-link to `/request`.
- Filters: multi-criteria AND in `filterDiscoverProducts()` — query, cuisine, mealType, dietary (halal/veg/vegan), include/exclude ingredients, **variable `maxCal`** (presets + slider; free-form “under X cal” via `parseMaxCalFromQuery` / `resolveEffectiveMaxCal` in `@shc/utils/discover.ts`).
- Search: kitchen grouping + multi-kitchen dish labels (`buildSearchResultGroups` / `@shc/utils/search-results.ts`); kitchen → cook page.
- **Zero search hits:** `SHCSearchNoResultsRequestCard` / web `SearchNoResultsRequestCard` — “Didn’t find what you’re looking for?” + **Request a custom dish** (Advanced Search panel, home dishes/kitchens empty when searching, header dropdown).
- Location: GPS browse vs collection; proximity when lat/lng set; header chip → `/(customer)/location`.
- **No notification bell** on home header. Attention lives in Orders / Requests sections.
- **Discover chrome (2026-08-10):** compact Swiggy-style row — **location (left) + profile avatar (right)**; no “Hungry? Order & Eat.” headline (more room for dishes).
- Honest ratings: `coerceRating()` — no fabricated 4.8/24.

### Location & checkout

- Picker: `LocationPickerExperience` (`@shc/ui/location-ux`); SG quick-pick areas; map confirm on iOS (`react-native-maps`) / Android Carto tiles.
- Checkout pre-fill: `checkoutCollectionPrefill()`; place-order requires location.
- **Guest checkout:** contact fields + `recordGuestOrder(orderId)` after place; server stores guest contact / phone link on order meta.
- Order snapshot: `POST /store/shc/carts/demo-complete` writes `customer_collection_*` on `shc_order_meta`.
- **Order window (lead time):** listing fields `min_order_lead_days`, `min_order_lead_hours`, `order_cutoff_time` (`@shc/utils/order-window.ts` + availability migration). Customer slots API + checkout use `listEligibleCollectionSlots`; UI copy via `orderWindowCustomerCopy`. Cook wizard/edit + web listings expose controls.

### Customer orders (guest + signed-in)

- Tab + screen: **never** auth-gate (“Sign in to view orders” removed from `CustomerTabBar`, web `AppMobileTabBar`, orders pages).
- Data: `getCustomerOrders()` in mobile/web `api-client` — JWT list **or** guest local IDs + `GET /store/shc/orders/:id`.
- Empty state: “orders from this device/browser after checkout” — not a sign-in wall.
- Tiffin meals / corporate invoices still require signed-in APIs when applicable.

### Notifications (product decision 2026-08-10)

- **No permanent inbox UI**, no home/dashboard/profile **bell**, no `/notifications` routes.
- Attention items surface in **Orders**, **Requests**, etc.
- **Push prefs only** in Account (customer profile) / Kitchen settings (cook) — Switch / `WebPushOptIn`. Backend `shc-notification` + push token APIs remain for device pushes and ops; do not rebuild in-app inbox without product ask.

### Cook app

- Tabs: dashboard, orders, listings, compliance (+ hidden settings, batches, tiffin, earnings, order detail).
- **Onboarding (2026-08-12):** 9 screens — kitchen name + OneMap address search, PayNow (enter twice), PDPA/terms, legal name, NRIC last 4, alternate contact, halal, skippable certificates, menu card (add more or finish later). Header is back + progress bar only (no stacked dots / “step of 26”).
- **Dashboard:** bento quick actions; **no** notification bell; **no** collapsible notif panel.
- **Listings:** nested stack; order-window fields on create/edit; empty form on new wizard.
- Settings: pause, collection address/instructions/time slots, avatar/hero, **push toggle** (not inbox link); `SHCCookAreaPicker`.
- Earnings / orders / compliance: unchanged patterns (ledger earnings, accept/decline, settlement PDF rules).

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
18. **Guest-first vs leftover gates** — removing “optional auth” in one place is incomplete if tab bars / `SHCAuthSessionGate` / `useOrders({ enabled: isAuthenticated() })` still block. Orders must use `getCustomerOrders()` + always-on query + no tray on Orders tab.
23. **Tray filter stale maxCal** — filter sheet content is a factory closed over open-time props; calorie slider/chips need **local state** + live value label; prefs setters must use functional `setPrefs` so rapid slider moves do not clobber.
19. **Incomplete panel removal leaves broken JSX** — deleting a collapsible notif panel must remove the whole block (profile/dashboard); leftover `</Pressable>` fragments → Metro `Expected corresponding JSX closing tag`.
20. **No in-app notification inbox** — do not re-add `/notifications` screens or home bells; push opt-in lives in settings/profile only. Device push registration exports: `registerCustomerPushToken` / `registerCookPushToken` (not a fictional `registerForPushNotificationsAsync`).
21. **`getSlots` payload shape** — API may return `{ slots, order_window_copy }`; always unwrap `slotsPayload?.slots` (or equivalent) before `.map` on PDP/checkout.
22. **Blueprint self-update is mandatory** — same session as code: patch `CURRENT_STATE.md` + section file + `INDEX.md` last-updated ([multi-agent/self-updating-rules.md](./multi-agent/self-updating-rules.md)). Session 2026-08-10 drifted until explicitly caught up — do not ship code-only again for UX/product rules.

---

## 8b. Pre–App Store E2E (2026-08-10)

- `pnpm verify:ci` green (packages build/test, mobile typecheck, bundle/PWA guards).
- Customer: guest Orders without sign-in wall; maxCal live label; no occasions catalogue / notif inbox UI.
- Live Railway: multi-dish `POST /store/shc/requests` (guest_count + items) works after medusa redeploy.
- Maestro `e2e/discover-smoke.yaml` on booted iPhone 16 Pro: PASS.
- Playwright `e2e/custom-request-flow.spec.ts`: PASS (wizard → cook quote on dish pages → partial accept → PayNow). Auth cache `e2e/auth-session.ts`; unique quote-builder test ids.
- Known non-blockers: HitPay live/KYC, ASC submit.

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
