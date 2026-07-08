# Production Testing Strategy

**Related Files:**
- [goal-workflow.md](./goal-workflow.md) — **start here** for when to run which verify tier
- [README.md](./README.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [ERROR_CODES.md](../ERROR_CODES.md)

**Last Updated:** 2026-07-08 — Generalized batch build / batch verify for all tracks and goals.
**Owners:** Infra Track (backend & CI), Mobile Track (E2E & Maestro)

## Batch build, batch verify (all goals)

**Canonical workflow:** [goal-workflow.md](./goal-workflow.md)

During any goal, ship many commits with **no tests**. Verify **once** when the goal is done with `SCOPE=<area> pnpm verify:goal`.

| Phase | Commits | Tests |
|-------|---------|-------|
| **Build** | Feature slice across track(s) | **None** (optional `FILTER=<pkg> pnpm verify:wip` ~30s) |
| **Verify** | Goal complete | `SCOPE=<area> pnpm verify:goal` — one pass |
| **Ship** | Milestone / stitch / TestFlight | `pnpm verify:full` |

| Tier | Command | When |
|------|---------|------|
| wip | `pnpm verify:wip` | Mid-goal — skip by default |
| goal | `SCOPE=<area> pnpm verify:goal` | Goal done — scoped typecheck + unit + Maestro (by SCOPE) |
| full | `pnpm verify:full` | Pre-TestFlight / stitch |
| quick | `pnpm verify:quick` | Small fix outside a goal |

**SCOPE examples (full table in goal-workflow.md):**

| Goal type | SCOPE |
|-----------|-------|
| Medusa module / route | `api` |
| Zod / business rules | `contracts` |
| CI guards / Railway config | `infra` or `railway` |
| Next.js / PWA | `web` |
| Cross-app mobile | `mobile` |
| `@shc/ui` / trays | `tray` |
| Login / session | `auth` |
| Cart / allergen / PDP | `checkout` |
| Listing CRUD | `listings` |
| Order fulfilment UI | `orders` |
| PayNow / ledger / payouts | `money` |
| Onboarding flows | `onboarding` |
| Seed / copy | `content` |

Set `TOUCHES_API=1` on non-API scopes when Medusa routes changed → adds Railway API smoke at goal verify.

Implementation: `scripts/verify-tier.sh`. Agent rule: `.cursor/rules/testing-tiers.mdc`.

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
- Full Maestro tour — **`pnpm verify:full`** before TestFlight / major ship; not CI on every commit.
- Medusa route tests — on API/backend changes (goal verify with `SCOPE=api`).

### Platform guard jobs (blocking on `main`)

| Job | Script | Catches |
|---|---|---|
| `mobile-ios-guard` | `verify-mobile-deps.sh` + `verify-mobile-bundles.sh` | Wrong RN/expo-modules-core, global RN override, tiny Metro bundle, `.easignore` excluding `ios/` |
| `web-pwa-guard` | `verify-web-pwa.sh` | Missing manifest/icons/sw, failed `next build`, build-fingerprint unit tests |

### Local verify commands (fresh clone)

```bash
pnpm verify:wip                   # Mid-goal: no tests
SCOPE=<area> pnpm verify:goal     # Goal done — see goal-workflow.md
pnpm verify:full                  # Milestone: goal + full tour + API smoke
pnpm verify:quick                 # One-off fix outside a goal

pnpm verify:mobile-deps           # dependency invariants
pnpm verify:mobile-bundles        # expo export bundle > 5MB
pnpm verify:web-pwa               # PWA assets + production build (local)
pnpm railway:verify-pwa           # Live Railway PWA — X-SHC-Railway-Build-Id header
pnpm setup:ios-dev                # macOS: install + all mobile guards + pod rebuild
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

- Contracts Track ensures all schemas are testable (`SCOPE=contracts` at goal close).
- Backend Track owns workflow and module tests (`SCOPE=api`).
- Mobile Track owns Maestro flows and component tests (feature `SCOPE` or `mobile`).
- Infra Track owns CI and guard scripts (`SCOPE=infra` / `railway`).
- Content Track owns seed validation (`SCOPE=content`).

**Rule:** No PR merges without green tests at the appropriate tier. Flaky tests are treated as production incidents.

**Hardening + Integration wave:** Maestro flow stubs in apps/mobile/e2e/ (onboarding.yaml, full-order-fulfil.yaml covering PDPA consent at checkout + cook onboarding, state transitions + money, credits-earnings-payout.yaml). Documented run via `maestro test`. `pnpm verify:local` added for seed+typecheck+basic order/money/credit flow sim (used in local host verification). All new areas (explicit PDPA consent flows, audit logs with before/after, ErrorBoundaries, rate limit stubs, obs perf in hooks) now in mandatory coverage. Railway-hosted Medusa in pyramid for integration wiring. See LOCAL_TESTING.md checklist + phases.