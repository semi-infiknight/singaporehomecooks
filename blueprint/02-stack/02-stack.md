# 02 — Technology Stack

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../03-railway/03-railway.md](../03-railway/03-railway.md)
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Last Updated:** 2026-06-20 (Blueprint Sync) — UI stack current (NativeWind + Reanimated + tri-platform shc-ui v3 + Lucide/icons in web). iOS rebuild script active.
**Owners:** Infra Track (infrastructure), Contracts Track (contracts & validation)

## Layered Stack Overview

| Layer          | Technology                          | Role & Rationale                                                                 | Owner     |
|----------------|-------------------------------------|----------------------------------------------------------------------------------|-----------|
| Commerce Engine| Medusa v2                           | Headless commerce: products, cart, checkout, orders, auth, workflows, Admin UI   | Backend   |
| Database       | PostgreSQL (Railway managed)        | ACID-compliant primary store for all business data                               | Infra     |
| Cache / Queue  | Redis (Railway managed)             | Session, rate limiting, job queue, real-time availability cache                  | Infra     |
| Object Storage | MinIO (self-hosted on Railway)      | Compliance documents, product images, receipts, user uploads                     | Infra     |
| Backend API    | Node.js + TypeScript + Medusa       | Custom modules, workflows, subscribers, REST + (future) GraphQL                  | Backend   |
| Mobile Client  | Expo SDK 51 + Expo Router v3        | Cross-platform iOS/Android app with file-based routing                           | Mobile    |
| UI Library     | `@shc/ui` (Neo-Brutalist + Bento)   | Shared tokens/components; web mirrors via `SHCWebComponents.tsx` + `globals.css` | Mobile + Web |
| Mobile Motion  | Reanimated 3.10 + Gesture Handler 2.16 + Moti + Skia | Swiggy/Zomato-style interactions, sheet gestures, Skia effects | Mobile    |
| Mobile Styling | NativeWind 4.2 + Tailwind 3.4 + Tamagui core/config | Tailwind on RN via shared `tailwind.config.js`; lightweight Tamagui tokens in `@shc/ui` | Mobile    |
| Lists          | FlashList 1.6                       | Performant discovery feeds and order lists                                       | Mobile    |
| State & Data   | TanStack Query + Zod                | Server state management + runtime schema validation                              | Mobile + Contracts |
| Payments       | PayNow (QR + reference)             | Singapore instant bank transfer — primary and only payment method for MVP        | Backend   |
| Notifications  | Expo Push + SMS (Twilio)            | Order updates, cook alerts, reminders                                            | Backend   |
| Auth           | Medusa auth_identity + custom actors| Unified identity with role-specific extensions (customer, cook, ops)             | Backend   |
| Monitoring     | Railway logs + external APM         | Metrics, traces, error tracking, uptime                                          | Infra     |
| CI/CD          | GitHub Actions + Railway            | Build, test, typecheck, deploy pipeline                                          | Infra     |
| Monorepo       | Turborepo                           | Parallel development, shared packages, consistent tooling                        | Infra     |

## Key Design Decisions

- **Medusa as Foundation**: Leverages battle-tested commerce primitives while allowing deep customization via modules and workflows. Avoids building cart/checkout from scratch.
- **TypeScript Everywhere**: Strict typing + Zod contracts eliminate entire classes of runtime errors between mobile, backend, and shared packages.
- **Expo for Mobile**: Rapid iteration, OTA updates, excellent push notification support, and single codebase for iOS/Android.
- **PayNow Only (MVP)**: Reduces payment complexity and regulatory surface area while matching Singapore user expectations.
- **Collection-Only Logistics**: Dramatically simplifies operations, insurance, and trust model compared to delivery.

## Production Requirements (Applies to All Layers)

- Every service and library must satisfy the controls in `multi-agent/production-hardening.md` from day one.
- PDPA compliance, audit logging, and data retention rules are non-negotiable.
- All inter-service communication uses validated contracts from `shc-types`.
- Feature flags control rollout of new capabilities (see `FEATURE_FLAGS.md`).

## Multi-Agent Ownership

- **Infra Track**: Hosting, databases, cache, storage, CI/CD, observability.
- **Contracts Track**: Data models, API contracts, validation schemas, error codes.
- **Backend Track**: Medusa customizations, workflows, API routes.
- **Mobile Track**: Expo app, UI components, client-side state and hooks.
- **Content Track**: Product copy, onboarding flows, founder inputs.

No layer may be modified without coordination with its owning track(s).

**Rule:** The stack is deliberately conservative and production-oriented. Novel or bleeding-edge technologies are only introduced after explicit evaluation against the production-hardening checklist.

## Mobile UI Stack (Expo SDK 51 / RN 0.74)

Installed in **both** `apps/mobile-customer` and `apps/mobile-cook` via `pnpm --filter <app> add` + `npx expo install` for native modules.

| Package | Version | Notes |
|---------|---------|-------|
| `nativewind` | ^4.2.5 | Tailwind on RN; v4 + Tailwind v3 (Expo 51 compatible) |
| `tailwindcss` | ^3.4.19 | devDependency per app; also root devDep for shared config |
| `react-native-reanimated` | ~3.10.1 | Expo SDK 51 pin (`npx expo install`) |
| `react-native-gesture-handler` | ~2.16.2 | Expo SDK 51 pin |
| `@shopify/react-native-skia` | 1.2.3 | Expo SDK 51 pin |
| `@shopify/flash-list` | 1.6.4 | Expo SDK 51 pin |
| `moti` | ^0.29.0 | Reanimated-based motion primitives |
| `@tamagui/core` | ^1.144.4 | Lightweight token config only (no provider yet) |
| `@tamagui/config` | ^1.144.4 | Base Tamagui config extended with SHC tokens |
| `@tanstack/react-query` | ^5.0.0 | Unchanged — server state |

### Config paths

| File | Location |
|------|----------|
| `tailwind.config.js` | Repo root — shared; `content` scans both apps + `packages/shc-ui` |
| `global.css` | `apps/mobile-customer/global.css`, `apps/mobile-cook/global.css` |
| `nativewind-env.d.ts` | Per app (NativeWind types) |
| `babel.config.js` | Per app — `nativewind/babel` preset + `react-native-reanimated/plugin` **last** |
| `metro.config.js` | Per app — `withNativeWind()` wrapper; isolated `cacheStores` (`mobile-customer` / `mobile-cook`, ports 8081 / 8082) |
| `app/_layout.tsx` | Per app — `GestureHandlerRootView`, `import '../global.css'` |
| `packages/shc-ui/src/native.ts` | Shared NativeWind theme tokens |
| `packages/shc-ui/src/nativewind-theme.cjs` | CJS mirror for root `tailwind.config.js` |
| `lib/ui-setup.ts` | Per app — Tamagui lightweight config + re-exports NativeWind theme |

### iOS native rebuild

After adding or upgrading native modules (gesture-handler, reanimated, moti, skia), stale simulator binaries cause `RNGestureHandlerModule could not be found`. Rebuild both apps:

```bash
bash scripts/rebuild-ios-apps.sh   # pod install + expo run:ios per app
bash scripts/start-mobile-dev.sh   # Metro :8081 (customer) + :8082 (cook)
```

Cook app `AppDelegate` rewrites Metro deep links from `:8081` → `:8082`.
