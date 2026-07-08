# 03 — Railway Deployment & Infrastructure

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../../RAILWAY_DEPLOY.md](../../RAILWAY_DEPLOY.md) — step-by-step operator guide
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [production/observability.md](../production/observability.md)

**Last Updated:** 2026-07-08 (Blueprint sync) — worker + minio on Railway; `pnpm railway:wire`/`railway:ship`/`railway:verify-pwa`; explicit CORS; PWA route handlers + `X-SHC-Railway-Build-Id`. Matches CURRENT_STATE + RAILWAY_DEPLOY.md.
**Owner:** Infra Track

## Overview

Railway hosts the **staging/production API and web** for Singapore Home Cooks. Mobile apps (Expo) are **not** deployed on Railway — they call the public Medusa URL from EAS builds.

**Operator guide:** [`RAILWAY_DEPLOY.md`](../../RAILWAY_DEPLOY.md) at repo root.

## Live staging topology (2026-07-08)

| Service | Config file | Dockerfile | Healthcheck | Purpose |
|---------|-------------|------------|-------------|---------|
| **medusa** | `railway.toml` (repo root) | `apps/medusa/Dockerfile` | `/health` | Medusa API + SHC custom routes + admin `/app` |
| **web** | `railway.web.toml` (**required**) | `apps/web/Dockerfile` | `/` | Next.js customer + cook PWA + ops |
| **worker** | `railway.worker.toml` | `apps/worker/Dockerfile` | `/health` | Cron jobs, payout sim, internal Medusa calls |
| **minio** | `railway.minio.toml` | `apps/minio/Dockerfile` | — | Object storage for listing images |
| **Postgres** | — | Railway template | — | Primary DB |
| **Redis** | — | Railway template | — | Cache / sessions |

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  web        │────▶│  medusa     │────▶│   minio     │
│  (Next.js)  │     │  (API)      │     │  (storage)  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
         │ Postgres│  │  Redis  │  │ worker  │
         └─────────┘  └─────────┘  └─────────┘
```

Mobile (Expo) → Medusa public URL directly.

**Service references:** Run `pnpm railway:wire` so Railway canvas shows linked deps (`${{Postgres.DATABASE_URL}}`, `${{Redis.REDIS_URL}}`, minio vars). Hardcoded internal URLs work at runtime but break the visual graph.

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
| `MEDUSA_DISABLE_ADMIN` | `false` (admin UI at `/app`; Dockerfile uses `build:admin`) |
| `MEDUSA_PUBLIC_URL` | `https://<medusa-domain>.up.railway.app` |
| `RAILWAY_PUBLIC_DOMAIN` | `<medusa-domain>.up.railway.app` |
| `RAILWAY_RUN_SEED` | `true` once, then remove |
| `STORE_CORS` | Explicit origins: web domain + `http://localhost:3001` + mobile dev ports — **no wildcard mix** |
| `AUTH_CORS` | Same as `STORE_CORS` |

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
| `pnpm railway:configure-worker` | Add/configure worker service |
| `pnpm railway:configure-minio` | Add/configure minio service |
| `pnpm railway:wire` | Wire `${{Service.VAR}}` refs + explicit CORS on medusa |
| `pnpm railway:cleanup` | Remove orphaned Railway artifacts |
| `pnpm railway:ship` | Single-pass PWA deploy pipeline + evidence capture |
| `pnpm railway:verify-pwa` | Verify live PWA build fingerprint without redeploy |

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
| CORS from web / "Failed to fetch" on login | Run `pnpm railway:wire` — explicit origins only, no wildcard mix |
| PWA stale after deploy | Run `pnpm railway:ship`; verify with `pnpm railway:verify-pwa` (checks `X-SHC-Railway-Build-Id`) |
| Web Docker build fails on @shc/ui vitest | Vitest skipped in Railway Docker (mobile apps excluded from image context) |

## PWA asset serving (web)

PWA files are **not** in `public/sw.js`. Next.js route handlers serve them with correct cache headers:

| Path | Handler |
|------|---------|
| `/sw.js` | `apps/web/app/sw.js/route.ts` |
| `/icon.png`, `/icon-512.png`, `/apple-touch-icon.png` | `apps/web/app/icon*.png/route.ts` |

Static source files live in `apps/web/public/pwa-assets/`. Responses include `X-SHC-Railway-Build-Id` (read from `.railway-build-id` at build time) for deploy verification.

## Future / not on Railway yet

| Service | Notes |
|---------|-------|
| dedicated admin UI beyond `/app` | Medusa admin at `/app` is live; separate ops UI is `/ops` on web |
| custom domains | Railway `*.up.railway.app` defaults; custom domain TBD |

## Environment groups

- `production` — live (current `homecooks` project)
- `staging` / `preview` — per-PR ephemeral (future)
- `local` — `docker-compose` + `pnpm medusa:dev:admin`

All secrets live in Railway dashboard variables. No `.env` files committed.

## Multi-Agent Notes

- **Infra Track** owns `railway.toml`, `railway.web.toml`, Dockerfiles, `RAILWAY_DEPLOY.md`, and bootstrap scripts.
- Other tracks request new env vars via Infra; document changes here and in `RAILWAY_DEPLOY.md`.

**Infra Track Rule:** Never store secrets in code or repo. Configuration changes go through Railway UI, `railway-configure-web.mjs`, or checked-in config-as-code (non-secret only).