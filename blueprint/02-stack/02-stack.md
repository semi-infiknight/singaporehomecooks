# 02 — Technology Stack

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../03-railway/03-railway.md](../03-railway/03-railway.md)
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Last Updated:** 2026-06-13 (Infra + Contracts Tracks own)
**Owners:** Infra Track (infrastructure), Contracts Track (contracts & validation)

## Layered Stack Overview

| Layer          | Technology                          | Role & Rationale                                                                 | Owner     |
|----------------|-------------------------------------|----------------------------------------------------------------------------------|-----------|
| Commerce Engine| Medusa v2                           | Headless commerce: products, cart, checkout, orders, auth, workflows, Admin UI   | Backend   |
| Database       | PostgreSQL (Railway managed)        | ACID-compliant primary store for all business data                               | Infra     |
| Cache / Queue  | Redis (Railway managed)             | Session, rate limiting, job queue, real-time availability cache                  | Infra     |
| Object Storage | MinIO (self-hosted on Railway)      | Compliance documents, product images, receipts, user uploads                     | Infra     |
| Backend API    | Node.js + TypeScript + Medusa       | Custom modules, workflows, subscribers, REST + (future) GraphQL                  | Backend   |
| Mobile Client  | Expo SDK 51 + Expo Router v3        | Cross-platform iOS/Android app with file-based routing                           | Mobile    |
| UI Library     | gluestack-ui + custom SHC components| Consistent design system across customer and cook experiences                    | Mobile    |
| State & Data   | TanStack Query + Zod                | Server state management + runtime schema validation                              | Mobile + Contracts |
| Payments       | PayNow (QR + reference)             | Singapore instant bank transfer — primary and only payment method for MVP        | Backend   |
| Notifications  | Expo Push + SMS (Twilio)            | Order updates, cook alerts, reminders                                            | Backend   |
| Auth           | Medusa auth_identity + custom actors| Unified identity with role-specific extensions (customer, cook, ops)             | Backend   |
| Monitoring     | Railway logs + external APM         | Metrics, traces, error tracking, uptime                                          | Infra     |
| CI/CD          | GitHub Actions + Railway            | Build, test, typecheck, deploy pipeline                                          | Infra     |
| Monorepo       | Turborepo                           | Parallel development, shared packages, consistent tooling                        | Infra     |

## Key Design Decisions

- **Medusa as Foundation**: Leverages battle-tested commerce primitives while allowing deep customization via modules and workflows. Avoids building cart/checkout from scratch.
- **TypeScript Everywhere**: Strict typing + Zod contracts eliminate entire classes of runtime errors between mobile, backend, and shared packages.
- **Expo for Mobile**: Rapid iteration, OTA updates, excellent push notification support, and single codebase for iOS/Android.
- **PayNow Only (MVP)**: Reduces payment complexity and regulatory surface area while matching Singapore user expectations.
- **Collection-Only Logistics**: Dramatically simplifies operations, insurance, and trust model compared to delivery.

## Production Requirements (Applies to All Layers)

- Every service and library must satisfy the controls in `multi-agent/production-hardening.md` from day one.
- PDPA compliance, audit logging, and data retention rules are non-negotiable.
- All inter-service communication uses validated contracts from `shc-types`.
- Feature flags control rollout of new capabilities (see `FEATURE_FLAGS.md`).

## Multi-Agent Ownership

- **Infra Track**: Hosting, databases, cache, storage, CI/CD, observability.
- **Contracts Track**: Data models, API contracts, validation schemas, error codes.
- **Backend Track**: Medusa customizations, workflows, API routes.
- **Mobile Track**: Expo app, UI components, client-side state and hooks.
- **Content Track**: Product copy, onboarding flows, founder inputs.

No layer may be modified without coordination with its owning track(s).

**Rule:** The stack is deliberately conservative and production-oriented. Novel or bleeding-edge technologies are only introduced after explicit evaluation against the production-hardening checklist.
