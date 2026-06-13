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

### 0.3 Seed Assets (Content Track)
**Output:** 3 dishes, 1 cook persona, photos in `seed/assets/`  
**Done when:** Files committed and referenced in seed script

### 0.4 Trust Copy (Content Track)
**Output:** `content/how-it-works.md`, `trust-and-safety.md`  
**Done when:** Markdown committed and rendered in mobile public routes

### 0.5 scripts/seed.ts Spec (Content + Contracts)
**Done when:** Documented seed order in README; Contracts Agent has validated all seed data against Zod schemas

### Contracts Freeze Tasks (Contracts Track — Highest Priority)
- Create full `packages/shc-types` with every Zod schema from 05-data-model.md (including Phase 6/8/9 fields)
- Create `packages/business-rules` with 10+ unit tests per rule (single-cook, commission, portions, allergen, etc.)
- Freeze `contracts/v1` branch
- All other agents must treat schemas as read-only after this point

**Stitching Checkpoint 0:** Integration branch merges all, runs `turbo build && turbo test`, freezes contracts, updates INDEX.md.