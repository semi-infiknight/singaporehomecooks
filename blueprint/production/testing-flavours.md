# Testing Flavours — SHC Experience Ledger

**Related Files:**
- [../README.md](../README.md) — canonical agent brain
- [../AGENT_PLAYBOOK.md](../AGENT_PLAYBOOK.md)
- [../agent/verify-protocol.md](../agent/verify-protocol.md)
- [goal-workflow.md](./goal-workflow.md)
- [testing-strategy.md](./testing-strategy.md)
- `scripts/verify-tier.sh`
- `.cursor/rules/testing-tiers.mdc`

**Last Updated:** 2026-07-08 — Learned from prior agent runs + git fix history.
**Audience:** Every feature/polish goal on customer app, cook app, web PWA.

This repo is in **polish-and-ship mode**: more features, page refinements, tri-platform parity — not greenfield architecture. Tests should be **strategic**, not exhaustive.

---

## Pick a build flavour (start of every goal)

| Flavour | You are… | Examples | Goal verify |
|---------|----------|----------|-------------|
| **`polish`** | Visual/copy/spacing on **already-wired** screens | Discover header hide, chip colors, tray animation timing | `FLAVOUR=polish SCOPE=web\|tray pnpm verify:goal` — typecheck + guards only |
| **`wiring`** | Connecting UI → hook → api-client → route | Morph CTA, auth guard, cart refresh post-login | `FLAVOUR=wiring SCOPE=<flow> pnpm verify:goal` — typecheck + **one** Maestro flow |
| **`feature`** | New screen, flow, or CRUD end-to-end | New cook portal page, listing edit/delete | `SCOPE=<area> pnpm verify:goal` (default) |
| **`tri-platform`** | `@shc/ui` + web + both mobile apps | Family Values tray, token change | `FLAVOUR=tri-platform SCOPE=tray pnpm verify:goal` |
| **`native`** | RN dep, pod, Metro, Babel, `.easignore` | gesture-handler, reanimated, metro entry | `FLAVOUR=native TOUCHES_NATIVE=1 SCOPE=infra pnpm verify:goal` |
| **`api`** | Medusa module, route, workflow | listings PATCH, CORS fix | `SCOPE=api pnpm verify:goal` |
| **`deploy`** | Railway ship, PWA fingerprint | `railway:ship`, CORS wire | `SCOPE=railway pnpm verify:goal` |

**Default if unsure:** `feature`.

---

## Experience ledger — what we actually miss vs skip

Learned from fix commits (`b0a6b10` wiring, `02a1f53` auth guard, `5deaffe` CORS, `7ade263` medusa TS, `de91419` trays, Metro crash guards):

### Recurring mistakes (KEEP tests — never skip at goal close)

| Failure mode | Symptom | Caught by | When to run |
|--------------|---------|-----------|-------------|
| **Unwired UI** | Button/tray renders but nothing happens on emulator | Maestro flow for that screen + wiring checklist | `FLAVOUR=wiring`, relevant `SCOPE` |
| **Tri-platform drift** | Mobile updated, web still old (or vice versa) | Typecheck all 4 packages (`@shc/ui`, both apps, web) | `FLAVOUR=tri-platform` |
| **Auth not gated** | Guest reaches checkout/PDP add-to-cart, silent API fail | `SCOPE=checkout` Maestro + web typecheck | Any checkout/cart/auth goal |
| **CORS / env** | Web login "Failed to fetch", works in curl not browser | `TOUCHES_API=1` or `SCOPE=api`; `railway:wire` after CORS edits | API + web auth goals |
| **Metro / bundle crash** | White screen, instant TestFlight crash, ~125KB bundle | `verify-mobile-bundles` | `TOUCHES_NATIVE=1` or `FLAVOUR=native` |
| **Native module via barrel** | `RNMapsAirModule` / `RNGestureHandler` crash at import | Code review + subpath imports rule | Touching `@shc/ui` exports |
| **Medusa route TS drift** | Railway deploy fails build | `pnpm --filter medusa typecheck` | Any `apps/medusa` edit |
| **testID drift** | Maestro can't find element after layout refactor | Maestro YAML validate + one device flow | Layout changes on instrumented screens |

### Rare / stable areas (SKIP at goal close — save time)

| Area | Why skip | Still run when… |
|------|----------|-----------------|
| **Full Maestro tour** (8+ flows) | 15–30 min; catch-all for milestones only | `pnpm verify:full` at stitch/TestFlight |
| **`verify:real-e2e` API smoke** | Slow; bid-accept has known flake; UI polish doesn't need it | `SCOPE=api`, `TOUCHES_API=1`, or milestone |
| **`seed.ts --validate`** | Unchanged for visual-only goals | Contracts, seed, money, new demo data |
| **`verify-mobile-bundles`** (~2–3 min export) | Only catches Metro entry regressions | `TOUCHES_NATIVE=1` or `FLAVOUR=native` |
| **Full `@shc/utils` test suite** | Stable pure functions | Utils/business-rules logic changed |
| **All 3 tray Maestro flows** | Overkill for single-screen polish | `FLAVOUR=polish` or narrow `SCOPE=checkout` |
| **business-rules 97-test suite** | Unrelated to CSS/copy | Money/state-machine logic touched |

---

## Build-phase care (no test runner — prevents emulator breakage)

Before committing wiring or navigation work, **manually verify** (30s each):

1. **Route exists** — file in `app/` (expo-router) or `apps/web/app/` (Next).
2. **CTA wired** — `onPress` / `href` calls a real hook or `router.push`, not a stub.
3. **api-client** — method imported from `@shc/api-client`; not a local mock.
4. **Tri-platform** — if `@shc/ui` changed, grep web mirror (`SHCTrayWeb`, `SHCWebComponents`).
5. **testID** — preserve Maestro targets; grep sibling screens for pattern.
6. **Native imports** — maps/motion via subpath (`@shc/ui/location-ux`), not barrel.
7. **Emulator sanity** — after wiring commit, confirm screen loads (no redbox) before batching more commits.

**High-risk mid-build spot check** (optional, ~30s–3min — not every commit):

```bash
# Touched metro/babel/package.json/native dep?
TOUCHES_NATIVE=1 bash scripts/verify-mobile-deps.sh
TOUCHES_NATIVE=1 bash scripts/verify-mobile-bundles.sh

# Unsure about types on shared package?
FILTER=@shc/ui pnpm verify:wip
```

---

## Goal verify recipes (copy-paste)

### Polish discover / header / chips (web or mobile)

```bash
FLAVOUR=polish SCOPE=web pnpm verify:goal
# or mobile-only visual:
FLAVOUR=polish SCOPE=mobile pnpm verify:goal
```

### Wire checkout auth / cart refresh / PDP guard

```bash
FLAVOUR=wiring SCOPE=checkout pnpm verify:goal
# if medusa routes too:
FLAVOUR=wiring SCOPE=checkout TOUCHES_API=1 pnpm verify:goal
```

### Cook listings edit/delete (API + mobile)

```bash
SCOPE=listings TOUCHES_API=1 pnpm verify:goal
```

### Family Values / tray on all platforms

```bash
FLAVOUR=tri-platform SCOPE=tray pnpm verify:goal
```

### Add react-native-reanimated / metro config

```bash
FLAVOUR=native TOUCHES_NATIVE=1 SCOPE=infra pnpm verify:goal
```

### Railway PWA deploy proof

```bash
SCOPE=railway pnpm verify:goal
```

### One-line typo outside a goal

```bash
pnpm verify:quick
```

---

## Env flags (compose with SCOPE + FLAVOUR)

| Flag | Meaning |
|------|---------|
| `FLAVOUR=polish\|wiring\|feature\|tri-platform\|native` | Subset of goal verify (see `verify-tier.sh`) |
| `TOUCHES_API=1` | Also run Railway API smoke at goal close |
| `TOUCHES_NATIVE=1` | Also run mobile bundle export guard (~2–3 min) |
| `SKIP_SEED=1` | Skip seed validate (polish-only; script sets automatically for `FLAVOUR=polish`) |
| `FILTER=<pkg>` | With `verify:wip` — optional typecheck during build |

---

## Forward-looking default (polish-and-ship era)

| Work you're doing | Flavour | Skip | Never skip |
|-------------------|---------|------|------------|
| Page layout polish | `polish` | Maestro device, seed, API smoke, bundles | Typecheck touched app |
| New button that should navigate | `wiring` | Full tour, extra tray flows | One Maestro for that flow |
| New customer/cook screen | `feature` | Full tour until milestone | Typecheck + flow Maestro |
| `@shc/ui` token/component | `tri-platform` | API smoke | All 4 package typechecks |
| Medusa route | `api` | Maestro (unless UI paired) | medusa typecheck + API smoke |
| Metro/native dep | `native` | Everything unrelated | deps + bundles guards |

**Milestone only:** `pnpm verify:full` — full Maestro tour + API smoke. Not per goal.