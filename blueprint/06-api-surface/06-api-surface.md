# 06 — API Surface (Canonical Routes)

**Related Files:**
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../11-medusa-modules/11-medusa-modules.md](../11-medusa-modules/11-medusa-modules.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)

**Contracts Track owns this file after Phase 0.**

## Standard Medusa Store API (Use SDK)

(Full list from original blueprint preserved — customer register/login, cart, line item, complete, orders, etc.)

## Cook Auth Actor Routes

(Full register/login/reset for `cook` actor type — creates shc_cook row)

## SHC Store API (`/store/shc/*`)

All routes require Authorization except public ones. Full table of 30+ routes preserved (upload, cooks, products/search, profile, compliance, orders, messages, review, push-token, etc.).

## SHC Admin API (`/admin/shc/*`)

Verification, payments confirm, disputes, payouts, ledger, commission-rules, exports, receipts.

## Internal Worker Routes (`/admin/shc/internal/*`)

Protected by WORKER_API_KEY (certificates, payouts, analytics, digest).

**Production Note:** Every route must have Zod validation + typed error codes. See production-hardening.md.