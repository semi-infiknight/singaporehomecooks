# Medusa Admin — API-First Mode (Sprint 9)

SHC ships **API-first** for mobile/web integration. Admin UI is optional.

## Default (CI + local dev)

```bash
MEDUSA_DISABLE_ADMIN=true pnpm exec medusa start
```

- Skips Vite admin bundle (avoids missing `@medusajs/draft-order/admin` etc. in monorepo CI)
- All `/store/shc/*` and `/admin/shc/*` custom routes work
- Ops uses Admin API + `scripts/bootstrap-medusa.js`

## Enable Admin UI (when ops needs dashboard)

1. Set `MEDUSA_DISABLE_ADMIN=false` (or unset)
2. Install admin peer deps (already in `package.json`): `@medusajs/dashboard`, `@medusajs/admin-sdk`, `react`, `react-dom`
3. Add missing Medusa plugins as needed when build errors name them (e.g. `@medusajs/draft-order`)
4. Run `pnpm exec medusa build` without `MEDUSA_DISABLE_ADMIN`

## SHC custom admin routes (work without Admin UI)

| Route | Purpose |
|-------|---------|
| `POST /admin/shc/payment-confirm` | Manual PayNow confirm |
| `GET /admin/shc/ledger` | Ledger inspection |
| `GET/POST /admin/shc/payouts` | Weekly payout batches |
| `GET /admin/shc/cooks/verification` | Cook KYC queue |

Use admin JWT from `POST /auth/user/emailpass`.