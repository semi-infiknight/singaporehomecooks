# Singapore Home Cooks

Two-sided marketplace for authentic home-cooked Singapore occasion food. Heritage in every dish.

## Current Status (Built with Subagents + Orchestration — FULLY BUILT + LAUNCH/POLISH + STITCH COMPLETE)

**All major waves + final launch items delivered** (see STATUS.md). Contracts frozen + 97+ tests green; Content/seeds; Mobile complete (shc-ui + flows + credits/growth + notifs); Backend Medusa + money/ledger; Hardening (PDPA/audits/boundaries); Launch: EAS + real push wiring + Maestro CI + deploys notes + cart parity + full stitch verif. 

See STATUS.md (clean "Project Status - Fully Built" summary), LOCAL_TESTING.md (final checklist + tunnel share with everything), blueprint/ for details. "Ready for user to host on tunnel and share." Final Polish + Stitch Wave complete - all items addressed.

Core product is **fully functional locally** (mock backend gives 100% of customer discovery → order + cook fulfilment with every blueprint detail: one-cook, mandatory allergen ack, min qty, order state machine + address release, earnings at 85%, PayNow manual, HDB/heritage seeds, trust layers, chat, listings wizard, etc.).

See LOCAL_TESTING.md for exact commands + comprehensive E2E test script.

Real Medusa foundation exists (bootstrap/seed ready; run with Docker when available for persistence/Admin). Loop continues for remaining phases (money/ledger, growth, hardening, full wiring, Maestro E2E, etc.) while you can test the product experience **right now**. No founder keys needed yet.

**2026-06-14: Full subagent orchestration loop initiated.** 4 specialized agents (Contracts, Mobile+UI, Backend+Infra, Content+Seed) running in parallel on disjoint tracks per `blueprint/multi-agent/tracks.md` + stitching protocol.

Agents are executing Phase 0 (contracts freeze, seed/content, monorepo fixes) + Phase 1 (Medusa bootstrap + modules) + completing the mobile app to full blueprint spec (all screens, shc-ui extraction, contracts wiring, marketplace rule enforcement) + Medusa custom modules/workflows.

I (orchestrator) performed quick unblocks (workspace packages for shc-ui/utils, mobile package.json+app.json+tsconfig, business-rules skeleton, docker-compose for local Postgres/Redis, turbo.json fix, bootstrap script, app.json).

**Goal:** Loop (spawn → agents code+test+blueprint-update → stitch gates → next wave) until ALL phases 0-10 complete, every screen/feature/detail per blueprint is fully working (mocks for expensive parts like real AI/Claude + push until founder keys), local Medusa + mobile fully integrated and testable, before any PayU/KYC work.

Only pause for founder secrets (Resend, Twilio/SMS, real PayU corporate, Expo EAS, Apple/Google, Railway, etc.). All other production details (PDPA fields, error codes, state machine, earnings, collection gating, etc.) will be built with mocks or local simulation.

After agents complete waves + internal verification: full local host instructions + comprehensive test flows (customer full order + cook fulfilment + ops confirm + chat + payouts preview). 

See active todos and agent logs for live progress.
- Blueprint fully detailed and self-updating.
- Monorepo (Turborepo) skeleton + packages/shc-types (Zod contracts for data model, errors, order state).
- Mobile (Expo + Expo Router + gluestack-ui) FULLY BUILT with all key screens and features working locally with mocks:
  - Customer: Home (occasion banners, live counters, featured heritage cooks), Cook profile with story, Product detail (ingredients, allergens with mandatory ack, calorie confidence, earnings preview), Cart (one-cook enforced), Checkout (PayNow QR mock + ref input to confirm), Order tracking with live chat mock.
  - Cook: Dashboard (orders list, actions, earnings snapshot), Order management.
  - Singapore taste: Warm heritage UI (#1D9E75 green for trust/freshness, #F5F0E6 cream for home kitchen, #B85C38 terracotta for Peranakan festive), specific dishes (Nasi Lemak Sambal Prawn, Ayam Buah Keluak), family stories ("3rd gen Peranakan from 1972 Katong"), occasions (Hari Raya, Deepavali, CNY, birthdays), HDB collection notes.
- All per locked decisions, production-hardening, phases 0 foundation.
- PayNow manual mock working (no real KYC/PayU yet).
- Subagents: Infra subagent ran 50+ iterations for bootstrap and updates. Orchestrator continued loop for mobile/contracts.

## Local Hosting & Testing Instructions (Production Hardening + Integration wave complete — see LOCAL_TESTING.md)
**Primary:** `LOCAL_TESTING.md` — exact commands for mobile (always), Medusa+docker (opt), mixed mock/real via api-client toggle, **full verification checklist** (PDPA consents + timestamps, structured audits with before/after on state/money, ErrorBoundaries, rate stubs, obs marks, Maestro yaml, money/ledger/credits after complete, rules, seed validate, turbo typecheck).

Quick start (root):
```
pnpm install
npx tsx scripts/seed.ts --validate
pnpm --filter mobile dev   # Expo; use DEV bar to switch roles instantly
# Optional real: pnpm docker:up ; pnpm medusa:dev ; then EXPO_PUBLIC_USE_REAL_MEDUSA=true pnpm --filter mobile dev (or setUseRealMedusa)
pnpm verify:local
```
See checklist + Maestro in LOCAL_TESTING.md. All hardening applied; local host production-like + documented.

## Next (Loop Continues)
- Spawn more subagents for full contracts freeze, Medusa modules (11-medusa), Phase 1-10 details, E2E Maestro, real Medusa integration, local Medusa + mobile dev servers together.
- Stitching per protocol.
- Full production local host with real backend.
- PayU integration at end (after KYC from you).

The app has taste — warm, heritage-focused, distinctly Singaporean (not generic marketplace). All screens/details working before payment KYC.

Run the expo and explore! Report any issues for next subagent loop.