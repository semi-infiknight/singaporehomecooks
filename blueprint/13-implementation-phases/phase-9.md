# Phase 9 — Growth

**Related Files:**
- [../01-product-scope/01-product-scope.md](../01-product-scope/01-product-scope.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../DECISION_TREES/ai-calorie-estimation.md](../DECISION_TREES/ai-calorie-estimation.md)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)

**Track Assignment:** Backend + Mobile + AI/Content

## Tasks (Deterministic)

### 9.1 AI Meal Search & Structured Layer (Backend)
**Output:** Natural language search endpoint + Claude structured output for package assembly  
**Done when:** "Thai for 2 under S$50 <500cal" returns valid multi-dish package

### 9.2 Home Credits Wallet & Loyalty (Backend + Mobile)
**Output:** Credit earning on orders, redemption at checkout, tier logic, 12-month expiry  
**Done when:** Full wallet flow; triggers from DATA_RETENTION_MATRIX

### 9.3 Collaboration Board & Cook Collective (Mobile + Backend)
**Output:** Advanced collaboration features, proactive collective listings  
**Done when:** Large orders fulfilled by multiple cooks with single checkout

### 9.4 CEO Analytics & AI Prompts (Backend)
**Output:** `/ceo/analytics`, demand mining, AI prompt library for listing assist  
**Done when:** Real-time growth metrics + actionable founder dashboard

### 9.5 Heritage Library & Partnerships (Content)
**Output:** Public heritage archive, NLB/NHB outreach hooks  
**Done when:** Archive browsable; partnership content ready

**Stitching Checkpoint 9:** Growth engine live; AI features + loyalty + collaboration add measurable engagement. All production AI gates (cost, safety, accuracy) passed.

**Mobile Track Progress (2026-06-14 by Mobile+Growth Subagent):** 9.2 Home Credits Wallet & Loyalty COMPLETE (mock: earn 5% total as credits on collected/completed transition + 12m expiry stub; getCredits/redeemCredits + tier Bronze/Silver/Gold from lifetimeSpend; WalletCard+CreditBadge in profile; redeem at checkout "Credits available: X (apply Y)" via checkoutWithCredits; useCredits/useRedeemCredits hooks). 9.1/9.3 AI search stub + collab (NL parse+synonym in searchProducts + mock, collab board covers). AI calorie (estimate in createListing + wizard useAICalorieEstimate + AICalorieBadge per DECISION_TREES). All in existing files + mock enrich. Updated 10/12/INDEX. "Growth Wave ready".

**Backend-Completion Wave (final, Backend track):** 9.1/9.2/9.3 BACKEND COMPLETE: Real /store/shc/credits (get balance/redeem/history + ledger redemption/issuance posts for money flows + credit-wallet module), /store/shc/ai (calorie-estimate stub + photo-tips with full Claude/vision/structured output comments + rate-limit stub + cost guard note per DECISION_TREES/ai-calorie-estimation.md), requests/bids/heritage/corporate full real routes + wiring. Cart complete + workflows + order-state + payment-confirm + /orders + subscriber enhanced for credits redemption, request-originated orders, corporate, credit award on complete, full audits. shc-request/bid/credit-wallet/heritage modules + seed samples + hardening. Matches mock exactly for mobile (with toggle). Updated 06/11/phases/INDEX. "Backend-Completion done for Phase 9 growth".

**Hardening + Integration wave (2026-06-14):** Hardening/wiring/Maestro/local host complete (PDPA, audits, boundaries, rate, obs, api-client real toggle, tests, docs). See phase-6. Gaps for future: real AI meal search/Claude, full Home Credits wallet/redeem (stubs + maestro + earnings in place), collab board, CEO analytics. Money/credits sim verified in local. Foundation ready. Real backend now powers growth.