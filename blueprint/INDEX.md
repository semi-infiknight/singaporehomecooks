# Blueprint Index — Navigation Only

**Last updated:** 2026-08-10
**Live state:** [CURRENT_STATE.md](./CURRENT_STATE.md) — the only integration snapshot. This file is a map, not a changelog.

**Cold start:** [README.md](./README.md) → **INDEX.md** → [CURRENT_STATE.md](./CURRENT_STATE.md) → [AGENT_PLAYBOOK.md](./AGENT_PLAYBOOK.md) → section below for your task.

Do not use root `STATUS.md` (stale). Do not duplicate facts from `CURRENT_STATE.md` here.

---

## Agent protocols

| Doc | Use when |
|-----|----------|
| [AGENT_PLAYBOOK.md](./AGENT_PLAYBOOK.md) | Build / taste / verify loop |
| [agent/build-protocol.md](./agent/build-protocol.md) | Wiring, Railway-only, blast radius |
| [agent/design-taste.md](./agent/design-taste.md) | UI, tri-platform, `brand.md` |
| [agent/verify-protocol.md](./agent/verify-protocol.md) | `FLAVOUR` + `SCOPE` at goal close |
| [production/testing-flavours.md](./production/testing-flavours.md) | What to skip vs never skip |
| [multi-agent/self-updating-rules.md](./multi-agent/self-updating-rules.md) | Blueprint patch checklist |

---

## Core sections (numbered)

| # | File | Contains |
|---|------|----------|
| 00 | [00-locked-decisions/](./00-locked-decisions/00-locked-decisions.md) | Fixed decisions, bootstrap checklist |
| 01 | [01-product-scope/](./01-product-scope/01-product-scope.md) | Product boundaries |
| 02 | [02-stack/](./02-stack/02-stack.md) | Tech stack |
| 03 | [03-railway/](./03-railway/03-railway.md) | Deploy topology, env, services |
| 04 | [04-monorepo/](./04-monorepo/04-monorepo.md) | Workspace layout, turbo |
| 05 | [05-data-model/](./05-data-model/05-data-model.md) | Tables, modules, columns |
| 06 | [06-api-surface/](./06-api-surface/06-api-surface.md) | Full route catalog + admin ops |
| 07 | [07-auth/](./07-auth/07-auth.md) | Auth flows, JWT, cook vs customer |
| 08 | [08-marketplace-rules/](./08-marketplace-rules/08-marketplace-rules.md) | Commission, cart, reviews |
| 09 | [09-order-state/](./09-order-state/09-order-state.md) | Order state machine |
| 10 | [10-mobile/](./10-mobile/10-mobile.md) | Expo routes, Maestro flows, mobile contracts |
| 11 | [11-medusa-modules/](./11-medusa-modules/11-medusa-modules.md) | Medusa module internals |
| 12 | [12-shared-components/](./12-shared-components/12-shared-components.md) | `@shc/ui` file map + web mirrors |
| 13 | [13-implementation-phases/](./13-implementation-phases/README.md) | **Historical** phase plans — not live state |
| 14–16 | founder-inputs, calendar, references | Supporting material |

---

## Production & ops

| File | Contains |
|------|----------|
| [ERROR_CODES.md](./ERROR_CODES.md) | `SHC-*` codes + ops actions |
| [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) | Manual ops |
| [CRON_JOBS.md](./CRON_JOBS.md) | Worker schedules |
| [FEATURE_FLAGS.md](./FEATURE_FLAGS.md) | Feature toggles |
| [DECISION_TREES/](./DECISION_TREES/) | Edge-case policies |
| [production/](./production/README.md) | Testing strategy, observability, PDPA |

---

## Multi-agent

| File | Contains |
|------|----------|
| [multi-agent/README.md](./multi-agent/README.md) | Tracks overview |
| [multi-agent/tracks.md](./multi-agent/tracks.md) | Ownership by track |
| [multi-agent/stitching-protocol.md](./multi-agent/stitching-protocol.md) | Integration merges |

---

## Task routing (quick)

| Task type | Read first |
|-----------|------------|
| New store/admin route | `06-api-surface.md`, `05-data-model.md`, `CURRENT_STATE.md` §5 |
| Mobile screen / wiring | `10-mobile.md`, `12-shared-components.md`, `CURRENT_STATE.md` §4 |
| UI / brand change | `brand.md`, `12-shared-components.md`, tri-platform skill |
| Railway / deploy | `03-railway.md`, `RAILWAY_DEPLOY.md`, `CURRENT_STATE.md` §7–8 |
| Verify tier pick | `production/testing-flavours.md`, `AGENT_PLAYBOOK.md` |
| Parallel agents | `multi-agent/tracks.md`, `stitching-protocol.md` |

---

## Mirrors (non-canonical)

- `.cursor/rules/*.mdc` — must match blueprint
- `.agents/skills/*` — procedural; blueprint wins on conflict
- Root `AGENTS.md` — pointer into this folder

**Deprecated:** root `Singapore_Home_Cooks_Builder_Blueprint.md`, `.hermes/plans/*` — content lives under `blueprint/`.

---

## Self-update rule

Patch `CURRENT_STATE.md` + the touched section file + this file's **Last updated** line when integration reality changes. Do not append changelog blocks here — put facts in `CURRENT_STATE.md` only.
