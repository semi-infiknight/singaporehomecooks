# Phase 6 — Money Engine

**Related Files:**
- [../09-order-state/09-order-state.md](../09-order-state/09-order-state.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../GST_TAX_RULES.md](../GST_TAX_RULES.md)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Track Assignment:** Backend + Contracts + Ops (Finance)

## Tasks (Deterministic)

### 6.1 PayNow Provider + Ledger (Backend + Contracts)
**Output:** shc-paynow module, double-entry ledger (shc_ledger_entry), commission engine, payout batches  
**Done when:** Mark payment sent → confirmed flow; weekly payout calc; reconciliation report

### 6.2 Payout & Reconciliation (Backend)
**Output:** `/ops/payouts`, weekly batch, Xero export, IRAS statements  
**Done when:** End-to-end payout to cook bank via PayNow reference; 100% audit trail

### 6.3 GST/Tax & Compliance Engine (Contracts)
**Output:** GST rules engine, corporate invoice generator, tax reports  
**Done when:** All GST_TAX_RULES.md implemented; invoices match Xero feed

### 6.4 Disputes & Refunds (Backend + Mobile)
**Output:** Dispute queue, refund ledger entries, Home Credits issuance on resolution  
**Done when:** Full dispute flow with 5-layer trust policy enforced

### 6.5 CEO Financial Dashboard (Mobile + Backend)
**Output:** `/ceo/financial`, live GMV, net revenue, GST readiness, payout status  
**Done when:** Real-time financial truth visible; exports work

**Stitching Checkpoint 6:** Full money engine: PayNow → payout → ledger → tax reports. All production financial gates passed. Phase 5 + 6 E2E Maestro green.

**2026-06-14 Backend-Money-Agent (Phase 6 focus, Backend track):**
- Expanded money engine: shc-ledger module (double-entry shc_ledger_entry, postCommission/postPayout services + invariant), shc-payout-batch module (weekly, status, sim transfer_ref).
- Full manual PayNow /admin/shc/payment-confirm now triggers ledger (15% platform fee + cook earnings via business-rules).
- Commission calc + ledger post on 'completed' (enhanced order-state-transition workflow + subscriber).
- weeklyPayoutWorkflow sim via apps/medusa/scripts/weekly-payout.ts (idempotent, finds completed not batched, creates batch+ledgers+payout leg, auto-approve sim, contract validate).
- API routes (Zod+SHCError+audit): /admin/shc/payouts (list/create/approve), /admin/shc/ledger (by order/cook/batch + summary), /store/shc/orders?cook_id (earnings/ledger summary added, additive).
- Seed extended: sample completed order_metas + ledger entries + 1 payout batch (validates @shc/types + rules).
- Hardening: Zod, SHC codes (existing + use), structured logger with actor/context on all money actions, double-entry verify in batch/ledgers.
- Local: pnpm medusa:dev + seed works; README+bootstrap updated with "run weekly payout sim" (tsx scripts/weekly-payout.ts).
- No contracts/schema changes (frozen @shc/types + business-rules). Targeted updates only to phase-6, 11-medusa, INDEX, CRON.
- "Money Wave ready for stitch". Remaining gaps: real bank transfer (vs sim), Xero export (Phase 6+), full GST versioned rule engine.
- Mobile can query new /store/shc/orders?cook_id=... for earnings/ledger summary (later consume /admin too).

**Hardening + Integration wave (2026-06-14 Production Hardening Subagent):** PDPA explicit consent checkboxes (onboarding cook + checkout customer) + timestamps in mock orders/users + seeds; structured audit logs (actor/action/before/after state+money) enhanced in mock-service + medusa subscribers/routes/payment-confirm; simple ErrorBoundary wraps (SHC friendly + retry) in key mobile screens/layouts; rate limit stub in api-client/mock; observability console+perf marks in hooks. Mobile api-client toggle (env/dev) to real Medusa localhost:9000 for lists/orders/complete sim with Zod fallback. Medusa /store/shc pubkey handled + auth stub. Scripts: verify:local + seed robust. Maestro .yaml stubs in apps/mobile/e2e/ (onboarding, full-order-fulfil, credits). LOCAL_TESTING.md + README updated with full host section + mixed demo + checklist. Tests enhanced (earnings/credits/PDPA). Turbo scripts improved. No core contracts changed. Self-updates to production/ + INDEX + phases. Verification: typecheck/build/seed/pnpm verify:local + sim flow passed. Gaps for future: real push (phase7), full ledger/payout cron + GST in medusa (phase6), real PayNow provider, full AI, web parity (phase10), complete Maestro CI. Local host ready with mock + Medusa foundation.