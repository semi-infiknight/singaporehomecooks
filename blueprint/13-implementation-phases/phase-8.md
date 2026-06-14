# Phase 8 — Differentiation

**Related Files:**
- [../01-product-scope/01-product-scope.md](../01-product-scope/01-product-scope.md)
- [../08-marketplace-rules/08-marketplace-rules.md](../08-marketplace-rules/08-marketplace-rules.md)
- [../DECISION_TREES/*.md](../DECISION_TREES/)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)

**Track Assignment:** Backend + Mobile + Content

## Tasks (Deterministic)

### 8.1 Recipe Request & Bidding (Backend + Mobile)
**Output:** `/requests/new`, bidding flow, YouTube embed preview, cook interpretation  
**Done when:** Customer posts request → cooks bid → accept → order created

### 8.2 Corporate & Group Orders (Backend)
**Output:** Corporate signup, invoice gen, multi-dish checkout, business shell  
**Done when:** `/corporate` flows + invoice PDF work end-to-end

### 8.3 Occasion Landing Pages & Filters (Mobile + Content)
**Output:** Dedicated occasion pages, dynamic catalog filtering, package builder  
**Done when:** All occasions from product-scope filter correctly; SEO ready

### 8.4 Peer Benchmarking & Analytics (Backend)
**Output:** Cook analytics with peer pricing benchmarks, unmet demand widget  
**Done when:** `/cook/analytics` shows actionable insights

### 8.5 Heritage Recipe Archive (Mobile + Content)
**Output:** Permanent recipe section on cook profile + platform library  
**Done when:** Recipes persist even if cook inactive; rich text + photos

**Stitching Checkpoint 8:** Differentiation features (requests, corporate, occasions, heritage) fully integrated. No feature creep beyond locked scope.

**Mobile Track Progress (2026-06-14 by Mobile+Growth Subagent):** 8.1 Recipe Request & Bidding COMPLETE (customer RequestDishForm modal in profile -> createRequest shc_request; cook Collab Board in dashboard with createBid/getBids/acceptBid -> spins order + chat; useRequests/useBids/useCreate*/useAccept hooks). 8.2 Corporate/Group stub (checkout toggle + flagCorporateOrder multi-dish note + invoiceStub). 8.5 Heritage Recipe Archive COMPLETE (permanent section in cook/[slug] profile renders getHeritageArchive + published flag; cook dashboard addHeritageEntry for edit; seed from content + new entries). Occasions/peer in future. All via enriched mock + shc-ui. Updated 10-mobile/12. "Differentiation live in mock".

**Backend-Completion Wave (final, Backend track):** 8.1/8.2/8.5 BACKEND COMPLETE: Real /store/shc/requests (create/list open/get + Zod/SHCError/audit/event), /store/shc/bids (create/list/accept -> request-originated meta/order), corporate flag wired to meta/checkout/complete, heritage via new shc-heritage module + /store/shc/heritage routes (get/add). Extend shc-order-meta for origin/credits/corporate. Full parity with mock via api-client toggle. Ledger tie for flows. Seed samples. Hardening (Zod/SHC/audit) day1. Updated 06-api, 11-medusa, phases, INDEX. "Backend-Completion done for Phase 8 diff".

**Hardening + Integration wave (2026-06-14):** Cross-wave hardening + wiring + Maestro + local docs done (see phase-6). Foundation solid for diff features (mock + real toggle). Gaps: full recipe bid flows, corporate invoice, peer analytics, heritage archive persistence beyond stubs. Ready for next. Backend now provides real data.