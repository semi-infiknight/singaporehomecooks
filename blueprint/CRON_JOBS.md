# Cron Jobs & Scheduled Tasks

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../09-order-state/09-order-state.md](../09-order-state/09-order-state.md)
- [DECISION_TREES/commission-structure.md](../DECISION_TREES/commission-structure.md)
- [production/observability.md](../production/observability.md)

**Last Updated:** 2026-07-09 (Tiffin weekly orders cron in worker)
**Owners:** Backend Track (job logic), Infra Track (scheduling & reliability)

## Scheduled Jobs

| Job                        | Schedule     | Owner     | Purpose                                      | Failure Handling |
|----------------------------|--------------|-----------|----------------------------------------------|------------------|
| Weekly Payout Batch        | Every Monday | Backend   | Calculate commissions, create payout records | Alert + manual retry |
| **Tiffin weekly orders**   | Mon 08:00 UTC | Worker | `scripts/tiffin-weekly-orders.ts` → `shc_order_meta` (idempotent `TIFFIN-*` order_ids) | Logged in worker; manual rerun safe |
| Availability Cleanup       | Daily        | Backend   | Remove past slots, suggest future            | Silent (idempotent) |
| Compliance Expiry Check    | Daily        | Backend   | Notify cooks of expiring SFA/WSQ docs        | Retry + ops alert |
| Platform Stats Aggregation | Hourly       | Backend   | Update `shc_platform_stat` for dashboards    | Best effort |
| Order Escalation           | Every 15 min | Backend   | Auto-cancel unpaid or unaccepted orders      | Full audit log |
| **Review prompt**          | Every 15 min | Worker    | ~1h after collection → customer review notif (taste/comms/presentation/qty/oily/spicy) | Idempotent `review_prompt:{orderId}` |
| Notification Retry         | Every 5 min  | Backend   | Retry failed push/SMS                        | Exponential backoff |

## Implementation

- All jobs run inside the dedicated `worker` Railway service.
- Use BullMQ or similar queue for reliability and retry.
- Every job execution is logged with duration, success/failure, and affected record counts.
- Idempotency keys prevent duplicate processing.

**Tiffin (2026-07-09):** Worker `apps/worker/src/index.ts` schedules Monday 08:00 UTC; spawns `apps/medusa/scripts/tiffin-weekly-orders.ts` via `resolveMedusaScriptPath()`. Materialization in `apps/medusa/src/lib/shc-tiffin-weekly-orders.ts`.

**Phase 6 (2026-06-14 Backend-Money-Agent):** Weekly Payout implemented as local sim script (apps/medusa/scripts/weekly-payout.ts) - idempotent, uses contracts + business-rules 15%, posts to ledger/payout_batch, verifies double-entry, auto-approves with sim transfer_ref. Run manually (documented in medusa README/bootstrap). Node-cron stub comment included for worker. Full infra cron later.

## Multi-Agent Notes

Backend Track owns job implementations. Infra Track ensures worker service health and alerting on job failures.

**Rule:** All cron jobs must be observable and restartable. No silent failures.
