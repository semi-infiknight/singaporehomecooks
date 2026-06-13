# Parallel Tracks for Multi-Agent Collaboration

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [stitching-protocol.md](./stitching-protocol.md)
- [self-updating-rules.md](./self-updating-rules.md)
- [../13-implementation-phases/README.md](../13-implementation-phases/README.md)

## Track Definitions (5 Primary Tracks)

Agents are assigned one primary track. They may read other tracks for context but only edit files within their ownership + the shared contracts.

### 1. Infra Track (Railway, CI, Observability, Deployment)
**Owner:** Infra Agent  
**Primary Files:**
- `03-railway.md`
- `04-monorepo.md`
- `production/observability.md`
- `production/testing-strategy.md` (CI parts)
**Responsibilities:** Railway services, env groups, health/readiness, GitHub Actions, MinIO buckets, worker service, backups, secrets.

### 2. Contracts Track (Types, Business Rules, Schemas, Validation)
**Owner:** Contracts Agent  
**Primary Files:**
- `05-data-model.md`
- `06-api-surface.md`
- `08-marketplace-rules.md`
- `09-order-state.md`
- `multi-agent/production-hardening.md` (validation rules)
**Responsibilities:** All Zod schemas, error codes, business rule functions, module links. This track freezes first (end of Phase 0) and is read-only for other agents after v1.

### 3. Backend Track (Medusa Modules, APIs, Workflows, Admin, Worker Jobs)
**Owner:** Backend Agent  
**Primary Files:**
- `11-medusa-modules.md`
- `06-api-surface.md` (implementation of routes)
- `07-auth.md`
- `13-implementation-phases/phase-*.md` (backend tasks)
- `production/compliance-pdpa.md`
**Responsibilities:** shc-* modules, custom /store/shc and /admin/shc routes, workflows, subscribers, Admin widgets, internal worker routes, ledger, payouts, PayNow provider.

### 4. Mobile Track (Expo App, Screens, Hooks, Push, Chat)
**Owner:** Mobile Agent  
**Primary Files:**
- `10-mobile.md`
- `12-shared-components.md`
- `13-implementation-phases/phase-*.md` (mobile tasks)
- `production/testing-strategy.md` (Maestro flows)
**Responsibilities:** All Expo Router routes, gluestack UI, TanStack Query hooks, auth flows, OrderChat, PayNowPanel, ListingWizard, dashboard, E2E Maestro tests.

### 5. Content & Seed Track
**Owner:** Content Agent  
**Primary Files:**
- `01-product-scope.md`
- `14-founder-inputs.md`
- `15-calendar.md`
- `16-references.md`
- `00-locked-decisions.md` (prerequisites)
**Responsibilities:** Markdown content (how-it-works, trust-and-safety, paynow-flow), seed scripts, for-cooks page, founder input tracking, calendar updates.

## Track Assignment Example (Phase 1)

- Infra Agent → Tasks 1.1, 1.2, 1.3, 1.9
- Contracts Agent → 1.4 (shc-config), 1.7 (cook actor)
- Backend Agent → 1.4, 1.7, 1.8
- Mobile Agent → 1.5, 1.6, 1.7
- Content Agent → 0.3, 0.4, 0.5

Agents work in parallel after contracts freeze. Stitching agent coordinates merges.

## Branch & PR Rules per Track

- Feature branches: `feat/<track>-<phase>-<ticket-id>`
- Only Contracts Agent may edit `05-data-model.md` and `06-api-surface.md` after Phase 0
- All other agents open PRs against `integrate/phase-N` (see stitching-protocol.md)