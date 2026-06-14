# 10 — Mobile Application (Expo)

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../12-shared-components/12-shared-components.md](../12-shared-components/12-shared-components.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../07-auth/07-auth.md](../07-auth/07-auth.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [production/testing-strategy.md](../production/testing-strategy.md)

**Last Updated:** 2026-06-14 by Mobile-Agent (Phases 0-5 core: full E2E flows, shc-ui extract, contracts wired, polling chat in OrderChat, local typed mock enforcing rules; see INDEX for verification)
**Owner:** Mobile Track

## Overview

The mobile application is the primary customer and cook interface. Built with Expo SDK 51 and Expo Router v3, it delivers a unified experience for browsing, ordering, managing listings, real-time communication, and payments. The app supports two primary modes (Customer and Cook) with shared components and navigation.

## App Structure & Routing (Expo Router)

```
app/
├── (customer)/
│   ├── index.tsx                 # Home / discovery feed
│   ├── search.tsx
│   ├── cook/[slug].tsx           # Cook profile + listings
│   ├── product/[id].tsx
│   ├── cart.tsx
│   ├── checkout.tsx
│   ├── orders/[id].tsx
│   └── profile/
├── (cook)/
│   ├── dashboard.tsx
│   ├── listings/
│   ├── orders/
│   ├── earnings.tsx
│   └── compliance/
├── (shared)/
│   ├── chat/[orderId].tsx
│   ├── auth/
│   └── onboarding/
├── _layout.tsx
└── +not-found.tsx
```

## Core Screens & Contracts

### Customer Flow
- Discovery & Search: Filters for cuisine, occasion, halal, calories, collection time.
- Cook Profile: Story, ratings, availability calendar, product grid.
- Product Detail: Ingredients, allergens (with acknowledgment), calorie confidence, min qty.
- Cart & Checkout: One-cook enforcement, allergen ack, PayNow QR + reference input.
- Order Tracking: Real-time status, chat, collection instructions (revealed post-payment).

### Cook Flow
- Dashboard: Pending orders, today’s collections, earnings snapshot.
- ListingWizard: Multi-step product creation with photo upload, tags, availability slots.
- Order Management: Accept / prepare / ready / collected actions with state machine validation.
- Compliance Upload: SFA/WSQ document management with expiry tracking.
- Earnings & Payouts: Weekly breakdown, pending vs paid.

### Shared Experiences
- OrderChat: Real-time messaging scoped to order (customer ↔ cook).
- PayNowPanel: QR generation, reference capture, confirmation polling.
- Notifications: Push via Expo + in-app bell with deep links.

## Technical Architecture

- **API Client**: TanStack Query + fetch wrapper with Zod response validation and automatic retry. (Integration: hooks/useProducts/useOrders/useCart/useChat wrap api-client + mockFetch; mutations handle SHCErrorCode throws. Ready for real /store/shc/*.)
- **Auth**: SecureStore for tokens, biometric optional, automatic refresh. DevRoleSwitcher in root _layout for instant customer/cook role switch + auto-nav (smooth local E2E testing).
- **State**: Zustand for UI state + TanStack Query for server state.
- **Styling**: gluestack-ui + theme tokens from `shc-ui` (SHCButton, SHCCard, PayNowPanel, CollectionSlotPicker, AllergenAckCheckbox, OrderStatusBadge, PriceEarningsCalc, ListingWizardStep, CookCard, SHCBadge, traffic colors etc.).
- **Testing**: Maestro for E2E flows (critical paths: onboarding, order placement, cook acceptance). testIDs present on key elements.
- **Polling/Real-time (Integration polish + 10-mobile)**: useChat/useOrderChat uses refetchInterval: 4500 for chat (per phase-5). Order status live via invalidation on transition. Future: replace with WS/push. Address release note revealed post 'paid' (in order track). PayNow ref captured + transition called in checkout.
- **Local mock backend**: sophisticated mock-service.ts enforces full contracts (one-cook, min-qty, allergen-ack, order-state machine, schema on create, earnings calc, address release 2h post-paid sim). Seeds cleanly from seed/index.ts (Content rich). Swap point documented in LOCAL_TEST.md + api-client.
- **Discovery extras**: occasion + calorie traffic-light (green/amber/red badges + maxCal filter) + earnings preview everywhere. Full routes per map below now exist and wired.

## Production Requirements

- All API calls must use validated contracts from `shc-types`.
- Offline resilience for viewing cached listings and orders.
- Accessibility: VoiceOver / TalkBack support, high contrast, large text.
- Performance budgets: < 2s time-to-interactive on mid-range devices.
- Analytics & error tracking integrated from launch.

## Multi-Agent Notes

- **Mobile Track** owns the entire `apps/mobile` and `packages/shc-ui`.
- Contracts Track owns the data shapes and validation used by the app.
- Backend Track owns the API surface the app consumes.
- Content Track owns all copy, onboarding flows, and empty states.

**Mobile Track Rule:** No direct HTTP calls or raw data manipulation. All data access goes through validated hooks and components.

**Wave 2026-06-14 Mobile-Agent additions (self-update):** 
- apps/mobile/lib/mock-service.ts + api-client + hooks (useAuth/useProducts/useOrder) fully enforce business-rules + shc-types (one-cook, min-qty, allergen-ack, order transitions).
- shc-ui expanded with real PayNowPanel, CollectionSlotPicker, AllergenAckCheckbox, ListingWizardStep, OrderCard etc (central theme).
- Screens: full customer discovery (fuzzy+occasion+calorie traffic), cook/[slug] enhanced, product (3-tier ingredients + video stub + heritage), cart+checkout (slot picker + ack gate + earnings + PayNowPanel + rule errors), orders list+detail+chat polling, profile stub; cook listings wizard (ingredients JSON/occasion_tags/min_qty/publish), orders with Accept..Collected buttons, earnings/compliance stubs, onboarding multi-step, auth switcher (SecureStore).
- All SG taste (HDB notes, Peranakan 1972 Katong, Hari Raya etc).
- Verification: multiple pnpm --filter mobile typecheck runs (core clean; stray gluestack/Input + nodeNext notes); pnpm install succeeded; local start ready via turbo.
- See phase-2/3/4/5.md for task marks.
- Gaps next: real backend API, Maestro flows, push, AI calorie.

**Web Parity (2026-06-14 Web/Phase10 Subagent):** apps/web delivers full parity for public customer flows + cook portal without Expo. Same seeds (exact), same api-client toggle pattern (real /store/shc or mock), same rules (one-cook/PDPA/earnings 85%/credits 5%/collab/heritage). Home/discover, cook/[slug] (heritage archive), product detail (3-tier + ack + earnings), cart/checkout (slots+PDPA+credits+PayNow sim), cook-portal (dashboard orders table, collab bids/accept, heritage add, earnings). SSR metadata/sitemap/PWA manifest. ErrorBoundary + testIDs + a11y. "Switch to mobile" + ports note + QR sim. Build: next build success (routes listed). Run side-by-side pnpm --filter=web dev (3001) + mobile. Gaps: full real auth, browser media upload, interop full shc-ui. Self-updated phase-10/INDEX/this per rules. Ready for stitch + public tunnel test without install.

**Growth/Diff Wave 2026-06-14 Mobile+Growth Subagent (Phases 7-9, ownership apps/mobile + shc-ui + 10/12/phases/INDEX):** 
- Growth (Home Credits Phase 9): earn 5% total units on collected (in transitionOrder + notif), get/redeem in mock+api, tiers from lifetime, WalletCard/CreditBadge in profile + "Credits available: X (apply Y)" + checkoutWithCredits. useCredits hooks. Feature flag 'home_credits'.
- Diff (Phase 8): RequestDishForm modal + createRequest in profile (shc_request); Collab Board (requests list + createBid/getBids/acceptBid->order) in cook dashboard; Heritage Archive permanent render+add (get/addHeritageEntry, published) in cook/[slug] + dashboard; corporate flag in checkout + stub invoice. shc-ui RequestDishForm.
- Launch polish (7+9): AI calorie stub (estimateCaloriesAI in createListing from ingredients + badge/conf in listings wizard + product); PhotoTipsModalContent + getPhotoTips (3 SG tips: HDB light, banana leaf props, texture closeup) modal on listings; search enh (searchSynonyms SG map + NL parse "under X cal for Y occasion" in mock searchProducts + more UI filters cuisine/halal/price in search.tsx); offline mem cache (orders/reqs/credits persist session in module); notif bell (getNotifications + 🛎️ in profile, events from states/credits/reqs); ErrorBoundary (root + layouts, SHCError handling); PWA web manifest in app.json; api-client enhanced with real baseURL (EXPO_PUBLIC_SHC_API_BASE or toggle), all new wrappers (use real or mock). New hooks appended: useCredits/useRedeem/useAICalorie, useRequests/useBids/useCreate*/useAccept/useNotifications. Hardening: testIDs on credit/redeem/request/bid/collab/heritage/AI, a11y labels, more Maestro-ready (profile request, checkout redeem, dashboard bid/accept).
- All build on frozen contracts (use shc_request/bid/feature_flag/platform_stat/search_synonym), enrich mock primary, shc-ui only, no contracts edit.
- Demo: 1. Switch customer -> profile: see Wallet (bal+Silver tier), tap Request Custom Dish (form nasi lemak hari raya), submit. 2. As cook dashboard: see Collab Board, bid on req or accept. 3. Complete order (cook collected) -> profile credits +5%. 4. Checkout: apply credits, toggle corporate. 5. Listings (cook): ingredients, AI est button -> badge, photo tips btn -> modal. 6. Cook profile (customer): Heritage Archive stories. 7. Search "nasi lemak under 400 cal for Hari Raya" -> filtered. Bell shows events.
- Updated: 10-mobile (this), 12-shared (new comps), phase-7/8/9 (marked), INDEX. Typecheck clean. "Growth Wave ready".
- Remaining (real): real AI (Claude/vision), full collab (multi-cook), EAS builds/push, backend /shc/requests etc swap (api-client ready).
