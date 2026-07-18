# Agent Entry — Singapore Home Cooks

**This repository is maintained by AI agents only.**

## Production rule (non-negotiable)

**Always take the path of least blast radius.**  
API / web / pure JS first; native rebuild last. No “while I’m here” scope creep.  
Full rule: [blueprint/agent/build-protocol.md](./blueprint/agent/build-protocol.md) § **NON-NEGOTIABLE: path of least blast radius**.

## Canonical brain: `blueprint/`

Read in order:

1. [blueprint/README.md](./blueprint/README.md)
2. [blueprint/CURRENT_STATE.md](./blueprint/CURRENT_STATE.md)
3. [blueprint/AGENT_PLAYBOOK.md](./blueprint/AGENT_PLAYBOOK.md)
4. [blueprint/AGENTS.md](./blueprint/AGENTS.md)

Protocols: `blueprint/agent/build-protocol.md` · `design-taste.md` · `verify-protocol.md`

**On conflict:** blueprint wins over `.cursor/rules/`, skills, or prior chat.

## Quick verify

```bash
FLAVOUR=polish SCOPE=web pnpm verify:goal   # visual goal
FLAVOUR=wiring SCOPE=checkout pnpm verify:goal
pnpm verify:full                            # milestone only
```

## Subagent delegation

Pass subagents: goal name, `FLAVOUR`, `SCOPE`, and links to relevant blueprint section files. Subagents must self-update blueprint on completion.

## Cursor Cloud specific instructions

Environment is headless Linux (Chrome available; **no Android/iOS emulators or devices**). Node 22 + pnpm 11.1.3 are preinstalled; the startup update script runs `pnpm install`, whose `postinstall` runs `pnpm env:sync` and writes `.env.local` for all clients pointing at the remote **Railway Medusa** backend. No local Postgres/Redis/Medusa (`docker:up`, `medusa:dev`) is needed for client work — all clients use Railway.

- **Only the web app is runnable/testable here.** `pnpm web:dev` → Next.js on `http://localhost:3001` (Next 16 + React 19, Turbopack). The two Expo apps (`mobile-customer` :8081, `mobile-cook` :8082) require emulators and cannot be exercised on this VM; avoid root `pnpm dev` (it starts Expo Metro servers too) — use `pnpm web:dev`.
- Demo logins (seeded on Railway): `customer@shc.local` / `customersecret`, `rose@shc.local` / `cooksecret`, `admin@shc.local` / `supersecret`.
- `@shc/ui` is consumed as **source** (`main` = `src/index.ts`), so no package build is needed to run web. Note `@shc/ui`'s `build` script runs its Vitest suite, and `pnpm turbo build --filter='./packages/*'` currently fails on 2 pre-existing content-assertion tests (they grep mobile source for strings that were refactored) — this is not an environment break; prefer per-app `pnpm --filter web typecheck|test`.
- Web checks that pass cleanly: `pnpm --filter web typecheck` and `pnpm --filter web test`. `pnpm --filter web lint` runs but reports many pre-existing lint errors (not an env issue).