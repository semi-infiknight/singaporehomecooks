# Production Observability

**Related Files:**
- [README.md](./README.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [../03-railway/03-railway.md](../03-railway/03-railway.md)
- [ERROR_CODES.md](../ERROR_CODES.md)
- [OPERATIONS_RUNBOOK.md](../OPERATIONS_RUNBOOK.md)

**Last Updated:** 2026-06-29 (loop observability pass) — Medusa `/store/shc/*` and `/admin/shc/*` now emit request-id + trace-id headers, pino JSON request logs, and PagerDuty Events API alerts on 5xx when `PAGERDUTY_ROUTING_KEY` is configured.
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
- `apps/medusa/src/api/middlewares.ts` attaches `x-request-id` + `x-trace-id`, records duration/status/method/path, logs structured `http.request` / `http.admin_request` events, and triggers PagerDuty alerts on 5xx.
- Launch env requirement: set `PAGERDUTY_ROUTING_KEY` to enable alert delivery; without it, alerts are logged as skipped.

## Multi-Agent Notes

Infra Track owns the observability implementation and alert definitions. All other tracks must emit the required events and metrics defined in this document.

**Infra Rule:** Observability is not optional. Every new workflow or route must include logging and metrics from the first commit.
