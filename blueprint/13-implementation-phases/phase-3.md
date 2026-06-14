# Phase 3 — Listings

**Related Files:**
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../08-marketplace-rules/08-marketplace-rules.md](../08-marketplace-rules/08-marketplace-rules.md)
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [../12-shared-components/12-shared-components.md](../12-shared-components/12-shared-components.md)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)

**Track Assignment:** Backend + Mobile + Content

## Tasks (Deterministic)

### 3.1 Dish Listing Creation (Mobile + Backend)
**Output:** `/cook/listings/new`, edit, with ingredient tiers, AI description gen, photo upload (MinIO)  
**Done when:** Cook can create dish with 3-tier ingredients, photo/video, price calculator, publish

### 3.2 Occasion & Package Listings (Backend)
**Output:** Support for occasion packages, corporate, multi-dish; linked to Medusa products/variants  
**Done when:** Medusa product model extended for SHC occasion types; search indexes work

### 3.3 AI Photo Assessment & Calorie Engine (Backend)
**Output:** Integration with AI SDK for photo quality tips and calorie estimation on upload  
**Done when:** Instant feedback on upload; badges and filters functional; confidence scoring

### 3.4 Customer Browse & Discovery (Mobile)
**Output:** Public discovery screens: occasion-first, cuisine grid, search with synonym map, filters  
**Done when:** Browse → dish detail → add-to-cart works; dietary prefs applied; no dead-end searches

### 3.5 Cook Collaboration Board (Phase 3+)
**Output:** `/cook/collaboration` for posting large-order opportunities  
**Done when:** Basic board + manual matchmaking for large orders; lead cook accountability enforced

**Stitching Checkpoint 3:** Cook can list dish end-to-end; customer can discover and add to cart (single-cook enforced). All production gates from production-hardening.md passed.

**Mobile-Agent 2026-06-14 update:** 3.1/3.4 done: full ListingWizardStep in cook/listings (collects ingredients JSON array, occasion_tags, min_qty, price, heritage, earnings calc, publish via typed create + schema validate). Customer discovery (search fuzzy + occasion filter + calorie traffic + cook cards + product grid) complete + add-to-cart with rule enforcement. shc-ui components extracted. 