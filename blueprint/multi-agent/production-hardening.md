# Production Hardening Requirements (Day 1, Not Later)

**Related Files:**
- [../production/README.md](../production/README.md)
- [../production/testing-strategy.md](../production/testing-strategy.md)
- [../production/observability.md](../production/observability.md)
- [../production/compliance-pdpa.md](../production/compliance-pdpa.md)
- [tracks.md](./tracks.md)

**Rule:** Every line of code written by any agent must satisfy these requirements. No exceptions for "MVP" or "demo".

**Hardening wave complete note:** All Day1 items addressed in local (PDPA explicit checkboxes + timestamps/audit in mobile/medusa/seed; ErrorBoundaries + retry on mobile key screens; rate limit stub; obs stubs; contract tests via existing + new unit; Maestro stubs). Local host + mixed wiring + verify:local + full docs achieved. See updated production/testing-strategy, phases, LOCAL_TESTING.md, INDEX for status. Gaps tracked for later (full prod deploy, real rate middleware, tracing).

## Security (All Layers)
- JWT + actor-type auth only (no second library)
- Rate limiting on all auth and /store/shc/* routes (5 attempts/15min for login)
- All inputs validated with Zod schemas from Contracts Track (`.strict()`)
- MinIO private buckets use signed URLs only
- CORS locked after launch (no `*` in production)
- Audit logging for every ops action (verification, payout approval, dispute resolution)
- No secrets in code or logs

## Error Handling & Reliability
- Every API route returns typed error codes from the contracts error enum
- Mobile: Error boundaries + retry with exponential backoff on TanStack Query mutations
- Worker jobs: Idempotency keys + dead-letter handling
- Circuit breakers on external calls (MinIO, Resend, Expo Push)
- Graceful degradation when portions check fails at checkout

## Observability (see observability.md)
- Structured logging (pino) with request IDs on every request
- Health + readiness endpoints on medusa and worker
- Railway alerts on error rate > 1% or latency p95 > 800ms
- Mobile: Expo crash reporting + performance monitoring

## Testing (Non-Negotiable)
- Unit tests for every business rule and schema (business-rules + shc-types)
- Integration tests for every custom API route
- Maestro flows for all critical mobile paths (onboarding, order, fulfil) — run in CI on every PR
- Contract tests between tracks (Zod schema validation across API boundaries)
- Coverage threshold enforced in CI (80% overall, 95% on business rules)

## PDPA & Compliance (Singapore)
- Explicit consent checkboxes in cook onboarding and customer checkout
- Data retention policies documented (orders 7 years, customer data 3 years or deletion on request)
- Audit trail for all personal data access/modification
- See `production/compliance-pdpa.md` for full requirements

## Performance & Accessibility
- Image pipeline always produces WebP + 400px thumb
- List virtualization on browse screens
- All screens have proper labels, contrast ratios, and accessibility hints
- No blocking network calls on app launch

## Documentation
- Every new route or component must have an example in the relevant blueprint file
- Runbook updates in `03-railway.md` and `11-medusa-modules.md` when deployment or module changes

These rules are referenced by every phase file. Agents must verify compliance before marking a task complete.