# Phase 4 — Customer Discovery

**Related Files:**
- [../01-product-scope/01-product-scope.md](../01-product-scope/01-product-scope.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [../08-marketplace-rules/08-marketplace-rules.md](../08-marketplace-rules/08-marketplace-rules.md)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)

**Track Assignment:** Mobile + Backend + Content

## Tasks (Deterministic)

### 4.1 Public Homepage & Discovery Polish (Mobile)
**Output:** Hero, search bar, occasion banners, cuisine grid, cook cards, social proof counters  
**Done when:** All four discovery modes live; fuzzy search + natural language ready (AI layer stub)

### 4.2 Dish Detail & Trust Signals (Mobile + Content)
**Output:** Video player, ingredient disclosure tiers, allergen alert, calorie traffic light, review summary, first-time collection guide  
**Done when:** Full trust architecture layer 1-3 visible and interactive

### 4.3 Cart & Single-Cook Enforcement (Backend)
**Output:** Cart guards, cook conflict modal, portion calculator  
**Done when:** Multi-cook cart blocked; real-time earnings preview on pricing

### 4.4 Customer Account & Profile (Mobile)
**Output:** `/account/profile`, orders, addresses, dietary prefs, Home Credits stub  
**Done when:** Customer can manage profile; search history builds personalization (behavioural only)

### 4.5 Unmet Demand & Analytics Hooks (Backend)
**Output:** Failed search logging, demand gap widgets for cooks/ops  
**Done when:** Data pipeline ready for Phase 9 mining

**Stitching Checkpoint 4:** Full public discovery + cart flow live on mobile; customer can reach checkout gate. All content and trust copy rendered.

**Mobile-Agent 2026-06-14:** 4.1-4.4 done: public homepage/discover polished (search, occasion banners, cuisine, cook cards, counters), dish detail (3-tier ingredients, video stub, allergen, calorie, heritage archive), cart single-cook + earnings, customer profile/orders stub, account. All wired to typed hooks + shc-ui. SG taste full (HDB, heritage 1972 etc).