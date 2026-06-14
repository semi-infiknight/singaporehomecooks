# 03 — Railway Deployment & Infrastructure

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../04-monorepo/04-monorepo.md](../04-monorepo/04-monorepo.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [production/observability.md](../production/observability.md)
- [production/testing-strategy.md](../production/testing-strategy.md)
- [multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Last Updated:** 2026-06-14 by Launch/Final Polish + Stitch (Infra/Launch) — EAS/mobile deploy notes, real push via Expo, PayU stub prep (KYC deferred), cart/checkout wiring parity for growth, CI/Maestro.
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

## Mobile Builds & EAS Distribution (Expo)

- EAS config: `apps/mobile/eas.json` (development/preview/production profiles; internal distribution for TestFlight + Play Console internal testing).
- Scripts: `pnpm eas:mobile:preview` (or cd apps/mobile; pnpm eas:build:preview etc). Internal builds for TestFlight/Play (no public store until Phase 7.4 assets/KYC).
- Instructions: 
  1. `npx eas login` (Expo account).
  2. `npx eas build --profile preview --platform ios` (or all). Use `eas:submit:*` for TestFlight/Play internal track.
  3. Bundle ID/package in app.json: com.singaporehomecooks.app (update on real certs).
  4. For push: real Expo tokens + backend registration work with any build profile.
- Real push: Expo push tokens registered via /store/shc/push-token (stored on shc_cook). Subscriber sends on paid/ready_for_collection/collected/completed. 
  - Document: **Real Expo Push Notification service required for production** (install `expo-server-sdk` in medusa, obtain credentials, handle token validation/receipts in worker). Stubs + wiring complete for local + EAS builds.
- PWA/web parity notes deferred to Phase 10 (manifest already in app.json web).

## Real PayU / Payment Prep (Stubbed, KYC Deferred)

- Current: manual PayNow via Admin /admin/shc/payment-confirm (per content/paynow-flow.md + locked decisions). Full provider stub in place (no KYC/PayU corporate keys).
- Prep: provider interface ready (see 08/09 + payment-confirm workflow); when founder provides PayU KYC/corporate creds, swap in Medusa payment provider + real /store/shc/carts complete.
- Notes: No real money movement yet. All ledger/payout sims (15% commission double-entry) local. KYC/PayU integration last item per founder inputs.
- GST/tax invoice stubs via corporate flag in checkout.

## Cloudflare Tunnel + Local Share (Ready for Demo)

- See LOCAL_TESTING.md: `cloudflared tunnel --url http://localhost:9000` exposes Medusa publicly for remote testers (with EXPO_PUBLIC_MEDUSA_BASE + pubkey).
- Mobile (real toggle) + full flows (incl. push stubs, growth checkout, money) work via shared tunnel + cloned repo on tester device. No permanent infra.

## Multi-Agent Notes

- **Infra Track** owns all Railway service definitions, environment groups, and deployment scripts.
- Other tracks request new environment variables or service changes via Infra.
- After Phase 0, infrastructure changes require Infra approval and are documented here.

**Infra Track Rule:** Never store secrets in code or repo. All configuration changes go through Railway UI or infrastructure-as-code checked into the monorepo.
