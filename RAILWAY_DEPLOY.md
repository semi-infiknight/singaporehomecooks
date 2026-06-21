# Deploy Singapore Home Cooks on Railway

Step-by-step guide to run **Medusa API + Postgres + Redis + Next.js web** on Railway staging.

## Architecture

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

Mobile apps (Expo) talk directly to the Medusa public URL — they are **not** hosted on Railway.

### Why services don't show on the Railway canvas

Railway only draws dependency lines when variables use **reference syntax**:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

Hardcoded URLs like `redis://...@redis.railway.internal:6379` work at runtime but leave **Redis** (and other deps) visually disconnected on the dashboard. After any manual env edit, re-run:

```bash
pnpm railway:wire
```

This sets `${{Service.VAR}}` references on medusa, worker, and web so Postgres, **Redis**, and minio all appear linked.

---

## 1. Prerequisites

- [Railway account](https://railway.app) + GitHub repo connected
- Railway CLI (optional): `npm i -g @railway/cli && railway login`
- This repo on `main` (CI green)

---

## 2. Create Railway project

1. **New Project** → **Deploy from GitHub** → select `singaporehomecooks`
2. Add plugins:
   - **PostgreSQL** (note the `DATABASE_URL` variable)
   - **Redis** (note the `REDIS_URL` variable)

---

## 3. Medusa API service

1. The default service uses root `railway.toml` → builds `apps/medusa/Dockerfile`
2. **Settings → Networking** → generate public domain (e.g. `shc-medusa.up.railway.app`)
3. **Variables** (reference `${{Postgres.DATABASE_URL}}` syntax in Railway):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | random 32+ char string |
| `COOKIE_SECRET` | random 32+ char string |
| `MEDUSA_DISABLE_ADMIN` | `true` |
| `MEDUSA_PUBLIC_URL` | `https://<your-medusa-domain>.up.railway.app` |
| `RAILWAY_PUBLIC_DOMAIN` | `<your-medusa-domain>.up.railway.app` (no `https://`) |
| `RAILWAY_RUN_SEED` | `true` (first deploy only — remove after seed succeeds) |

4. Deploy. The entrypoint runs `db:migrate` then starts the server. With `RAILWAY_RUN_SEED=true`, demo cooks/products are seeded automatically.

5. Verify: `curl https://<medusa-domain>/health`

---

## 4. Bootstrap (publishable key + demo customer)

From your laptop (Medusa must be up):

```bash
MEDUSA_URL=https://<medusa-domain>.up.railway.app ./scripts/railway-init.sh
```

This writes local `.env.local` files and prints the **publishable API key** to copy into Railway.

If you skipped `RAILWAY_RUN_SEED`, seed manually:

```bash
railway link   # select medusa service
railway run pnpm seed
```

---

## 5. Web service (Next.js)

1. **New Service** → same GitHub repo
2. **Settings → Build**:
   - **Config file: `railway.web.toml`** (required — root `railway.toml` is Medusa-only and will break web deploys)
   - Or run: `pnpm railway:configure-web` (after `railway login` + `railway link`)
3. **Networking** → public domain (e.g. `shc-web.up.railway.app`)
4. **Variables**:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SHC_API_BASE` | `https://<medusa-domain>.up.railway.app` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | from bootstrap output |
| `WEB_PUBLIC_URL` | `https://<web-domain>.up.railway.app` |

5. **Redeploy web** after setting build-time `NEXT_PUBLIC_*` vars (Next bakes them at build).

6. Back on **Medusa**, set CORS if needed:

```
STORE_CORS=https://<web-domain>.up.railway.app,http://localhost:8081,http://localhost:3001
AUTH_CORS=https://<web-domain>.up.railway.app,http://localhost:8081,http://localhost:8082,http://localhost:3001
```

`RAILWAY_PUBLIC_DOMAIN` + `WEB_PUBLIC_URL` auto-append to defaults if you prefer.

---

## 6. Mobile (EAS preview builds)

In Expo / EAS environment variables:

```
EXPO_PUBLIC_MEDUSA_BASE=https://<medusa-domain>.up.railway.app
EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<from bootstrap>
```

```bash
pnpm eas:customer:preview
pnpm eas:cook:preview
```

---

## 7. Smoke test (remote)

```bash
MEDUSA_URL=https://<medusa-domain>.up.railway.app pnpm verify:real-e2e
```

Requires bootstrap + seed completed on Railway.

---

## 8. Demo accounts

| Role | Email | Password |
|------|--------|----------|
| Customer | `customer@shc.local` | `customersecret` |
| Cook | `rose@shc.local` | `cooksecret` |
| Admin | `admin@shc.local` | `supersecret` |

Admin is created automatically on each Medusa deploy (`docker-entrypoint.sh`). No manual step required.

**Do not** run `railway run medusa user` from a laptop — `DATABASE_URL` is Railway-internal and will timeout.

---

## 9. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails Node/pnpm | Dockerfile uses Node 22 + pnpm 11 |
| CORS errors from web | Set `STORE_CORS` / `AUTH_CORS` with web URL |
| Empty products | Run seed: `RAILWAY_RUN_SEED=true` or `railway run pnpm seed` |
| Cart 401 | Run `./scripts/railway-init.sh` (demo customer profile) |
| Web shows stale API | Redeploy web after changing `NEXT_PUBLIC_*` |
| Web runs Medusa / Postgres errors in web logs | Set web **Config file** to `railway.web.toml` (see §5) |

---

## 10. Production checklist (later)

- [ ] Rotate `JWT_SECRET` / `COOKIE_SECRET`
- [ ] Enable Medusa admin (`MEDUSA_DISABLE_ADMIN=false`) for ops
- [ ] Custom domains + HTTPS
- [ ] PayU / PayNow KYC keys
- [ ] Expo push credentials (`expo-server-sdk`)
- [ ] Remove `RAILWAY_RUN_SEED` after first seed