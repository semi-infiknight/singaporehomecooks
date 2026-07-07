# Overnight Loop Progress

**Stop target:** Thursday 9 July 2026, 9:00 AM IST  
**Branch:** `docs/android-build-blockers` → fork `itskika-78`  
**PR:** https://github.com/semi-infiknight/singaporehomecooks/pull/1

---

## Iteration 1 — 2026-07-08 ~02:45 IST

### Audit
- P2-03 Mandarin i18n: **not started** → began infra
- P1-02 synonym search: partial → expanded seeds + bidirectional lookup
- P1-21 web push: partial → permission states + post-order banner
- P1-09–11 checkout: partial → S$50 minimum enforced server + client; one-cook error code fix
- EAS build `2ad24658`: **IN_QUEUE** (~30 min, not stuck)

### Implemented
1. **`packages/shc-i18n`** — en + zh-Hans operational message catalogs, `ShcI18nProvider`, `useShcI18n`
2. **Tri-platform i18n wiring** — web providers, mobile-customer + mobile-cook `expo-localization` providers; web `LanguageSwitcher` on profile
3. **`enforceMinimumOrder`** in `@shc/business-rules` + `SHC-CART-004` error code
4. **Checkout hardening** — `shc-demo-checkout.ts` validates minimum + allergen/PDPA; web checkout client guard; cart one-cook uses `SHC-CART-001`
5. **Search synonyms** — 20 Singapore heritage term seeds in `seed.ts`; improved `expandSearchTerms` reverse lookup
6. **Web push UX** — `getWebPushPermissionState`, granted/denied UI, `WebPushPromptBanner` on order success

### Tests run
- (pending) `pnpm --filter @shc/business-rules test`
- (pending) medusa vitest for demo-checkout + products search
- (pending) web typecheck

### EAS
- Build `2ad24658`: IN_QUEUE — monitoring, not 6h stuck yet

### Next iteration
- Wire Mandarin strings into mobile discover/checkout screens
- Mobile checkout minimum-order guard
- Add cart route vitest for one-cook conflict
- Continue loop until 9 AM IST

---

## Iteration 2 — 2026-07-08 ~02:45 IST

### Implemented
1. **Mobile checkout** — `enforceMinimumOrder` client guard + i18n title/button strings
2. **Mobile profile** — `MobileLanguageSwitcher` component
3. **Cart route test** — `SHC-CART-001` one-cook conflict coverage
4. **@shc/i18n react** — RN-safe `globalThis` guards (no window/document TS errors)
5. **PR doc** — gap table updated with iter 1 status

### Tests
- `cart/route.test.ts` PASS
- `mobile-customer typecheck` PASS

### Next iteration
- Mandarin strings on discover/search screens (web + mobile)
- Production PWA audit (og-image, counters)
- EAS build monitor
- More blueprint gaps

---

## Iteration 3 — 2026-07-08 ~02:47 IST

### Audit (production)
- `og-image.png` on Railway web: **200 OK** (PNG)
- Homepage HTML: still pre-deploy build (og:image fix needs Railway redeploy)
- EAS `2ad24658`: still **IN_QUEUE** (~1h, not stuck)

### Implemented
1. **Discover search i18n** — web `AppHeader` + mobile discover placeholder use `@shc/i18n`
2. **i18n unit tests** — `normalizeLocale` + zh checkout message

### Next iteration
- Expand Mandarin coverage (cart, tab bar, trust strip)
- Retry EAS if stuck 6+ hours
- platform-stats live deploy verification

---

## Iteration 5 — 2026-07-08 ~02:50 IST

### Implemented
1. **Tab bar i18n** — web `AppMobileTabBar` + mobile `CustomerTabBar` use `tab.*` keys (en/zh-Hans)
2. **Trust strip i18n** — `formatTrustStripCopy` in `@shc/i18n`; web `TrustStrip` + mobile `LocalizedTrustStrip`
3. **Brand polish** — TrustStrip bento mint/peach/yellow icon accents per `brand.md`
4. **Guest cart tray** — localized sign-in prompts on mobile tab bar

### Tests
- `@shc/i18n`: 5 tests PASS (incl. trust-strip)
- web + mobile-customer typecheck PASS

### EAS
- Build `2ad24658`: still **IN_QUEUE** (~1.5h elapsed, not stuck)

### Next iteration
- Orders screen i18n, web desktop nav labels
- EAS monitor / download when FINISHED
- More brand polish (promo rail, filter chips)

---

## Iteration 6 — 2026-07-08 ~02:50 IST

### Implemented
1. **Orders screen i18n** — mobile orders list (title, sections, empty state, chat CTA)
2. **Filter chips i18n** — Halal / Light on mobile discover
3. **Web nav i18n** — Discover + Trust & Safety header links
4. **Cart title i18n** — web + mobile cart screens

### EAS
- `2ad24658`: still **IN_QUEUE** (~1.5h) — no APK download yet

### Next iteration
- Web orders page i18n
- Promo rail / occasion labels
- EAS retry only if 6h+ stuck

---

## Iteration 7 — 2026-07-08 ~02:53 IST

### Implemented
1. **Web orders i18n** — `/orders` page uses all `orders.*` keys
2. **Promo/occasion i18n** — `getLocalizedPromo`, `getLocalizedOccasions`, `getOccasionDishesTitle` in `@shc/i18n`
3. **Web discover** — PromoRail, category chips, section titles, filter chips localized
4. **Mobile discover** — promo rail + occasion categories + dish section title localized
5. **Web mobile search** — AppHeader placeholder localized

### Tests
- `@shc/i18n`: **8 tests** PASS (incl. promo-occasion)
- web + mobile-customer typecheck PASS

### EAS
- `2ad24658`: still **IN_QUEUE** (~2h) — no APK download yet

### Next iteration
- Order detail page i18n
- Cook mobile tab bar (optional)
- EAS monitor; cancel/retry if 6h+ stuck

---

## Iteration 8 — 2026-07-08 ~02:56 IST

### Implemented
1. **Checkout i18n** — web `/checkout` + mobile checkout: steps, collection/safety/pay, PDPA, credits, payment methods, allergen tray
2. **Trust page i18n** — web `/content/trust` client `TrustPageContent` + `getTrustPageLayers` in `@shc/i18n`
3. **Auth i18n** — web `/login` + mobile `/(shared)/auth` (sign-in, register toggle, guest browse)
4. **Wallet/profile i18n** — web `/profile` + mobile profile: credits, requests, bids, notifications, trust card, quick actions
5. **New keys** — `auth.*`, `trust.page.*`, `trust.layer.*`, `checkout.*` (extended), `wallet.*` in en + zh-Hans

### Tests
- `@shc/i18n`: **10 tests** PASS (incl. auth-trust-wallet)
- web + mobile-customer typecheck PASS

### EAS
- Build `2ad24658`: still **IN_QUEUE** (~2h+) — no APK download yet; retry only if 6h+ stuck

### Next iteration
- Order detail page i18n (`/orders/[id]`)
- Cook mobile tab bar (optional)
- EAS monitor; download APK when FINISHED
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 9 — 2026-07-08 ~02:58 IST

### Implemented
1. **Order detail i18n** — web `/orders/[id]` + mobile `orders/[id]`: collection, chat, review, dispute, status labels
2. **`getLocalizedOrderStatus` + `formatOrderRef`** — `@shc/i18n/order-detail.ts` with `orders.status.*` and `orders.detail.*` keys
3. **Mandarin** — 28 new order-detail keys in zh-Hans

### Tests
- `@shc/i18n`: **12 tests** PASS
- web + mobile-customer typecheck PASS

### EAS
- Build `2ad24658`: still **IN_QUEUE** — no APK yet

### Next iteration
- Order timeline step labels i18n (shared `OrderTimeline` component)
- Cook mobile tab bar (optional)
- Request-dish / search screen i18n
- EAS monitor until FINISHED or 6h+ stuck

---

## Iteration 10 — 2026-07-08 ~03:01 IST

### Implemented
1. **Order timeline i18n** — `getLocalizedOrderTimeline`; web `OrderTimeline` + mobile `SHCOrderTimeline` accept localized `steps` prop
2. **Search i18n** — web `/search` + mobile search: title, filters, occasion chips, results count, guest add-to-cart prompt
3. **Request-dish i18n** — web `/request` full flow (steps, hero, form, success/paused); mobile paused/error states
4. **Cook tab bar i18n** — `CookTabBar` uses `cook.tab.*` keys (Home, Orders, Listings, Docs)

### Tests
- `@shc/i18n`: **13 tests** PASS
- web + mobile-customer + mobile-cook typecheck PASS

### EAS
- Build `2ad24658`: still **IN_QUEUE** (~2.5h+) — no APK download yet

### Next iteration
- `RequestDishExperience` shared component strings (mobile wizard body)
- Active order banner / order tray i18n
- EAS monitor; download APK when FINISHED
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 11 — 2026-07-08 ~03:05 IST

### Implemented
1. **RequestDishExperience i18n** — `getRequestDishCopy(locale)` + `copy` prop on wizard, success screen, home CTA; `OccasionTagPicker` localized labels
2. **Active order banner i18n** — `getActiveOrderBannerLabels`; web + mobile discover use `getLocalizedOrderStatus` + banner labels
3. **Order tray i18n** — `getOrderTrayLabels`; review/dispute tray titles, success/error messages, section buttons on web + mobile order detail
4. **Mobile discover fix** — `discover.near_collection` key on index (was hardcoded English)

### Tests
- `@shc/i18n`: **16 tests** PASS (incl. request-tray)
- web + mobile-customer typecheck PASS

### EAS
- Build `2ad24658`: still **IN_QUEUE** (~2.5h+) — no APK download yet

### Next iteration
- Review/dispute tray form placeholders (shared forms)
- Cook app screen strings (dashboard, orders list)
- EAS monitor; download APK when FINISHED
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 12 — 2026-07-08 ~03:10 IST

### Implemented
1. **Order tray form i18n** — `tray.review_*` / `tray.dispute_*` form keys; `OrderTrayLabels` extended; shared `SHCOrderReviewTrayForm` / `SHCOrderDisputeTrayForm` + web tray content accept `labels` prop; opener passes labels through to content
2. **Cook app screen i18n** — dashboard (greeting, stats, collab board, bid placeholders), orders (title, empty state, Accept/Prepare/Ready/Collected, Chat/Details), earnings title + quick actions, compliance banner/title/submit
3. **`getCookQuickActionLabels` / `getCookOrderTransitionActions`** — new `@shc/i18n/cook.ts` helpers
4. **Cook orders fix** — removed erroneous `DirectionalTabScreen` wrapper inside order list map

### Tests
- `@shc/i18n`: **17 tests** PASS (incl. tray form labels)
- web + mobile-customer + mobile-cook typecheck PASS

### EAS
- Build `2ad24658`: **IN_PROGRESS** (was IN_QUEUE) — no APK download yet

### Next iteration
- Cook listings wizard + earnings expense strings i18n
- Cook auth / order detail screens
- EAS monitor; download APK when FINISHED
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 13 — 2026-07-08 ~03:12 IST

### Implemented
1. **Cook listings wizard i18n** — `getCookListingsCopy`; dashboard search/filters, wizard steps 1–4, tray actions (edit/pause/delete), celebration, publish errors
2. **Cook earnings expense i18n** — `getCookEarningsCopy`; projected/completed stats, expense form placeholders, alerts, empty state
3. **Cook auth i18n** — `getCookAuthCopy`; title, subtitle, placeholders, sign-in button, demo hint
4. **Cook order detail i18n** — `getCookOrderDetailCopy`; collection card, transitions, dispute tray, confirm/success/error trays

### Tests
- `@shc/i18n`: **18 tests** PASS (incl. cook copy)
- web + mobile-customer + mobile-cook typecheck PASS

### EAS
- Build `2ad24658`: **IN_PROGRESS** — background poll started; APK not downloaded yet

### Next iteration
- Cook onboarding screen i18n
- EAS monitor until FINISHED; download APK to Downloads
- Production deploy verification
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 14 — 2026-07-08 ~03:17 IST

### Implemented
1. **Cook onboarding i18n** — `getCookOnboardingCopy`; brutalist bento hero card on cook onboarding screen
2. **Customer trust/safety onboarding i18n** — `getTrustSafetyOnboardingCopy`; mobile onboarding reuses `getTrustPageLayers` + policy sections (en/zh-Hans)
3. **UI fixes (tri-platform)** — replaced hardcoded hex in chat screens (cook + customer), listings destructive tray, `@shc/ui` tray destructive actions, order-tray forms hint, web order detail muted text + accent stars, location screen bg, product halal badge
4. **Loop policy** — each iteration now includes UI fixing per `brand.md` (tokens in `theme.ts` / `globals.css`, no stray hex)

### Production audit
- `https://web-production-9226.up.railway.app/og-image.png` → **200 PNG**
- `https://web-production-9226.up.railway.app/` → **200**
- `https://medusa-production-d2ba.up.railway.app/health` → **OK**
- `GET /store/shc/platform-stats` without publishable key → **400** (live deploy needs `x-publishable-api-key` on public curl; web client OK)

### Tests
- `@shc/i18n`: **20 tests** PASS
- web + mobile-customer + mobile-cook typecheck PASS

### EAS
- Build `2ad24658`: **IN_PROGRESS** (~4h+) — background 90s poll continues; APK not downloaded yet

### Next iteration
- Customer product detail + chat i18n
- Mobile profile/checkout remaining `#fff` hex cleanup
- EAS monitor until FINISHED; download APK
- Production platform-stats deploy verification with publishable key
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 15 — 2026-07-08 ~03:20 IST

### Implemented
1. **Product detail i18n** — `getProductDetailCopy`; mobile PDP loading/errors, halal/min-qty badges, allergen gate messages
2. **Order chat i18n** — `getOrderChatCopy(role)`; customer + cook chat screens (title, subtitle, empty, placeholder, send)
3. **UI token fixes** — replaced `#fff` with `gourmeatColors.onPrimary` / `shcColors.onPrimary` in profile bell, checkout PDPA/credits, language switcher

### Production audit
- `GET /store/shc/platform-stats` with publishable key → **404** (route not deployed on `medusa-production-d2ba` yet; code exists on branch)
- og-image + web health still **200** (from iter 14)

### Tests
- `@shc/i18n`: **22 tests** PASS
- web + mobile-customer + mobile-cook typecheck PASS

### EAS
- Build `2ad24658`: **IN_PROGRESS** — new 90s background poll started; APK not downloaded yet

### Next iteration
- Cook profile/chat remaining strings
- Deploy platform-stats to Railway Medusa (user/brother)
- UI: web ErrorBoundary hex → CSS vars
- EAS monitor until FINISHED; download APK
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 16 — 2026-07-08 ~03:25 IST

### Implemented
1. **Web ErrorBoundary** — CSS vars (`bg-background`, `border-border`, `text-destructive`, `text-muted-foreground`); i18n via `getErrorBoundaryCopy` (en/zh-Hans)
2. **Cook i18n** — layout stack titles (`getCookLayoutCopy`), dashboard recent orders/add story/heritage alert/verified badge (`getCookDashboardExtras`), compliance celebration, listings save-error fallback, orders transition-failed, onboarding HDB badge
3. **Web hex cleanup** — TrustPageContent → `text-foreground`/`text-muted-foreground`; WebPushOptIn → brutal border + card tokens; order detail chat panel → `border-border`/`bg-card`/`bg-secondary`; SHCWebComponents Gourmeat muted grays → `text-muted-foreground`

### Production audit
- og-image + web health → **200** (unchanged)
- `GET /store/shc/platform-stats` with publishable key → **404** (expected until brother merges+deploys)
- **No Railway production deploys** this iteration

### Tests
- `@shc/i18n`: **22 tests** PASS
- web + mobile-customer + mobile-cook typecheck PASS

### EAS
- Build `2ad24658`: **IN_PROGRESS** (~4h+) — APK not downloaded yet

### Next iteration
- Remaining web hex (request page gradient, ops page)
- Cook dashboard bid default message + compliance doc badges
- EAS monitor until FINISHED; download APK to `SHC-customer-preview.apk`
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 17 — 2026-07-08 ~03:24 IST

### Implemented
1. **Web cook profile i18n** — `getCookProfileCopy`; localized badges, heritage/menu sections (en/zh-Hans)
2. **Cook mobile** — bid default message, compliance doc verified/pending labels
3. **Web hex cleanup** — `AppFooter`, `cook/[slug]` → design tokens; request hero gradient → `foreground`; ops ledger header → `--shc-bento-yellow`

### Production audit
- No deploys; platform-stats **404** on prod still expected

### Tests
- `@shc/i18n`: **22 tests** PASS
- web + mobile-cook typecheck PASS

### EAS
- Build `2ad24658`: **IN_PROGRESS** — 90s background poll active

### Next iteration
- AppFooter i18n
- WebPushOptIn hardcoded push error strings
- EAS monitor until FINISHED
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 18 — 2026-07-08 ~03:26 IST

### Implemented
1. **AppFooter i18n** — `getFooterCopy`; full footer localized (en/zh-Hans) via client component
2. **WebPush i18n** — `getWebPushCopy`; unsupported device, enable-failed, and "Not now" strings localized
3. **Mobile discover header** — `discover.home_headline`, `collect_from`, `set_location` wired on customer home
4. **Stray hex audit** — web `*.tsx` clean except `layout.tsx` themeColor (brand primary token)

### Production audit
- No Railway deploys; platform-stats **404** on prod still expected

### Tests
- `@shc/i18n`: **24 tests** PASS (+2 footer/push)
- web + mobile-customer typecheck PASS

### EAS
- Build `2ad24658`: **IN_PROGRESS** — 90s background poll active

### Next iteration
- Mobile cart/location alert i18n
- Mobile checkout error strings
- EAS monitor until FINISHED; download APK
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 19 — 2026-07-08 ~03:28 IST

### Implemented
1. **Mobile cart i18n** — `getCartScreenCopy`; empty state, stats, checkout guest tray, all labels (en/zh-Hans)
2. **Mobile location alerts** — `getLocationAlertCopy`; GPS unavailable, permission, error, save-failure alerts localized

### Tests
- `@shc/i18n`: **24 tests** PASS
- mobile-customer typecheck PASS

### EAS
- Build `2ad24658`: **IN_PROGRESS**

### Next iteration
- Mobile checkout validation error strings
- Mobile orders list subtitle i18n
- EAS monitor until FINISHED
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 20 — 2026-07-08 ~03:31 IST

### Implemented
1. **Mobile checkout validation i18n** — `getCheckoutScreenCopy`; allergen/PDPA/slot errors, celebration, credits hint, footer earnings, tier1 label
2. **Mobile orders list** — `getOrdersListCopy` subtitle; `getLocalizedOrderStatus` on order rows
3. **Discover section titles** — categories, order again, saved, explore cuisines + guest add-to-cart tray
4. **EAS APK** — build `2ad24658` **FINISHED**; full APK (~120MB) at `SHC-customer-preview-new.apk` (primary path locked by poll; `SHC-customer-preview.apk` partial ~27MB)

### Production audit
- No Railway deploys; platform-stats **404** expected

### Tests
- `@shc/i18n`: **24 tests** PASS
- mobile-customer typecheck PASS

### EAS
- Build `2ad24658`: **FINISHED** ✅ — APK downloaded

### Next iteration
- Mobile tab stack titles i18n (`_layout.tsx`)
- Customer cook profile screen strings
- Rename/copy full APK when file lock clears
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 20 — 2026-07-08 ~03:32 IST

### EAS (build watcher)
- Build `2ad24658-89d8-489c-9bcd-e9d0e41058ed`: **FINISHED** (preview / Android / SDK 54)
- **APK downloaded:** `C:\Users\mathu\Downloads\SHC-customer-preview.apk` (~119.7 MB)
- Artifact: https://expo.dev/artifacts/eas/L7sB6JxjfzIiU99UpvxQcXuc_9EHPtqIkEBugiZb5Ik.apk
- Build page: https://expo.dev/accounts/kikalikescows/projects/shc-customer/builds/2ad24658-89d8-489c-9bcd-e9d0e41058ed
- Git commit on build: `fe3886d8` — lockfile sync + preview node/pnpm pin (fix for prior `86b5a197` install failure)
- Metrics: queue ~54 min, build ~21 min
- **Emulator install:** skipped — only `emulator-5562` offline in `adb devices` (no `emulator-5554`)

### Next iteration
- Resume blueprint loop (mobile checkout validation errors, orders subtitle i18n)
- Optional: start `emulator-5554` and `adb install -r` preview APK
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 21 — 2026-07-08 ~03:35 IST

### Implemented
1. **Mobile tab/stack titles i18n** — `getCustomerLayoutCopy`; root stack + customer tabs `_layout.tsx` wired (en/zh-Hans)
2. **Customer cook profile i18n** — mobile `cook/[slug]` uses `getCookProfileCopy` (menu highlights, listings, heritage, view cart)
3. **UI (brand.md)** — cook profile screen uses `gourmeatColors` background/text; heritage accent via `shcColors.heritage` token
4. **APK rename** — `SHC-customer-preview-new.apk` → `SHC-customer-preview.apk` copy **succeeded** (file lock cleared)

### Tests
- `@shc/i18n`: **26 tests** PASS (+2 customer-layout, cook profile extras)
- mobile-customer typecheck PASS

### Production audit
- No Railway deploys; platform-stats **404** expected

### EAS
- Build `2ad24658`: **FINISHED** ✅ — full APK at `SHC-customer-preview.apk`

### Next iteration
- Mobile profile screen gourmeat token migration (remaining `shcColors` on profile)
- Web/mobile product detail stack title i18n
- Optional: emulator APK install
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 22 — 2026-07-08 ~03:36 IST

### Implemented
1. **Profile Gourmeat tokens** — migrated `profile/index.tsx` from `shcColors` → `gourmeatColors`; localized subtitle via `getWalletProfileCopy`
2. **Product detail stack title i18n** — mobile `Stack.Screen` with `product.screen_title` / dish name; web PDP loading label localized
3. **Customer root stack** — auth/shared screens use `gourmeatColors.nav` headers (brand.md Gourmeat skin)

### Tests
- `@shc/i18n`: **27 tests** PASS (+1 wallet profile, +1 screen title)
- web + mobile-customer typecheck PASS

### Production audit
- No Railway deploys; platform-stats **404** expected

### EAS
- Build `2ad24658`: **FINISHED** ✅ — `SHC-customer-preview.apk` (~120MB)

### Next iteration
- Mobile search screen remaining strings
- Web product PDP remaining hardcoded copy
- Customer auth screen gourmeat tokens
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 23 — 2026-07-08 ~03:38 IST

### Implemented
1. **Web PDP i18n** — extended `getProductDetailCopy` with allergens, quantity, add-to-cart, collection slots, back link, discount badge (en/zh-Hans)
2. **Mobile search Gourmeat tokens** — `search.tsx` migrated `shcColors` → `gourmeatColors`
3. **Customer auth Gourmeat tokens** — `auth/index.tsx` full `gourmeatColors` skin (inputs, browse guest, mode toggle)

### Tests
- `@shc/i18n`: **27 tests** PASS
- web + mobile-customer typecheck PASS

### Production audit
- No Railway deploys; platform-stats **404** expected

### EAS
- APK ready at `SHC-customer-preview.apk` (~120MB)

### Next iteration
- Mobile request-dish remaining strings
- Web login page Gourmeat/i18n parity
- Customer orders detail mobile strings
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 24 — 2026-07-08 ~03:40 IST

### Implemented
1. **Mobile order detail i18n** — `getCustomerOrderDetailCopy`; guest/total meta, item lines, dispute status fallbacks
2. **Web login Gourmeat parity** — `auth.app_title` + mobile subtitle, browse-guest CTA, brutal card styling, `text-destructive` errors
3. **Mobile request-dish** — loading label, dedicated `request.back` key (was `search.back`)

### Tests
- `@shc/i18n`: **28 tests** PASS (+1 order detail meta)
- web + mobile-customer typecheck PASS

### Production audit
- No Railway deploys; platform-stats **404** expected

### EAS
- APK at `SHC-customer-preview.apk` (~120MB)

### Next iteration
- Web cart/checkout remaining strings
- Mobile orders index polish
- Cook app remaining i18n gaps
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 25 — 2026-07-08 ~03:43 IST

### Implemented
1. **Web cart i18n** — full `getCartScreenCopy` wiring (guest tray, empty state, labels, loading)
2. **Web checkout i18n** — validation errors, network/place-order fallbacks, item count, PayNow subtitle, first-order celebration
3. **Mobile orders index polish** — active count section label; past orders header when history-only
4. **Cook app i18n** — tab/stack titles via `getCookLayoutCopy`; ErrorBoundary localized; dashboard guests/heritage badges

### Tests
- `@shc/i18n`: **29 tests** PASS (+1 cart copy)
- web + mobile-customer + mobile-cook typecheck PASS

### Production audit
- No Railway deploys; platform-stats **404** expected

### EAS
- APK at `SHC-customer-preview.apk` (~120MB)

### Next iteration
- Web orders list/detail remaining strings
- Mobile checkout remaining hardcoded copy
- Cook listings/compliance screen strings
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 26 — 2026-07-08 ~03:45 IST

### Implemented
1. **Web orders list i18n** — `getOrdersListCopy` subtitle, localized status, active count, past-only header fix
2. **Web order detail** — dispute status fallbacks via `orders.detail.dispute_*` keys
3. **Cook compliance i18n** — `getCookComplianceCopy` (upload badge, file placeholder, footer badges)
4. **Cook listings defaults** — wizard seed values localized via `getCookListingsCopy`
5. **Mobile checkout** — corporate flag note + network error fallbacks

### Tests
- `@shc/i18n`: **29 tests** PASS
- web + mobile-customer + mobile-cook typecheck PASS

### Production audit
- No Railway deploys; platform-stats **404** expected

### EAS
- APK at `SHC-customer-preview.apk` (~120MB)

### Next iteration
- Web homepage remaining hardcoded SHCWebComponents defaults
- Cook orders/earnings screen strings
- Mobile profile/wallet remaining copy
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 27 — 2026-07-08 ~03:48 IST

### Implemented
1. **`getDiscoverHomeCopy`** — homepage headline, search, empty state, guest bar, heritage banner, dish rail offers, calorie badges (en/zh-Hans)
2. **Web discover + SHCWebComponents** — `GuestBrowseBar`, `RequestDishHomeCTA`, `HeritageStoryBanner`, `DishRowRail`, `CalorieBadge`, `GourmeatSearchBar` use i18n; `page.tsx` wired
3. **Mobile wallet/profile** — request meta/status labels, unread prefix via extended `getWalletProfileCopy`
4. **Cook orders/earnings** — order title fallback, dispute labels, IRAS badge + default expense category
5. **UI** — customer app root splash `gourmeatColors`

### Tests
- `@shc/i18n`: **30 tests** PASS (+1 discover-home)
- web + mobile-customer + mobile-cook typecheck PASS

### Production audit
- No Railway deploys; platform-stats **404** expected

### EAS
- APK at `SHC-customer-preview.apk` (~120MB)

### Next iteration
- Web AppHeader / layout remaining strings
- Cook onboarding remaining copy
- Mobile cook profile / shared chat strings
- Continue loop until 9:00 AM IST Jul 9

---

## Iteration 28 — 2026-07-08 ~03:51 IST

### Implemented
1. **`getWebLayoutCopy`** — AppHeader brand, nav, cart/menu a11y, PWA install banner, favorite button labels (en/zh-Hans)
2. **Web chrome** — `AppHeader`, `AppMobileTabBar`, `PWAInstallBanner`, `ZomatoLocationBar`, `FavoriteButton` wired
3. **Cook onboarding** — dedicated `cook.onboarding.body`; stack title uses onboarding title key
4. **Shared chat** — localized cook/customer sender labels on mobile customer + cook apps

### Tests
- `@shc/i18n`: **31 tests** PASS (+1 web-layout)
- web + mobile-customer + mobile-cook typecheck PASS

### Production audit
- No Railway deploys; platform-stats **404** expected

### EAS
- APK at `SHC-customer-preview.apk` (~120MB)

### Next iteration
- Web metadata / CookMobileTabBar strings
- Mobile customer cook profile remaining copy
- Cook compliance/listings polish
- Continue loop until 9:00 AM IST Jul 9

