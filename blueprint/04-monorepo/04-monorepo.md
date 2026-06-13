# 04 — Monorepo Structure

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [../03-railway/03-railway.md](../03-railway/03-railway.md)
- [../production/testing-strategy.md](../production/testing-strategy.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Last Updated:** 2026-06-13 (Infra Track owns after Phase 0)
**Owner:** Infra Track

## Overview

The Singapore Home Cooks platform is managed as a Turborepo monorepo. This structure supports true parallel development across the five tracks (Infra, Contracts, Backend, Mobile, Content) while enforcing a single source of truth for dependencies, TypeScript contracts, build pipelines, and environment configuration.

The monorepo eliminates "works on my machine" issues and enables atomic changes across frontend, backend, and shared logic.

## Directory Layout

```
SingaporeHomeCooks/
├── apps/
│   ├── medusa/                 # Medusa v2 commerce engine + custom SHC modules
│   │   ├── src/modules/shc-*/   # Custom modules (cook, order-meta, compliance, etc.)
│   │   ├── src/api/store/shc/   # Custom Store API routes
│   │   ├── src/api/admin/shc/   # Custom Admin widgets & routes
│   │   ├── src/workflows/       # Order state machine, payout, compliance workflows
│   │   └── src/subscribers/     # Event-driven side effects (notifications, ledger)
│   └── mobile/                 # Expo SDK 51 + Expo Router v3 app
│       ├── app/                 # File-based routing (customer/, cook/, shared/)
│       ├── components/          # Screen-specific + shared UI
│       ├── hooks/               # TanStack Query + domain hooks
│       └── lib/                 # API client, auth, PayNow, push
├── packages/
│   ├── shc-types/              # Canonical Zod schemas, error codes, TypeScript interfaces
│   │   └── src/                 # cook.schema.ts, order.schema.ts, api-contracts.ts, etc.
│   ├── shc-ui/                 # Design system + reusable components (gluestack-ui based)
│   │   └── src/                 # Button, Card, FormField, OrderStatusBadge, etc.
│   └── shc-utils/              # Pure utilities (date formatting, currency, validation helpers)
├── turbo.json                  # Pipeline configuration (build, test, lint, typecheck)
├── package.json                # Root scripts + workspace configuration
├── tsconfig.json               # Project references for type safety
├── .github/workflows/          # CI/CD (build, test, deploy to Railway)
└── README.md
```

## Key Packages & Ownership

| Package       | Primary Owner     | Responsibilities                                                                 | Key Exports |
|---------------|-------------------|----------------------------------------------------------------------------------|-------------|
| shc-types     | Contracts Track   | All business contracts, Zod validation, error codes, shared DTOs                 | cookSchema, orderMetaSchema, apiErrorCodes |
| shc-ui        | Mobile Track      | Reusable UI primitives, theme tokens, accessibility components                   | SHCButton, OrderCard, AllergenBadge, PayNowQR |
| shc-utils     | Contracts Track   | Domain-agnostic helpers (Singapore date formats, PayNow reference generation)    | formatCurrency, generatePayNowRef, isValidCollectionSlot |
| apps/medusa   | Backend + Infra   | Commerce engine, custom modules, workflows, Admin customizations                 | shcCookModule, orderStateMachine |
| apps/mobile   | Mobile Track      | Customer and Cook experiences, push notifications, real-time chat                | useOrderChat, ListingWizard, PayNowPanel |

## Turborepo Configuration Highlights

- `turbo.json` defines pipelines with dependency graphs (e.g., `build` depends on `^build` for packages).
- Remote caching enabled for faster CI and local rebuilds.
- Environment variables are injected via Railway env groups; never committed.
- TypeScript project references ensure that changes in `shc-types` immediately surface type errors in `mobile` and `medusa`.

## Development Commands (Root)

```bash
turbo dev                 # Parallel dev servers for medusa + mobile
turbo build               # Production builds for all apps & packages
turbo test                # Run all tests (unit + integration)
turbo lint --filter=...   # Targeted linting
turbo typecheck           # Strict type checking across the monorepo
```

## Production & Deployment Notes

- Each Railway service (Medusa, Worker, MinIO, Redis, Postgres) maps to a service in the monorepo.
- Build artifacts are produced via `turbo build` and deployed as containers or Railway services.
- Shared `shc-types` ensures runtime contract validation between mobile API calls and Medusa handlers.
- All packages are published internally via workspace protocol (`workspace:*`).

## Multi-Agent Collaboration Rules

- **Infra Track** owns `turbo.json`, root `package.json`, `.github/workflows`, and Railway service definitions.
- **Contracts Track** owns everything inside `packages/shc-types`.
- **Mobile Track** owns `packages/shc-ui` and `apps/mobile`.
- **Backend Track** owns `apps/medusa` custom code.
- Any agent needing to add a new shared utility must propose it to the owning track via a stitching PR (see `multi-agent/stitching-protocol.md`).
- Never create new top-level directories without updating this document and `turbo.json`.

## Cross-References & Decision Trees

- See `03-railway.md` for service topology and environment variable groups.
- See `multi-agent/production-hardening.md` for security and observability requirements that apply to the monorepo setup.
- See `05-data-model.md` and `06-api-surface.md` for the contracts that live inside `shc-types`.
- Decision tree for "Should this live in a package or inside an app?" is documented in `multi-agent/self-updating-rules.md`.

**Infra Track Rule:** After Phase 0, only Infra Agent may modify monorepo configuration files. Other tracks must open tasks against Infra for build or dependency changes.
