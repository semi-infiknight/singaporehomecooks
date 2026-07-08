# Production Testing Strategy

**Related Files:**
- [README.md](./README.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [ERROR_CODES.md](../ERROR_CODES.md)

**Last Updated:** 2026-07-08 — Tiered verification policy: targeted tests on normal commits, full E2E only at goal completion / stitch. See `.cursor/rules/testing-tiers.mdc` + `scripts/verify-tier.sh`.
**Owners:** Infra Track (backend & CI), Mobile Track (E2E & Maestro)

## Tiered verification (agents + humans)

**Problem:** Running full Maestro tours + `verify:real-e2e` on every incremental commit (e.g. Family Values sub-commits) wastes 30–60 min and hits live Railway with throwaway orders.

**Policy:** Match test depth to change scope.

| Tier | When | Command |
|------|------|---------|
| 0 quick | Every commit; tiny predictable fixes | `bash scripts/verify-tier.sh quick` |
| 1 area | Normal change — affected surface only | `SCOPE=ui\|api\|web\|mobile bash scripts/verify-tier.sh area` |
| 2 goal | Multi-file goal **fully done** | `bash scripts/verify-tier.sh goal` |
| 3 stitch | Goal + device UI proof (Metro running) | `SCOPE=tray bash scripts/verify-tier.sh stitch` |
| 4 full | Milestone / pre-TestFlight / pre-ship | `bash scripts/verify-tier.sh full` |

**Skip allowed:** blueprint-only, comments, single-line fixes when typecheck already green.

**Maestro flow map (targeted):**

| Flow | File | Run when |
|------|------|----------|
| Checkout allergen tray | `mobile-customer/e2e/checkout-allergen-tray.yaml` | Checkout / tray changes |
| Listing tray | `mobile-cook/e2e/listing-tray.yaml` | Cook listings / tray |
| Order tray | `mobile-customer/e2e/order-tray.yaml` | Order review / dispute trays |
| Auth smoke | `customer-auth.yaml`, `cook-auth.yaml` | Auth changes |
| Full tour | `customer-full-tour.yaml`, `cook-full-tour.yaml` | Tier 4 only |

## Testing Pyramid

1. **Unit Tests** — Every pure function and utility in `shc-utils` and shared logic (Jest / Vitest).
2. **Contract Tests** — Zod schema validation on every API boundary (consumer-driven).
3. **Integration Tests** — Medusa workflows, order state machine, ledger entries (in-memory DB).
4. **API Contract Tests** — OpenAPI-style validation against `06-api-surface.md`.
5. **E2E Tests** — Maestro flows for critical user journeys (onboarding, order placement, cook acceptance, payout).
6. **Chaos & Resilience Tests** — Simulated failures (network, DB, payment provider) in staging.

## Mandatory Coverage Areas

- All order state transitions and invalid transition rejection
- PayNow reference generation and confirmation flow
- Allergen acknowledgment enforcement
- Cook compliance verification gates
- Permission and actor checks on every custom route
- Data retention and PDPA consent flows

## CI Pipeline Requirements

- `turbo test` + `turbo typecheck` — **every push** (fast gate).
- Platform guards (`mobile-ios-guard`, `web-pwa-guard`) — **every push**.
- `verify:real-e2e` (Railway API smoke) — **`integrate/*` branches + manual `workflow_dispatch` only**, not every `main` commit.
- Maestro YAML validate — every push on macOS job; **device Maestro optional** (`MAESTRO_RUN_DEVICE`).
- Full Maestro tour — **local tier 4** before TestFlight / major ship; not CI on every commit.
- Medusa route tests — on API/backend changes (tier 1 `SCOPE=api`).

### Platform guard jobs (blocking on `main`)

| Job | Script | Catches |
|---|---|---|
| `mobile-ios-guard` | `verify-mobile-deps.sh` + `verify-mobile-bundles.sh` | Wrong RN/expo-modules-core, global RN override, tiny Metro bundle, `.easignore` excluding `ios/` |
| `web-pwa-guard` | `verify-web-pwa.sh` | Missing manifest/icons/sw, failed `next build`, build-fingerprint unit tests |

### Local verify commands (fresh clone)

```bash
pnpm verify:mobile-deps      # dependency invariants
pnpm verify:mobile-bundles   # expo export bundle > 5MB
pnpm verify:web-pwa          # PWA assets + production build (local)
pnpm railway:verify-pwa      # Live Railway PWA — checks X-SHC-Railway-Build-Id header
pnpm setup:ios-dev           # macOS: install + all mobile guards + pod rebuild
```

EAS TestFlight scripts run mobile guards automatically before upload.

## Full CI + Maestro (Final Polish)

- Root `.github/workflows/ci.yml`: runs `pnpm turbo build && turbo test && turbo typecheck && turbo lint + seed validate + verify:local` on push/PR to main/integrate/*.
- Maestro job (macos or cloud): documents + runs stub E2E flows (onboarding.yaml, full-order-fulfil.yaml incl. PDPA/state/money/credits, credits-earnings-payout.yaml). 
- Local: `maestro test apps/mobile/e2e/*.yaml` (Expo dev server running; testIDs on screens/hooks).
- Device/cloud: Use Maestro Cloud (MAESTRO_CLOUD_TOKEN), EAS builds + device farm, or self-hosted macOS runner with simulators. Non-blocking in initial CI until secrets/device parity.
- See LOCAL_TESTING.md for "how to share via tunnel" + full checklist including Maestro.
- Mobile test script placeholder ready for jest + Maestro integration. All per phase-7/10 + stitching.

## Multi-Agent Notes

- Contracts Track ensures all schemas are testable.
- Backend Track owns workflow and module tests.
- Mobile Track owns Maestro flows and component tests.
- Infra Track owns the CI configuration and test environment parity.

**Rule:** No PR merges without green tests. Flaky tests are treated as production incidents.

**Hardening + Integration wave:** Maestro flow stubs in apps/mobile/e2e/ (onboarding.yaml, full-order-fulfil.yaml covering PDPA consent at checkout + cook onboarding, state transitions + money, credits-earnings-payout.yaml). Documented run via `maestro test`. `pnpm verify:local` added for seed+typecheck+basic order/money/credit flow sim (used in local host verification). All new areas (explicit PDPA consent flows, audit logs with before/after, ErrorBoundaries, rate limit stubs, obs perf in hooks) now in mandatory coverage. Mixed real Medusa local host in pyramid for integration wiring. See LOCAL_TESTING.md checklist + phases.
