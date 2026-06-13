# 03 — Railway Deployment & Infrastructure

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [production/observability.md](../production/observability.md)
- [production/testing-strategy.md](../production/testing-strategy.md)
- [multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Last Updated:** 2026-06-13 (Infra Track owns)
**Owner:** Infra Track

## Overview

Railway provides the hosting, networking, and managed services layer for the entire platform. All production workloads (Medusa, worker, databases, object storage, cache) run on Railway with environment-group-based configuration and automatic scaling.

## Service Topology

| Service              | Type                  | Purpose                                      | Environment Variables Group | Health Check |
|----------------------|-----------------------|----------------------------------------------|-----------------------------|--------------|
| postgres             | Managed Postgres      | Primary database (Medusa + SHC tables)       | `DATABASE_URL`              | /health      |
| redis                | Managed Redis         | Cache, session, job queue, rate limiting     | `REDIS_URL`                 | PING         |
| medusa               | Web service           | Main API server (Store + Admin)              | Full Medusa + SHC config    | /store/health|
| worker               | Worker / Cron         | Background jobs, payouts, notifications      | Same as medusa + worker flag| Internal     |
| minio                | Object storage        | Compliance docs, product images, receipts    | `MINIO_*` buckets           | /minio/health|
| admin                | Web service (optional)| Dedicated Admin UI if split                  | Admin-specific              | /admin/health|

## Environment Groups (Railway)

- `production` — live customer traffic
- `staging` — pre-production validation
- `preview` — per-PR ephemeral environments
- `local` — developer machines (via Railway CLI or docker-compose parity)

All secrets and config are stored exclusively in Railway environment variables. No `.env` files are committed.

## Networking & Domains

- Custom domain for production API and Admin.
- Internal service discovery via Railway private networking.
- CORS and allowed origins strictly limited to mobile app and admin domains.
- Rate limiting and DDoS protection configured at the Railway edge where possible.

## Deployment Pipeline

1. Git push to `main` or `integrate/phase-N` triggers GitHub Action.
2. `turbo build` produces artifacts.
3. Railway CLI or GitHub integration deploys updated services.
4. Health checks and smoke tests run post-deploy.
5. Rollback via Railway dashboard or CLI if needed.

## Production Hardening (Infra Owned)

- All services have resource limits and autoscaling rules.
- Backups: daily Postgres snapshots + point-in-time recovery.
- Secrets rotation policy (quarterly for high-impact keys).
- Logging aggregation to Railway + external observability (see `production/observability.md`).
- Zero-downtime deploys with health gate.

## Multi-Agent Notes

- **Infra Track** owns all Railway service definitions, environment groups, and deployment scripts.
- Other tracks request new environment variables or service changes via Infra.
- After Phase 0, infrastructure changes require Infra approval and are documented here.

**Infra Track Rule:** Never store secrets in code or repo. All configuration changes go through Railway UI or infrastructure-as-code checked into the monorepo.
