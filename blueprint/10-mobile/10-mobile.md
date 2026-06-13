# 10 — Mobile Application (Expo)

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../12-shared-components/12-shared-components.md](../12-shared-components/12-shared-components.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../07-auth/07-auth.md](../07-auth/07-auth.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [production/testing-strategy.md](../production/testing-strategy.md)

**Last Updated:** 2026-06-13 (Mobile Track owns)
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

- **API Client**: TanStack Query + fetch wrapper with Zod response validation and automatic retry.
- **Auth**: SecureStore for tokens, biometric optional, automatic refresh.
- **State**: Zustand for UI state + TanStack Query for server state.
- **Styling**: gluestack-ui + theme tokens from `shc-ui`.
- **Testing**: Maestro for E2E flows (critical paths: onboarding, order placement, cook acceptance).

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
