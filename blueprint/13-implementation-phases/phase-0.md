# Phase 0 — Business Prep + Contracts Freeze

**Related Files:**
- [../00-locked-decisions/00-locked-decisions.md](../00-locked-decisions/00-locked-decisions.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)

**Track Assignment:** Infra + Contracts + Content (parallel where possible)

## Tasks (Deterministic)

### 0.1 Railway Project (Infra Track)
**Output:** staging + production envs, URLs accessible  
**Done when:** Health endpoints return 200, env groups configured, backups enabled  
**Production Gate:** Railway postgres daily backups + point-in-time recovery documented in 03-railway.md

### 0.2 PayNow Flow Doc (Content Track)
**Output:** `content/paynow-flow.md`  
**Done when:** Ops steps documented and linked from 06-api-surface.md  
**Completed:** 2026-06-14 by Content + Seed Track — exact customer + 7-step ops manual (UEN verify, ref uniqueness, amount match, Admin confirm, address release, festive SLA, SHC-PAY-001 handling). See also paynow snippet in mobile checkout + seed.

### 0.3 Seed Assets (Content Track)
**Output:** 3+ dishes (Nasi Lemak Sambal Prawn, Ayam Buah Keluak, Eurasian Devil's Curry), 2 cook personas (Auntie Rose Tampines 3rd-gen Katong 1972 full story + HDB Blk 456 + collection instructions; Auntie Doris Katong Eurasian full story + Joo Chiat HDB), occasion tags with festive timing, high-quality heritage descriptions, image placeholders + production notes in `seed/assets/`  
**Done when:** Files committed and referenced in seed script  
**Completed:** 2026-06-14 — `seed/assets/cooks.json`, `dishes.json`, `occasions.json`, `image-placeholders.md`, `README.md`. Rich SG details: HDB blocks, common allergens (prawn/belacan/shellfish, peanuts/candlenut, eggs, mustard, pork traces), halal flags, Hari Raya/CNY/Deepavali/Christmas/Full Moon timing.

### 0.4 Trust Copy (Content Track)
**Output:** `content/how-it-works.md`, `trust-and-safety.md`  
**Done when:** Markdown committed and rendered in mobile public routes  
**Completed:** 2026-06-14 — Full 5-layer trust (reconciled product-scope + decision tree: video/AI, tasting, receipts/invoices, tiered guarantee >S$150, cancellation 72h/50%/<24h + address guide + counters), allergen tiers, collection (2h release, HDB specifics), policy, guarantees. Rendered via seed trustSnippets + dedicated cards/modals in app/index.tsx (Discover), product/[id], cook/[slug], cart, checkout. References to content/ files.

### 0.5 scripts/seed.ts Spec (Content + Contracts)
**Done when:** Documented seed order in README; Contracts Agent has validated all seed data against Zod schemas  
**Completed:** 2026-06-14 — `scripts/seed.ts` (loads JSON, validates shcCookSchema + shcProductMetaSchema + availability, exports typed SeedData / getSeed* / getFeaturedForHome for mobile + Medusa). `seed/index.ts` mirror for runtime typed consumption (exact same objects). Validation command: `npx tsx scripts/seed.ts --validate`. Also seed/assets/README + parity with mock-service.ts (now imports canonical seed).

### Contracts Freeze Tasks (Contracts Track — Highest Priority)
- [x] Create full `packages/shc-types` with every Zod schema from 05-data-model.md (including Phase 6/8/9 fields) — **Completed 2026-06-14 by Contracts-Agent**: 17 custom tables + medusa-links, all .strict(), exact fields, full enums, SHCErrorCode + map, contract tests (mobile mocks). 26 tests green.
- [x] Create `packages/business-rules` with 10+ unit tests per rule (single-cook, commission, portions, allergen, etc.) — **Completed 2026-06-14 by Contracts-Agent**: 8 rules (one-cook, allergen-ack, min-qty, commission, order-state, availability, portions, cook-status-gates). Clean exports from index. 95 tests (11-14 each), high coverage, uses schemas + typed SHC codes. Green.
- Freeze `contracts/v1` branch (post Wave 1; other agents read-only on 05/06 after Phase 0)
- All other agents must treat schemas as read-only after this point

**Stitching Checkpoint 0:** Integration branch merges all, runs `turbo build && turbo test`, freezes contracts, updates INDEX.md.

**WAVE 1 (Backend):** Medusa bootstrap checklist items (region/channel/location/pubkey/admin via script + DB seeds + Admin) + core modules per 00-locked + 11-medusa-modules complete for local runnable foundation. Contracts used for validation in seed/workflows/routes. (Contracts Wave 1 delivered per self-updating-rules.md)

See also: 05-data-model.md (full columns + implemented note), ERROR_CODES.md (expanded), 08-marketplace-rules.md, 09-order-state.md.

**Content Track Updates (2026-06-14):** All Phase 0 content tasks (0.2-0.5) complete. Created `content/paynow-flow.md`, `how-it-works.md`, `trust-and-safety.md`; populated `seed/assets/` (3 dishes + 2 rich cook stories + occasions); `scripts/seed.ts` + `seed/index.ts` for typed shared consumption (validated vs @shc/types); mobile public screens (discover, product, cook, cart, checkout) now render trust copy + use canonical seed data via mock-service integration. Realistic SG: HDB addresses/instructions, festive timing per 15-calendar, local allergens. See self-updating in INDEX.md. Linked from mobile + phase docs. (Owner: Content + Seed per tracks.md)