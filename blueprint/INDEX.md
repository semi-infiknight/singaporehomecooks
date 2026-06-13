# Singapore Home Cooks — Canonical Blueprint (Single Source of Truth)

**Status:** Production-grade, multi-agent ready  
**Last Updated:** 2026-06-13 (merged from Builder_Blueprint.md + Multi-Agent Production Plan)  
**Location:** `blueprint/` (monorepo root)  
**Purpose:** One canonical, self-updating source of truth for all builders (human or AI agents). No information lost. All decisions, data models, APIs, phases, production requirements, and parallel execution rules live here.

## Navigation for AI Agents (Efficient Web)

Start here → follow links. Each file contains:
- Frontmatter with "Related Files" and "Depends On"
- Full original content from the locked blueprint
- Production additions and multi-agent guidance where relevant
- Cross-references using relative Markdown links

**Core Sections (read in order for context):**
- [00-locked-decisions.md](./00-locked-decisions/00-locked-decisions.md) — Fixed decisions, prerequisites, Medusa bootstrap checklist
- [01-product-scope.md](./01-product-scope/01-product-scope.md)
- [02-stack.md](./02-stack/02-stack.md)
- [03-railway.md](./03-railway/03-railway.md) — Deployment topology + env vars
- [04-monorepo.md](./04-monorepo/04-monorepo.md)
- [05-data-model.md](./05-data-model/05-data-model.md) — All tables + module links (includes Phase 6/8/9 fields)
- [06-api-surface.md](./06-api-surface/06-api-surface.md) — Store, Cook, Admin, Internal routes (full OpenAPI-style)
- [07-auth.md](./07-auth/07-auth.md)
- [08-marketplace-rules.md](./08-marketplace-rules/08-marketplace-rules.md)
- [09-order-state.md](./09-order-state/09-order-state.md)
- [10-mobile.md](./10-mobile/10-mobile.md) — Route map + critical screen contracts
- [11-medusa-modules.md](./11-medusa-modules/11-medusa-modules.md)
- [12-shared-components.md](./12-shared-components/12-shared-components.md)
- [13-implementation-phases/](./13-implementation-phases/README.md) — Per-phase breakdown (see subfolder)
- [14-founder-inputs.md](./14-founder-inputs/14-founder-inputs.md)
- [15-calendar.md](./15-calendar/15-calendar.md)
- [16-references.md](./16-references/16-references.md)

**Decision Trees & Edge Cases (Critical for Production Logic):**
- [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) — Full gap audit vs source documents
- [DECISION_TREES/cook-cancellation-after-payment.md](./DECISION_TREES/cook-cancellation-after-payment.md)
- [ERROR_CODES.md](./ERROR_CODES.md) — Centralized error catalog with ops actions
- [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md)
- [DATA_RETENTION_MATRIX.md](./DATA_RETENTION_MATRIX.md)
- [GST_TAX_RULES.md](./GST_TAX_RULES.md)
- [FEATURE_FLAGS.md](./FEATURE_FLAGS.md)
- [CRON_JOBS.md](./CRON_JOBS.md)
- [INSURANCE_LIABILITY.md](./INSURANCE_LIABILITY.md)

**Multi-Agent Execution Layer (read before starting parallel work):**
- [multi-agent/README.md](./multi-agent/README.md) — Tracks, branch strategy, delegation rules
- [multi-agent/tracks.md](./multi-agent/tracks.md) — 5 parallel tracks + ownership
- [multi-agent/stitching-protocol.md](./multi-agent/stitching-protocol.md) — Deterministic integration process
- [multi-agent/production-hardening.md](./multi-agent/production-hardening.md) — Security, observability, PDPA, testing from Day 1
- [multi-agent/self-updating-rules.md](./multi-agent/self-updating-rules.md) — How agents patch this web without conflicts

**Production & Quality Layer:**
- [production/README.md](./production/README.md)
- [production/testing-strategy.md](./production/testing-strategy.md)
- [production/observability.md](./production/observability.md)
- [production/compliance-pdpa.md](./production/compliance-pdpa.md)

**How to Navigate Efficiently (for Agents):**
1. Read `INDEX.md` + `multi-agent/README.md`
2. Jump to the section matching your assigned track/task ID (e.g., "Task 5.3 PayNow" → `06-api-surface.md` + `13-implementation-phases/phase-5.md`)
3. Follow "Related Files" and "See also" links at the top of each file
4. When context is missing, follow links to `05-data-model.md` or `06-api-surface.md`
5. After completing work, follow the self-updating rules in `multi-agent/self-updating-rules.md`

**Self-Updating Guarantee:**
This web is the **only** source of truth. The old single-file `Singapore_Home_Cooks_Builder_Blueprint.md` and the `.hermes/plans/` version are now deprecated. All future changes must be made inside `blueprint/`.

---

## Full Content Map (No Information Lost)

Every table, decision, route, task, acceptance criterion, and production requirement from the original 789-line blueprint has been preserved and distributed across these files. The multi-agent production layer has been integrated without duplication or loss.

**Deprecated Files (do not edit):**
- `Singapore_Home_Cooks_Builder_Blueprint.md` (root) — content moved here
- `.hermes/plans/2026-06-13_SingaporeHomeCooks_MultiAgent_Production_Plan.md` — content merged here

**Next Step for Agents:** Read `./multi-agent/README.md` then the section matching your current task.