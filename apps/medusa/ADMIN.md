# Medusa Admin UI — single SHC ops surface

SHC uses **one admin app**: stock Medusa Admin at `/app`, extended with **SHC Ops** UI routes. There is no separate branded ops SPA — marketplace monitoring and light controls live beside Orders / Products in Medusa’s own style.

## Native sidebar = SHC read mirrors (no dual-write)

Stock **Orders / Products / Inventory / Price Lists** stay on Medusa core list pages, but each has an SHC widget (`*.list.before`) that reads the same `shc_*` data as SHC Ops via `/admin/shc/*`. Empty Medusa core tables may still appear below — the widget is the primary content. **Do not** dual-write into Medusa Product / Order / Inventory modules.

| Admin page | Widget zone | API |
|------------|-------------|-----|
| `/app/orders` | `order.list.before` | `GET /admin/shc/orders` |
| `/app/products` | `product.list.before` | `GET /admin/shc/listings` |
| `/app/inventory` | `inventory_item.list.before` | `GET /admin/shc/availability` |
| `/app/price-lists` | `price_list.list.before` | `GET /admin/shc/listings` (price columns) |

Source: `apps/medusa/src/admin/widgets/*-list-shc.tsx`  
**SHC Ops** remains the richer control surface (flags, disputes, payouts, payment confirm).

## Why `/app` was 404 (local API-only)

Default `pnpm medusa:start` and `pnpm build` set `MEDUSA_DISABLE_ADMIN=true` (API-first for CI/mobile). Admin is off unless you opt in.

**Railway / Docker production** builds with `build:admin` and `MEDUSA_DISABLE_ADMIN=false` — dashboard is live on the medusa service.

## Quick start (local)

```bash
pnpm docker:up          # Postgres, if not running
pnpm medusa:dev:admin   # from repo root
```

Open **http://localhost:9000/app**

| Email | Password |
|-------|----------|
| `admin@shc.local` | `supersecret` |

Create user if needed: `pnpm bootstrap:medusa`

If **Continue with Email** spins forever, hard-refresh after restarting `pnpm medusa:dev:admin`. Wrong password → “Invalid email or password”.

## Production-style local start

```bash
cd apps/medusa
pnpm build:admin        # builds UI + copies to public/admin/
pnpm start:admin
```

## SHC Ops (custom admin UI)

Sidebar: **SHC Ops** (and nested pages). Paths:

| Path | Purpose |
|------|---------|
| `/app/shc-ops` | Overview KPIs, status breakdown, recent activity, health |
| `/app/shc-ops/orders` | Live marketplace order board (customer + cook) |
| `/app/shc-ops/catalog` | Browse category presets (not cook-owned) |
| `/app/shc-ops/controls` | Feature flags, disputes, payouts, commission/search snapshot |

Source: `apps/medusa/src/admin/routes/shc-ops/**`  
Uses `@medusajs/ui` + session-auth JS SDK → existing `/admin/shc/*` APIs.

Each SHC Ops page is wrapped with `withShcQuery` (`src/admin/lib/shc-query.tsx`) so `useQuery` / `useMutation` share a QueryClient from the same `@tanstack/react-query` instance (pnpm + Medusa dashboard otherwise throws “No QueryClient set”). In-page nav uses `/app/shc-ops/*` anchors (not `react-router-dom` `Link`) to avoid a second router instance.

### APIs (same as before)

| Route | Purpose |
|-------|---------|
| `GET /admin/shc/overview` | KPI snapshot |
| `GET /admin/shc/orders` | Cross-app order feed |
| `GET /admin/shc/listings` | Cook product metas (Products + Price Lists mirrors) |
| `GET /admin/shc/availability` | Portion/day slots (Inventory mirror) |
| `GET/POST/DELETE /admin/shc/categories` | Catalog cuisine presets |
| `POST /admin/shc/payment-confirm` | Manual PayNow confirm |
| `GET /admin/shc/ledger` | Ledger inspection |
| `GET/POST /admin/shc/payouts` | Weekly payout batches |
| `GET /admin/shc/cooks/verification` | Cook KYC queue |
| `GET/POST /admin/shc/feature-flags` | Launch gates |
| `GET/POST /admin/shc/disputes` | Dispute list / resolve |

Smoke: `pnpm exec tsx scripts/smoke-admin-ops.ts`

## Web `/ops`

`apps/web/app/ops` is a **redirect** to Medusa Admin `…/app/shc-ops` (bookmark compatibility only). Do not rebuild a second ops UI on the Next app.

## API-only mode (no dashboard)

```bash
pnpm medusa:start       # MEDUSA_DISABLE_ADMIN=true
```

Custom routes still work via Admin API + JWT:

```bash
curl -X POST http://localhost:9000/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shc.local","password":"supersecret"}'
```
