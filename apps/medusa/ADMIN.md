# Medusa Admin UI

## Why `/app` was 404

The default `pnpm medusa:start` and `pnpm build` set `MEDUSA_DISABLE_ADMIN=true` (API-first for CI/mobile). The admin dashboard is intentionally off unless you opt in.

Admin UI also needs two extra packages (now in `package.json`):

- `@medusajs/draft-order`
- `@medusajs/admin-shared`

## Quick start (recommended — dev mode)

```bash
pnpm docker:up          # Postgres, if not running
pnpm medusa:dev:admin   # from repo root
```

Open **http://localhost:9000/app** (or `http://127.0.0.1:9000/app` — both work after the backendUrl fix)

Login:

| Email | Password |
|-------|----------|
| `admin@shc.local` | `supersecret` |

If **Continue with Email** does nothing or spins forever, hard-refresh the page after restarting `pnpm medusa:dev:admin` (config change). Wrong password shows "Invalid email or password".

Create admin user if needed:

```bash
pnpm bootstrap:medusa
```

## Production-style start (with admin)

```bash
cd apps/medusa
pnpm build:admin        # builds UI + copies to public/admin/
pnpm start:admin
```

Then open **http://localhost:9000/app**

## API-only mode (no dashboard)

```bash
pnpm medusa:start       # MEDUSA_DISABLE_ADMIN=true
```

Custom ops routes still work via Admin API + JWT:

```bash
curl -X POST http://localhost:9000/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shc.local","password":"supersecret"}'
```

## SHC custom admin routes

| Route | Purpose |
|-------|---------|
| `POST /admin/shc/payment-confirm` | Manual PayNow confirm |
| `GET /admin/shc/ledger` | Ledger inspection |
| `GET/POST /admin/shc/payouts` | Weekly payout batches |
| `GET /admin/shc/cooks/verification` | Cook KYC queue |