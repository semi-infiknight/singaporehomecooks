# Production Testing Strategy

**Related Files:**
- [README.md](./README.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [ERROR_CODES.md](../ERROR_CODES.md)

**Last Updated:** 2026-06-13 (Infra + Mobile Tracks own)
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

## Multi-Agent Notes

- Contracts Track ensures all schemas are testable.
- Backend Track owns workflow and module tests.
- Mobile Track owns Maestro flows and component tests.
- Infra Track owns the CI configuration and test environment parity.

**Rule:** No PR merges without green tests. Flaky tests are treated as production incidents.
