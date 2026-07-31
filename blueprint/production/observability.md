# Production Observability

**Related Files:**
- [README.md](./README.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [../03-railway/03-railway.md](../03-railway/03-railway.md)
- [ERROR_CODES.md](../ERROR_CODES.md)
- [OPERATIONS_RUNBOOK.md](../OPERATIONS_RUNBOOK.md)

**Last Updated:** 2026-07-19 — Cook compliance uploads (`POST /store/shc/compliance`) trigger PagerDuty info alerts via `notifyOpsComplianceDocSubmitted` + optional in-app bell for `SHC_OPS_ACTOR_ID` (default `shc_ops`). Prior: loop observability pass for 5xx alerts.
**Owner:** Infra Track

## Observability Stack

- **Logging**: Structured JSON logs (pino or equivalent) shipped to Railway + centralized aggregator.
- **Metrics**: Custom business metrics (orders per hour, cook acceptance rate, payout volume) + infrastructure metrics.
- **Tracing**: Distributed tracing for order lifecycle, payment flows, and worker jobs.
- **Alerting**: PagerDuty / OpsGenie integration for critical paths (payment failures, order state stuck, high error rate).
- **Dashboards**: Real-time views for ops team (order funnel, cook health, system saturation).

## Required Telemetry Points (from Day 1)

- Every API request (latency, status, actor type, route)
- Every state transition in the order machine
- PayNow payment success/failure with reference
- Cook compliance document upload and verification
- Worker job execution (payout batch, notification delivery)
- Authentication events (login, token refresh, failures)

## Production Alerts (Examples)

- Order stuck in `paid` > 30 minutes without cook acceptance
- Error rate > 1% on critical routes
- Payout batch failure
- Database connection pool exhaustion
- MinIO bucket quota warning

All alerts must include runbook links and actionable remediation steps.

## Current Implementation

- `apps/medusa/src/lib/shc-observability.ts` owns pino logging, trace IDs, and PagerDuty Events API delivery.
- `apps/medusa/src/lib/shc-compliance-ops-notify.ts` alerts ops when cooks upload SFA/WSQ docs (PagerDuty `info` + `shc-notification` for ops actor).
- `apps/medusa/src/api/middlewares.ts` attaches `x-request-id` + `x-trace-id`, Redis-backed rate limits on `/store/shc/*` (auth login 5/15min, register 10/hour, general 120/min per IP), records duration/status/method/path, logs structured `http.request` / `http.admin_request` events, and triggers PagerDuty alerts on 5xx.
- `apps/medusa/src/api/store/shc/ops/client-crash/route.ts` accepts client crash reports from web/mobile ErrorBoundaries (optional `SHC_CLIENT_CRASH_ALERTS=1` for PagerDuty).
- `apps/worker/src/observability.ts` emits structured JSON logs and PagerDuty alerts on job failures.
- `@shc/api-client` sends `x-request-id` on every request; `@shc/utils` `reportShcCrash` wires ErrorBoundaries.
- Launch env requirement: set `PAGERDUTY_ROUTING_KEY` to enable alert delivery; without it, alerts are logged as skipped. Optional `SHC_OPS_ACTOR_ID` for in-app ops notifications (default `shc_ops`). Set `REDIS_URL` for distributed rate limiting across Medusa replicas.

## Multi-Agent Notes

Infra Track owns the observability implementation and alert definitions. All other tracks must emit the required events and metrics defined in this document.

**Infra Rule:** Observability is not optional. Every new workflow or route must include logging and metrics from the first commit.
