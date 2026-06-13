# Cron Jobs & Scheduled Tasks

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../09-order-state/09-order-state.md](../09-order-state/09-order-state.md)
- [DECISION_TREES/commission-structure.md](../DECISION_TREES/commission-structure.md)
- [production/observability.md](../production/observability.md)

**Last Updated:** 2026-06-13 (Backend + Infra Tracks own)
**Owners:** Backend Track (job logic), Infra Track (scheduling & reliability)

## Scheduled Jobs

| Job                        | Schedule     | Owner     | Purpose                                      | Failure Handling |
|----------------------------|--------------|-----------|----------------------------------------------|------------------|
| Weekly Payout Batch        | Every Monday | Backend   | Calculate commissions, create payout records | Alert + manual retry |
| Availability Cleanup       | Daily        | Backend   | Remove past slots, suggest future            | Silent (idempotent) |
| Compliance Expiry Check    | Daily        | Backend   | Notify cooks of expiring SFA/WSQ docs        | Retry + ops alert |
| Platform Stats Aggregation | Hourly       | Backend   | Update `shc_platform_stat` for dashboards    | Best effort |
| Order Escalation           | Every 15 min | Backend   | Auto-cancel unpaid or unaccepted orders      | Full audit log |
| Notification Retry         | Every 5 min  | Backend   | Retry failed push/SMS                        | Exponential backoff |

## Implementation

- All jobs run inside the dedicated `worker` Railway service.
- Use BullMQ or similar queue for reliability and retry.
- Every job execution is logged with duration, success/failure, and affected record counts.
- Idempotency keys prevent duplicate processing.

## Multi-Agent Notes

Backend Track owns job implementations. Infra Track ensures worker service health and alerting on job failures.

**Rule:** All cron jobs must be observable and restartable. No silent failures.
