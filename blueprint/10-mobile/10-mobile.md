# 10 — Mobile Application (Expo)

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../12-shared-components/12-shared-components.md](../12-shared-components/12-shared-components.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../07-auth/07-auth.md](../07-auth/07-auth.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [production/testing-strategy.md](../production/testing-strategy.md)
- `.agents/skills/tri-platform-ui-sync/SKILL.md`

**Last Updated:** 2026-06-20 (Blueprint Sync) — Zomato/Toptal UI + real Medusa wiring confirmed; all clients use @shc/api-client; review + cart flows live. See 12-shared + CURRENT_STATE.
**Owner:** Mobile Track

## Overview

Two separate Expo apps deliver the primary customer and cook interfaces. Built with Expo SDK 51 and Expo Router v3, they share `@shc/ui` v3 (Zomato layout + Toptal food-UX + vector icons/photos). Web mirrors the same patterns via `SHCWebComponents.tsx`.

**Production API:** `https://medusa-production-d2ba.up.railway.app` (set in `.env.local` via bootstrap).

## App Structure & Routing (Expo Router)

| App | Port | Metro script |
|---|---|---|
| `apps/mobile-customer` | `:8081` | `pnpm customer:dev` or `scripts/start-mobile-dev.sh` |
| `apps/mobile-cook` | `:8082` | `pnpm cook:dev` or `scripts/start-mobile-dev.sh` |

### Customer app — bottom tabs + hidden detail routes

`(customer)/_layout.tsx` uses **Expo Router Tabs** with **`SHCBottomTabBar`** (`SHCTabIcon` vector icons):

| Tab | Route | Screen |
|---|---|---|
| Discover | `index` | `SHCZomatoStickyHeader`, promo rail, photo bento tiles (`SHCVisualBentoTile`), filter chips, heritage banner, “Order again” rail, dish list |
| Orders | `orders/index` | `SHCZomatoOrderRow` + track/chat |
| Cart | `cart` | `SHCCartPageHero` + line items + sticky checkout CTA |
| Profile | `profile/index` | Wallet bento hero, credits, request dish |

**Hidden from tab bar** (`href: null`): `search` (with `SHCSearchResultsPanel` ADD), `cook/[slug]`, `product/[id]` (sticky add-to-cart), `checkout` (`SHCCheckoutStepper`), `orders/[id]` (review form post-collection).

```
apps/mobile-customer/app/
├── (customer)/
│   ├── _layout.tsx               # Tabs: Discover | Orders | Cart | Profile
│   ├── index.tsx                 # Zomato discover feed
│   ├── search.tsx                # Search + ADD panel
│   ├── cook/[slug].tsx
│   ├── product/[id].tsx
│   ├── cart.tsx
│   ├── checkout.tsx              # 3-step checkout stepper
│   ├── orders/
│   │   ├── index.tsx
│   │   └── [id].tsx              # Review POST after collection
│   └── profile/index.tsx
├── (shared)/auth, onboarding, chat
└── _layout.tsx
```

### Cook app — bottom tabs + hidden detail routes

`(cook)/_layout.tsx` uses **Tabs** + **`SHCBottomTabBar`**:

| Tab | Route | Screen |
|---|---|---|
| Dashboard | `dashboard` | `SHCCookPageHero`, photo bento quick actions, collaboration board |
| Orders | `orders.tsx` | State-machine order cards |
| Listings | `listings.tsx` | Listing wizard + cards |
| Compliance | `compliance.tsx` | SFA/WSQ upload cards |

**Hidden from tab bar**: `orders/[id]`, `earnings` (`SHCCookPageHero`).

```
apps/mobile-cook/app/
├── (cook)/
│   ├── _layout.tsx
│   ├── dashboard.tsx
│   ├── orders.tsx
│   ├── orders/[id].tsx
│   ├── listings.tsx
│   ├── compliance.tsx
│   └── earnings.tsx
├── (shared)/auth, onboarding, chat
└── _layout.tsx
```

## Core Screens & Contracts

### Customer Flow
- **Discover:** Zomato layout — promo rail, photo bento, filter chips (halal/light/occasion), cuisine rail, featured grid, dish list with `SHCFoodImage`.
- **Search:** `SHCSearchResultsPanel` — thumbnail + price + ADD without PDP visit (Toptal).
- **Cook Profile:** Heritage story, ratings, product grid.
- **Product Detail:** Full-bleed hero image, allergens (ack required), calorie badge, sticky add-to-cart.
- **Cart & Checkout:** One-cook enforcement, `SHCCheckoutStepper` (Collection → Safety → PayNow), PayNow QR + ref.
- **Order Tracking:** Status, chat, collection instructions (post-payment), post-collection review form.

### Cook Flow
- **Dashboard:** Earnings hero, photo bento quick actions (vector icons), collaboration board.
- **Orders / Earnings:** `SHCCookPageHero` + order cards with state-machine actions.
- **Listings:** Multi-step wizard with photo tips, AI calorie stub.
- **Compliance:** Document upload cards with expiry tracking.

### Shared Experiences
- **OrderChat:** Messaging scoped to order (customer ↔ cook).
- **PayNowPanel:** QR, reference capture, confirmation polling.
- **Notifications:** Push via Expo + in-app bell.

## Technical Architecture

- **API Client:** `@shc/api-client` → Medusa only (no mock at runtime). TanStack Query hooks in `hooks/`.
- **Auth:** SecureStore for tokens; demo accounts `customer@shc.local` / `rose@shc.local`.
- **Styling:** NativeWind 4 + `@shc/ui` tokens; Reanimated + Moti + Gesture Handler; FlashList for feeds.
- **Metro isolation:** customer `:8081`, cook `:8082`; per-app `cacheStores` in `metro.config.js`.
- **iOS native:** `scripts/rebuild-ios-apps.sh` after adding native deps (gesture-handler, reanimated, moti). Cook `AppDelegate` rewrites `:8081` → `:8082` deep links.
- **Dev scripts:**
  - `scripts/start-mobile-dev.sh` — both Metro servers + adb reverse
  - `scripts/rebuild-ios-apps.sh` — pod install + `expo run:ios` both apps
  - `scripts/run-maestro-full-tour.sh` — Android + iOS Maestro full tours

## E2E Testing (Maestro)

| Flow | File | Status |
|---|---|---|
| Customer auth | `e2e/customer-auth.yaml` | ✅ |
| Cook auth | `e2e/cook-auth.yaml` | ✅ |
| Customer full tour | `e2e/customer-full-tour.yaml` | ✅ Android PASS (2026-06-19) |
| Cook full tour | `e2e/cook-full-tour.yaml` | ✅ Android PASS (2026-06-19) |
| Full order fulfil | `e2e/full-order-fulfil.yaml` | ✅ |

**Prereqs:** Metro `:8081` + `:8082` running; Android `adb reverse`; iOS simulator booted. Use `clearKeychain: true` on iOS auth flows.

**Key testIDs preserved:** `do-checkout`, `proceed-checkout`, `search-input`, `customer-profile-screen`, `cook-orders-screen`, bento tiles (`bento-cart`, etc.), bottom tabs.

**iOS note:** Native rebuild completed; Maestro iOS full tours should be re-run (XCTest driver can be flaky on first bundle load — script pre-warms bundles).

## Production Requirements

- All API calls use validated contracts from `shc-types`.
- Offline resilience for cached listings and orders.
- Accessibility: VoiceOver / TalkBack, high contrast.
- Performance: < 2s TTI on mid-range devices.

## Multi-Agent Notes

- **Mobile Track** owns `apps/mobile-customer`, `apps/mobile-cook`, and `packages/shc-ui`.
- **Web parity** maintained via tri-platform sync skill — same discover layout, checkout stepper, search ADD, heritage banner.
- No direct HTTP in screens; all data via hooks + `@shc/api-client`.

## Gaps (mobile-specific)

| Gap | Notes |
|---|---|
| Web review UI | Mobile has post-collection review on `orders/[id]`; web `/orders/[id]` lacks form |
| iOS Maestro | Android PASS; iOS full tours pending re-verify after native rebuild |
| Saved dietary prefs | Halal/light filters not persisted across sessions |
| Real push inbox | Notifications in-memory on backend |

**Web Parity (2026-06-19):** `apps/web` mirrors Zomato discover, `AppMobileTabBar`, `SearchResultsDropdown`, `HeritageStoryBanner`, `CheckoutStepper`, Lucide bento icons. Gap: review form on order detail.