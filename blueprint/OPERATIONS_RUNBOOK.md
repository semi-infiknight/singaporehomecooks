# Operations Runbook (Production)

**Related Files:** `multi-agent/production-hardening.md`, `13-implementation-phases/phase-6.md`

## Weekly Payout Approval (Monday)
1. Stitching agent / ops runs `cron:payouts`
2. Review `GET /admin/shc/payouts/current`
3. Check for anomalies (high variance, new cooks, disputes)
4. Approve or reject batch
5. If reject → trigger manual review workflow

## Dispute Resolution SLA
- Type `customer_complaint`: 48h response, 7d resolution
- Type `cook_cancelled_late`: 24h response, 3d resolution
- Escalation: After SLA breach → founder + insurance review

## Cook Verification Rejection Reasons (Standardized)
- Invalid SFA number
- WSQ certificate expired or unreadable
- Profile story contains prohibited claims
- Multiple failed address checks

**All ops actions must be logged with reason and actor.**