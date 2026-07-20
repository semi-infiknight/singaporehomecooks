# Agent Build Protocol

**Related Files:**
- [../AGENT_PLAYBOOK.md](../AGENT_PLAYBOOK.md)
- [../CURRENT_STATE.md](../CURRENT_STATE.md)
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../03-railway/03-railway.md](../03-railway/03-railway.md)
- [design-taste.md](./design-taste.md)
- [verify-protocol.md](./verify-protocol.md)

**Last Updated:** 2026-07-13
**Owner:** All agent tracks

---

## ⛔ NON-NEGOTIABLE: path of least blast radius

**This is a production marketplace.** Optimize for **smallest safe change that delivers the user outcome** — not for finishing the first half-written code path you find.

### Rule

Before implementing, name **at least two approaches** and pick the one with the **lowest blast radius** that still solves the goal. Prefer in this order:

1. **Server / API only** — existing or one new route returns the artifact (PDF, JSON, redirect URL)
2. **Web** — download / open URL / print (no native rebuild)
3. **Mobile JS-only** — use existing packages; no new native modules
4. **Mobile native** — new `expo-*` / pods / Gradle — **last resort**, own commit, explicit rebuild, smoke only that feature

### Blast-radius checklist (block yourself if any “no”)

| Question | Required answer |
|----------|-----------------|
| Does the API already do this? | Prefer that over client invention |
| Can web satisfy the user without a mobile rebuild? | Prefer web / deep link to web / open URL |
| Will this add a **native** dependency? | Only if JS/API cannot work; document why |
| Can this ship as **one focused commit** without touching routes/auth/layout? | Prefer yes |
| If I rebuild the app binary, did I isolate smoke to **this feature only**? | Required |
| Am I “while I’m here” fixing unrelated bugs? | **Forbidden** in the same change set |

### Forbidden patterns (we already paid for these)

| Anti-pattern | Do instead |
|--------------|------------|
| “Finish the broken base64 → file → Share path” when `?format=pdf` already exists | Open signed URL / `format=pdf` / web download |
| Add native packages + full iOS rebuild for a download | API stream + browser / `Linking.openURL` + signed link |
| Mix invoice + session hydrate + Expo routes in one PR | Separate commits; one concern each |
| Patch symptom without re-asking “product outcome” | State outcome in one sentence, then choose path |

### Decision log (required in commit body or PR note for non-trivial work)

```
Outcome: <user-visible result>
Options: (1) … (2) …
Chosen: <#> because lowest blast radius
Not chosen: <why higher radius rejected>
Smoke: <exactly what was verified>
```

**On conflict:** this section wins over “match existing half-built client code” and over chat urgency to ship a familiar pattern.

---

## What you're building

A **Turborepo** marketplace with three client surfaces and one Railway backend:

| Surface | Path | Port | Backend |
|---------|------|------|---------|
| Customer mobile | `apps/mobile-customer` | `:8081` | Railway Medusa |
| Cook mobile | `apps/mobile-cook` | `:8082` | Railway Medusa |
| Web PWA | `apps/web` | `:3001` | Railway Medusa |
| Medusa API | `apps/medusa` | deploy only | Postgres on Railway |

Shared: `packages/shc-types`, `business-rules`, `shc-api-client`, `shc-ui`, `shc-utils`.

**Removed:** legacy unified `apps/mobile` (Expo 51). Use `mobile-customer` + `mobile-cook` only.

### Package / app removal checklist (prevents CI regressions)

When deleting an `apps/*` or `packages/*` workspace:

1. `rg 'filter=!old-name|apps/old-name|\"old-name\"' .github package.json scripts/ blueprint/` — update every reference
2. `bash scripts/verify-ci-config.sh` — turbo exclusions must match live package names
3. `pnpm verify:ci` or at minimum `pnpm turbo build` before push (catches stale `@shc/ui` source-grep tests)
4. If the package had Maestro flows or docs, move or delete them in the same commit

**2026-07-20 lesson:** `91368d6` removed `apps/mobile` but left `--filter=!mobile` in CI → instant turbo failure on push.

---

## Railway-only backend (clients)

All clients use **Railway Medusa** — not local `localhost:9000`.

| Source | Value |
|--------|-------|
| `config/railway-client.json` | `medusaBase`, publishable key |
| `@shc/utils` | `resolveRailwayMedusaBase()` — **throws** on localhost |
| `pnpm env:sync` | Writes `.env.local` for all three clients |
| `pnpm install` | Runs `env:sync` via postinstall |

```bash
pnpm env:sync
bash scripts/start-mobile-dev.sh   # emulator → Railway
pnpm web:dev                       # browser → Railway
```

**Forbidden for clients:**
- `EXPO_PUBLIC_MEDUSA_BASE=http://localhost:9000`
- `NEXT_PUBLIC_SHC_API_BASE=http://localhost:9000`
- Mock fallbacks in runtime `@shc/api-client`
- Docs telling users to run local Medusa for client testing

`pnpm medusa:dev` is **server development only** (backend track) — not for pointing apps at localhost.

---

## Wiring pattern (prevents broken emulator)

Every feature must follow this chain. **Broken UI = missing link in the chain.**

```
Screen (expo-router / Next page)
  → hook (apps/*/hooks/use*.ts, TanStack Query)
    → @shc/api-client method
      → Medusa /store/shc/* or /admin/shc/*
        → module / workflow
```

### Before committing wiring work (30s checklist)

1. **Route file exists** — `apps/mobile-*/app/...` or `apps/web/app/...`
2. **Expo route layout** — run `pnpm verify:expo-routes` (hard fail if broken)
3. **CTA wired** — `onPress` / `href` calls hook or `router.push` — not empty, not `console.log`
4. **api-client** — import from `@shc/api-client` / `cook-api-client`, not inline fetch mock; package `main` is **source** (`src/`), never rely on stale `dist/`
5. **Auth gate** — checkout, PDP add-to-cart, cook portal require session (see `02a1f53` pattern)
6. **Error surface** — use `ShcRequestError` + `SHCErrorCode` from api-client on web/mobile
7. **testID** — preserve Maestro targets when touching instrumented screens
8. **Emulator sanity** — screen loads without redbox before stacking more commits
9. **Native module** — if you import `expo-*` that needs native code (image-picker, file-system, sharing), add plugin + rebuild binary; lazy-import so screens don't crash on load

### Expo Router hard rules (do not break again)

**Never** create both a file and a folder for the same segment:

| ❌ Broken | ✅ Correct |
|----------|-----------|
| `orders.tsx` + `orders/[id].tsx` | `orders/index.tsx` + `orders/[id].tsx` (+ optional `orders/_layout.tsx`) |
| `listings.tsx` + empty `listings/` | `listings.tsx` only, **or** `listings/index.tsx` |
| `cook/[slug].tsx` + `cook/[slug]/ratings.tsx` | `cook/[slug]/index.tsx` + `cook/[slug]/ratings.tsx` |

**Never** leave empty directories under `app/` (git ignores them; Expo still treats them as routes).

```bash
pnpm verify:expo-routes   # fails CI/goal if violated
```

### Common wiring mistakes (from git history)

| Mistake | Fix pattern |
|---------|-------------|
| Morph/tray button renders, nothing happens | Wire `onPress` → navigation or mutation |
| Guest reaches checkout, silent fail | Auth guard + `returnTo` login redirect |
| Web login "Failed to fetch" | `pnpm railway:wire` — explicit CORS, no wildcard mix |
| Listing save doesn't persist | Hook calls `PATCH /store/shc/listings/:id` |
| Cart empty after login | Refresh cart query in auth success handler |
| Unmatched route / Details broken | Same segment as file **and** folder — fix layout, run `verify:expo-routes` |
| `getX is not a function` on device | Stale `@shc/api-client` dist — use `main: src`, not gitignored dist |
| Invoice shares as text / not PDF | Issue signed URL (`?issue_url=1`) → `Linking.openURL` (mobile); web uses base64 blob helper — no native FS |
| `Cannot find native module 'Exponent…'` | Plugin + pod/rebuild; don't top-level import unlinked natives |

---

## Build workflow per goal

### 1. Plan

- Name the goal (one feature or polish slice)
- Pick `FLAVOUR` + `SCOPE` upfront ([verify-protocol.md](./verify-protocol.md))
- Read [design-taste.md](./design-taste.md) if UI

### 2. Build (many commits, no E2E)

- Implement full slice before verifying
- Optional mid-build: `FILTER=<pkg> pnpm verify:wip` (~30s typecheck)
- Native/metro touched: `RISK=native pnpm verify:wip` (deps + bundle spot check)
- Blueprint updates: **batch at goal end**, not every WIP commit

### 3. Verify (once)

```bash
FLAVOUR=<polish|wiring|feature|tri-platform|native> SCOPE=<area> pnpm verify:goal
```

### 4. Document

Same commit window: relevant blueprint section + `CURRENT_STATE.md` + `INDEX.md` Last Updated.

---

## Package touch guide

| You change… | Also check… |
|-------------|-------------|
| `packages/shc-ui` | web `SHCWebComponents.tsx`, `globals.css`, both apps, `brand.md` |
| `packages/shc-api-client` | callers in hooks; `06-api-surface.md` if new route |
| `packages/shc-types` / `business-rules` | `05-data-model.md`, medusa validators |
| `apps/medusa/src/api` | `06-api-surface.md`, medusa typecheck, `TOUCHES_API=1` on paired UI |
| `apps/web/app` | PWA route handlers if sw/icons; cook-portal auth separation |
| Native dep in mobile | `rebuild-ios-apps.sh`, `TOUCHES_NATIVE=1` at verify |

---

## Native / Metro invariants

From [10-mobile/10-mobile.md](../10-mobile/10-mobile.md) — violations **crash TestFlight**:

| Rule | Guard |
|------|-------|
| RN `0.81.5` + expo-modules-core `3.0.30` | `verify-mobile-deps` |
| No global `react-native:` override in pnpm-workspace | `verify-mobile-deps` |
| Metro entry = `expo-router/entry` only (not `entry-classic`) | `verify-mobile-bundles` (>5MB) |
| Customer `:8081`, Cook `:8082` | `start-mobile-dev.sh`, AppDelegate |
| Maps/motion: subpath import (`@shc/ui/location-ux`) | code review — no barrel export |
| After gesture-handler / reanimated add | `scripts/rebuild-ios-apps.sh` |

---

## Dev commands

```bash
pnpm install && pnpm env:sync
pnpm bootstrap:medusa          # optional: refresh Railway keys + demo users

pnpm customer:dev               # :8081
pnpm cook:dev                   # :8082
bash scripts/start-mobile-dev.sh
pnpm web:dev

bash scripts/rebuild-ios-apps.sh   # after native dep change
pnpm railway:ship                  # PWA deploy
pnpm railway:wire                  # CORS + env refs
```

Demo accounts: [CURRENT_STATE.md §3](../CURRENT_STATE.md).

---

## Contracts-first (when schemas change)

1. Contracts track owns `05-data-model.md` + `06-api-surface.md` after Phase 0 freeze
2. Backend implements against Zod schemas in `shc-types`
3. Mobile/web consume via `@shc/api-client` — no duplicate DTOs in apps
4. Goal verify: `SCOPE=contracts` or `TOUCHES_API=1` when routes change