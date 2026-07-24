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

### 8.5 Heritage Recipe Archive — **REMOVED (2026-07-24)**
**Was:** Permanent recipe section on cook profile + platform library (`shc_heritage` table).  
**Now:** Dish story = listing `description`; cook bio = `cook.story`. No separate archive module.

**Stitching Checkpoint 8:** Differentiation features (requests, corporate, occasions) fully integrated. No feature creep beyond locked scope.

**Mobile Track Progress (2026-06-14):** 8.1 Recipe Request & Bidding COMPLETE. 8.2 Corporate/Group stub. 8.5 heritage archive **removed 2026-07-24** (replaced by listing `description` + cook `story`).

**Backend-Completion Wave (final, Backend track):** 8.1/8.2 BACKEND COMPLETE: Real /store/shc/requests, /store/shc/bids, corporate flag wired. `shc-heritage` module removed 2026-07-24.

**Hardening + Integration wave (2026-06-14):** Cross-wave hardening + wiring + Maestro + local docs done (see phase-6). Gaps: full recipe bid flows, corporate invoice, peer analytics.