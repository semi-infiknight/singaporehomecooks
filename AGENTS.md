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

**On conflict:** blueprint wins over `.cursor/rules/`, skills, or prior chat — **except** git workflow: `.cursor/rules/git-main-direct.mdc` (work on `main`) overrides blueprint feature-branch naming for day-to-day work.

## Git workflow

**Commit directly to `main`.** No feature branches unless explicitly requested. See `.cursor/rules/git-main-direct.mdc`.

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

### Railway CLI

The `RAILWAY_TOKEN` secret is actually an **account/team API token** (workspace: `captmathur's Projects`), not a project token. Non-obvious usage:

- The CLI must receive it as `RAILWAY_API_TOKEN`, and `RAILWAY_TOKEN` must be **unset** (otherwise the CLI treats it as an invalid project token: "Invalid RAILWAY_TOKEN").
- Team tokens have no user identity, so `railway whoami`, `railway link`, and `railway list` fail. Select the project/env via env vars instead of `railway link`.
- Target project `homecooks` / env `production`: `RAILWAY_PROJECT_ID=09a28324-88a2-4ad0-aa5f-54bc2198007b`, `RAILWAY_ENVIRONMENT_ID=546be85e-73ad-4df7-b105-4bfd90b280c0`. Services: `medusa`, `web`, `worker`, `minio`, `Postgres`, `Redis`. The live Medusa is `medusa-production-d2ba.up.railway.app`.
- The CLI is not part of the update script; if missing on a fresh VM, install with `curl -fsSL https://railway.com/install.sh | sh` (lands in `~/.railway/bin`). Then e.g. `railway status`, `railway variables -s medusa`.
- The raw GraphQL API also works with the same token: `POST https://backboard.railway.com/graphql/v2` with header `Authorization: Bearer $RAILWAY_TOKEN`.

### Mobile (Expo / EAS)

Local emulators aren't possible on this Linux VM, but **EAS cloud builds and EAS Update work** (they run on Expo's servers) using the `EXPO_TOKEN` secret.

- Account: **`darksend`** (Admin). Projects: `mobile-customer` = `@darksend/shc-customer` (projectId `5c1f4300-5851-4288-9416-bd968589001a`), `mobile-cook` = `@darksend/shc-cook` (projectId `bb1c9052-df53-48fd-89e2-94ee51159bd9`).
- CLI: `EXPO_TOKEN=... npx eas-cli@latest <cmd>` (e.g. `whoami`, `build:list`, `build -p android --profile preview`, `update --channel preview`). eas-cli isn't in the update script; `npx` fetches it.
- **EAS cloud iOS simulator:** load `.agents/skills/eas-simulator/SKILL.md` before any `eas simulator:*` work (Linux cloud has no local iOS sim). Helper: `bash scripts/eas-ios-cloud-sim.sh`.
- **iOS App Store submit:** both `apps/*/eas.json` `submit.production.ios` are wired with the App Store Connect API key ID (`662S382F2P`) + issuer ID (`b0765303-705f-4cd8-84a7-fc58fb8aa5b8`) and expect the private key at `./asc-api-key.p8` (gitignored via `*.p8`). The `.p8` is stored base64 in the secret `APP_STORE_CONNECT_API_KEY_BASE64`; decode it before submitting, per app dir:
  `echo "$APP_STORE_CONNECT_API_KEY_BASE64" | base64 -d > apps/mobile-customer/asc-api-key.p8` (and same for `mobile-cook`).
- Note: secrets only inject at session start — a secret added mid-session (e.g. `EXPO_TOKEN`, `APP_STORE_CONNECT_*`) is available only in the next agent session.