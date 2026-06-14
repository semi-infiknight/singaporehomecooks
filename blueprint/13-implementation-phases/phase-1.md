# Phase 1 — Platform Foundation

**Related Files:**
- [../02-stack/02-stack.md](../02-stack/02-stack.md)
- [../03-railway/03-railway.md](../03-railway/03-railway.md)
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../07-auth/07-auth.md](../07-auth/07-auth.md)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Track Assignment:** Infra + Contracts + Backend (parallel where possible)

## Tasks (Deterministic)

### 1.1 Railway Project Setup (Infra Track)
**Output:** Full Railway project with Postgres, Redis, MinIO, env groups for staging/prod  
**Done when:** Health endpoints return 200, daily backups + PITR enabled, MinIO buckets created, Railway domain live  
**Production Gate:** All services in single Railway project; no external vendors for core infra; documented in 03-railway.md

### 1.2 Medusa Core Bootstrap (Backend Track)
**Output:** Medusa v2 project in monorepo with custom shc- modules scaffolded  
**Done when:** `medusa develop` runs, Admin UI accessible, basic product CRUD works, custom module registration verified  
**Production Gate:** All Medusa services use Railway Postgres/Redis; no Supabase remnants  
**WAVE 1 STATUS: DONE** (modules shc-*, workflows, subscribers, critical /store/shc + /admin/shc routes, bootstrap script, seed contracts-validated, health+Zod+errors, local turbo/dev setup). See 11-medusa-modules.md for details.

### 1.3 Monorepo & Tooling (Infra Track)
**Output:** Turborepo structure with packages/ for types, business-rules, shared; pnpm workspaces  
**Done when:** `turbo build && turbo test` passes; TypeScript paths configured; lint + typecheck in CI

### 1.4 Data Model Freeze Prep (Contracts Track)
**Output:** Full Zod schemas + Drizzle/Postgres migrations in packages/shc-types and Medusa custom entities  
**Done when:** 05-data-model.md fully implemented as Zod + DB tables; seed data validates  
**WAVE 1:** Medusa migrations + entities for shc_* tables implemented; seed in apps/medusa/scripts/seed.ts validates against @shc/types. Contracts freeze in progress.  
**Completed:** 2026-06-14 by Contracts-Agent — Wave 1: ALL tables in 05 (shc_* + links) have matching .strict() Zod in @shc/types/src/schemas/* ; exported; 05 updated with exact columns; business-rules + contract tests validate payloads. Typecheck + tests green. (See phase-0 contracts section + INDEX.md)

### 1.5 API Surface Skeleton (Backend + Contracts)
**Output:** OpenAPI-style routes in 06-api-surface.md implemented as Medusa endpoints + custom routes  
**Done when:** All core routes (store, cook, admin, internal) stubbed with Zod validation and error codes from ERROR_CODES.md

### 1.6 Auth & RBAC Foundation (Backend + Contracts)
**Output:** Medusa auth + Better Auth integration for extended roles (cook, ops, ceo); actor tables  
**Done when:** Login flows for all roles work; RLS policies or API-layer auth tested; linked to 07-auth.md

**Stitching Checkpoint 1:** All infra live, monorepo builds clean, contracts validated, basic Admin + mobile shell runnable. Update INDEX.md and freeze phase-1 deliverables.