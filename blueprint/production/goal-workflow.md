# Goal Workflow — Batch Build, Batch Verify

**Related Files:**
- [testing-strategy.md](./testing-strategy.md)
- [../multi-agent/README.md](../multi-agent/README.md)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)
- [../multi-agent/self-updating-rules.md](../multi-agent/self-updating-rules.md)
- [../AGENTS.md](../AGENTS.md)
- `.cursor/rules/testing-tiers.mdc`
- `scripts/verify-tier.sh`

**Last Updated:** 2026-07-08 — Generalized for all tracks and goals (not UI-only).
**Owners:** All tracks — each agent owns picking the right `SCOPE` at goal close.

## What is a goal?

A **goal** is a bounded slice of work with a clear done state: one feature, one phase ticket cluster, one integration milestone, or one stitch batch. Examples:

- Family Values tray parity (UI)
- Cook listings PATCH/DELETE (API + mobile)
- Railway PWA ship pipeline (infra)
- PayNow confirmation flow (money + API)
- Web cook portal auth guards (web + auth)

A goal usually spans **multiple commits**. Tests run **once** when the goal is done — not after every commit.

## Three phases (every goal)

| Phase | Commits | Tests | Blueprint |
|-------|---------|-------|-----------|
| **Build** | Many WIP commits | **None** (optional `FILTER=pkg pnpm verify:wip`) | Batch into final commit(s) |
| **Verify** | Goal complete | `SCOPE=<area> pnpm verify:goal` **once** | Same commit or immediate follow-up |
| **Ship** | Milestone / stitch / TestFlight | `pnpm verify:full` | Stitching agent + INDEX update |

## Pick `SCOPE` (required at verify)

Use the **primary surface** you changed. If multiple apply, use the most specific; set `TOUCHES_API=1` when Medusa routes or workflows changed alongside UI.

| SCOPE | Track | Typical goal | `verify:goal` runs |
|-------|-------|--------------|-------------------|
| `contracts` | Contracts | Zod schemas, error codes, business rules | types + business-rules build & test |
| `api` / `medusa` / `backend` | Backend | Modules, routes, workflows, subscribers | medusa typecheck + tests + **Railway API smoke** |
| `infra` | Infra | CI, guards, Railway config, monorepo scripts | mobile deps/bundles + web PWA guards |
| `railway` / `deploy` | Infra | Live PWA fingerprint, deploy wiring | `pnpm railway:verify-pwa` |
| `web` / `pwa` | Mobile / Web | Next.js pages, PWA assets, cook portal web | web typecheck + `verify:web-pwa` |
| `mobile` / `expo` | Mobile | Cross-app navigation, shared hooks, Metro | both apps typecheck + mobile guards + auth Maestro |
| `ui` / `tray` / `family-values` | Mobile / UI | `@shc/ui`, trays, morph, directional tabs | ui + mobile + web typecheck, ui tests, tray Maestro |
| `auth` | Mobile + Backend | Login, session, actor guards | mobile typecheck + auth Maestro flows |
| `checkout` | Mobile + Web | Cart, allergen tray, PDP guards | customer typecheck + checkout Maestro |
| `listings` | Mobile cook + API | Listing wizard, CRUD, filters | cook typecheck + listing Maestro |
| `orders` | Mobile + API | Order tray, status, fulfilment UI | order Maestro + relevant typecheck |
| `money` / `payouts` / `credits` | Backend + Mobile | Ledger, PayNow, earnings, payouts | business-rules + medusa tests + credits Maestro |
| `onboarding` | Mobile | Cook/customer onboarding flows | onboarding Maestro (both apps) |
| `content` / `seed` | Content | Seed data, markdown copy, founder inputs | `seed.ts --validate` |
| `pdpa` | Mobile + Backend | Consent, retention, checkout gates | checkout Maestro (consent path) + seed validate |

**Composite goals:** If you shipped API + mobile in one goal, prefer `SCOPE=api` when routes changed, or `SCOPE=mobile` with `TOUCHES_API=1`.

## Commands

```bash
# During goal — default: nothing
pnpm verify:wip                              # explicit no-op
FILTER=@shc/ui pnpm verify:wip               # optional ~30s typecheck

# Goal done — pick SCOPE from table above
SCOPE=api pnpm verify:goal
SCOPE=web pnpm verify:goal
SCOPE=tray pnpm verify:goal

# Milestone / stitch / TestFlight
pnpm verify:full

# Outside a goal (one-off fix)
pnpm verify:quick
```

Implementation: `scripts/verify-tier.sh`. Cursor rule: `.cursor/rules/testing-tiers.mdc`.

## Anti-patterns (do not repeat)

| Mistake | Cost | Correct |
|---------|------|---------|
| Maestro or `verify:real-e2e` on every WIP commit | 5–15 min × N commits | Zero tests during build; one `verify:goal` |
| `verify:full` after each small UI tweak | Full tour + API every time | `SCOPE=ui verify:goal` or `verify:quick` |
| No `SCOPE` at goal close | Agent skips scoped checks | Always set `SCOPE`; script errors if missing |
| Blueprint drift across WIP commits | Noise in history | Batch blueprint + CURRENT_STATE at goal end |
| Assuming TDD = test every commit | Slow parallel agents | TDD locally for hard logic; batch verify at goal |

**Historical example:** Family Values trays — 15+ commits each running ~5 min area verify. Correct: 5–10 build commits with zero tests → `SCOPE=tray pnpm verify:goal` once.

## Agent checklist (every goal)

1. **Start:** Read CURRENT_STATE + track + phase; name the goal and pick future `SCOPE`.
2. **Build:** Ship commits freely; no Maestro, no `verify:real-e2e`, no `verify:quick` unless debugging outside the goal.
3. **Verify:** Run `SCOPE=* pnpm verify:goal`; fix failures before declaring done.
4. **Document:** Patch blueprint + CURRENT_STATE + INDEX in the same commit window as verify.
5. **Ship (if milestone):** Stitching agent runs `pnpm verify:full` on `integrate/*` (see stitching-protocol).

## Stitching integration

- Feature agents: `SCOPE=<track-area> pnpm verify:goal` before PR label **Ready for Integration**.
- Stitching agent: `pnpm verify:full` on `integrate/phase-N-*` before merge to `main`.
- CI: fast gates every push; `verify:real-e2e` only on `integrate/*` + manual dispatch (see testing-strategy.md).