# Production Testing Strategy

**Related Files:**
- [README.md](./README.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [ERROR_CODES.md](../ERROR_CODES.md)

**Last Updated:** 2026-06-29 (launch-readiness loop) — Medusa Vitest route integration tests added for listing publish, product detail display fields, and compliance docs with 80%+ line/function/statement coverage gate on covered launch-critical routes.
**Owners:** Infra Track (backend & CI), Mobile Track (E2E & Maestro)

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

- `turbo test` must pass on every PR.
- Typecheck (`turbo typecheck`) is blocking.
- E2E Maestro suite runs on `integrate/phase-N` branches before merge.
- Coverage thresholds enforced (core contracts > 90%).
- Medusa route coverage gate: `pnpm --filter medusa test` runs handler-level integration tests with coverage thresholds (80%+ line/function/statement for the initially covered launch-critical route surface).

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
