# 03 — Railway Deployment & Infrastructure

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../../RAILWAY_DEPLOY.md](../../RAILWAY_DEPLOY.md) — step-by-step operator guide
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [production/observability.md](../production/observability.md)

**Last Updated:** 2026-06-20 (Blueprint Sync) — railway.toml (medusa), railway.web.toml, bootstrap supports HTTPS, pnpm railway:configure-web. Matches CURRENT_STATE + RAILWAY_DEPLOY.md.
**Owner:** Infra Track

## Overview

Railway hosts the **staging/production API and web** for Singapore Home Cooks. Mobile apps (Expo) are **not** deployed on Railway — they call the public Medusa URL from EAS builds.

**Operator guide:** [`RAILWAY_DEPLOY.md`](../../RAILWAY_DEPLOY.md) at repo root.

## Live staging topology (2026-06-15)

| Service | Config file | Dockerfile | Healthcheck | Purpose |
|---------|-------------|------------|-------------|---------|
| **medusa** | `railway.toml` (repo root) | `apps/medusa/Dockerfile` | `/health` | Medusa API + SHC custom routes |
| **web** | `railway.web.toml` (**required**) | `apps/web/Dockerfile` | `/` | Next.js customer web |
| **Postgres** | — | Railway template | — | Primary DB |
| **Redis** | — | Railway template | — | Cache / sessions (wire `REDIS_URL` on medusa) |

```
┌─────────────┐     ┌─────────────┐
│  web        │────▶│  medusa     │
│  (Next.js)  │     │  (API)      │
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │             │
               ┌────▼────┐   ┌────▼────┐
               │ Postgres│   │  Redis  │
               └─────────┘   └─────────┘
```

Mobile (Expo) → Medusa public URL directly.

## Critical: two config files

Root **`railway.toml` is Medusa-only**. Railway config-as-code **overrides** dashboard env vars (including `RAILWAY_DOCKERFILE_PATH`).

If the **web** service uses root `railway.toml`, it will:
1. Build `apps/medusa/Dockerfile` instead of Next.js
2. Run migrations against Postgres without `DATABASE_URL`
3. Fail healthcheck (`/health` vs Next.js `/`)

**Fix (pick one):**
- Dashboard: web service → Settings → Build → **Config file** = `railway.web.toml`
- CLI (after `railway login` + `railway link`): `pnpm railway:configure-web`

## Medusa container boot sequence

`apps/medusa/docker-entrypoint.sh`:

1. `NODE_OPTIONS=--import tsx` — load TypeScript custom modules in production
2. `medusa db:migrate`
3. `medusa user -e admin@shc.local -p supersecret` (idempotent)
4. `seed.ts` when `RAILWAY_RUN_SEED=true` (first deploy only)
5. `medusa start` on `$PORT` (Railway injects, typically 8080)

## Required Railway variables

### Medusa service

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | random 32+ chars |
| `COOKIE_SECRET` | random 32+ chars |
| `MEDUSA_DISABLE_ADMIN` | `true` |
| `MEDUSA_PUBLIC_URL` | `https://<medusa-domain>.up.railway.app` |
| `RAILWAY_PUBLIC_DOMAIN` | `<medusa-domain>.up.railway.app` |
| `RAILWAY_RUN_SEED` | `true` once, then remove |

### Web service

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SHC_API_BASE` | `https://<medusa-domain>.up.railway.app` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | from bootstrap (see below) |
| `WEB_PUBLIC_URL` | `https://<web-domain>.up.railway.app` (optional CORS) |

`NEXT_PUBLIC_*` are **build-time** — redeploy web after changing them.

## Post-deploy bootstrap

From a laptop (Medusa must be up and reachable over HTTPS):

```bash
MEDUSA_URL=https://<medusa-domain>.up.railway.app pnpm railway:init
```

`scripts/bootstrap-medusa.js` supports HTTPS URLs. It creates/reuses:
- Admin session
- Publishable API key
- Demo customer store profile
- Local `.env.local` files for mobile + web

Copy the publishable key into Railway web vars, then redeploy web.

**Do not** run `railway run medusa user` from a laptop — `DATABASE_URL` points at Railway internal Postgres and will timeout.

## Repo scripts

| Script | Purpose |
|--------|---------|
| `pnpm railway:init` | Bootstrap against remote Medusa (`MEDUSA_URL` required) |
| `pnpm railway:bootstrap` | Same bootstrap script (local or remote) |
| `pnpm railway:configure-web` | Set web service `railwayConfigFile` + redeploy |

## Smoke test (remote)

```bash
MEDUSA_URL=https://<medusa-domain>.up.railway.app pnpm verify:real-e2e
```

## Demo accounts (after seed + bootstrap)

| Role | Email | Password |
|------|--------|----------|
| Customer | `customer@shc.local` | `customersecret` |
| Cook | `rose@shc.local` | `cooksecret` |
| Admin | `admin@shc.local` | `supersecret` |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Web logs show `[shc-medusa]` / Postgres retries | Web using wrong config — `pnpm railway:configure-web` |
| Bootstrap "Medusa not reachable" on HTTPS | Fixed in `bootstrap-medusa.js` (uses `https` module) |
| Admin login 401 on Railway | Redeploy medusa (entrypoint creates admin) |
| Empty products | `RAILWAY_RUN_SEED=true` or `railway run pnpm seed` on medusa |
| Web stale API URL | Redeploy web after `NEXT_PUBLIC_*` change |
| CORS from web | Set `STORE_CORS` / `AUTH_CORS` on medusa |

## Future / not on Railway yet

| Service | Notes |
|---------|-------|
| worker | Cron / payouts / push — Phase 7+ |
| minio | Object storage — local/dev or S3 later |
| dedicated admin UI | Optional split; currently `MEDUSA_DISABLE_ADMIN=true` |

## Environment groups

- `production` — live (current `homecooks` project)
- `staging` / `preview` — per-PR ephemeral (future)
- `local` — `docker-compose` + `pnpm medusa:dev:admin`

All secrets live in Railway dashboard variables. No `.env` files committed.

## Multi-Agent Notes

- **Infra Track** owns `railway.toml`, `railway.web.toml`, Dockerfiles, `RAILWAY_DEPLOY.md`, and bootstrap scripts.
- Other tracks request new env vars via Infra; document changes here and in `RAILWAY_DEPLOY.md`.

**Infra Track Rule:** Never store secrets in code or repo. Configuration changes go through Railway UI, `railway-configure-web.mjs`, or checked-in config-as-code (non-secret only).