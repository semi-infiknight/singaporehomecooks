# Medusa Backend for Singapore Home Cooks

**Status (Integration wave + Phase 6 Backend-Money):** Modules + links + workflows consume @shc/types + business-rules contracts exactly (frozen, no schema edits). Money engine fully working locally: shc-ledger (double-entry commission/payout), shc-payout-batch, expanded PayNow confirm with ledger, auto on completed via workflow+subscriber, admin/store APIs, idempotent weekly sim script, seed with demo data.

## Key Contracts-Ready Pieces
- src/modules/shc-* (cook, product-meta, order-meta, availability, **ledger**, **payout-batch**) + links
- src/workflows/* use contracts for create + transition + commission post on completed
- src/subscribers: order-state (now posts ledger + sends Expo push stubs on paid/ready_for_collection/completed etc via shc_cook token; /store/shc/push-token route registers)
- src/api/store/shc/* : /products, /cooks, /orders (earnings/ledger summary for cook), /health, carts complete + demo-complete + checkout-credits (growth parity for wiring), push-token (Expo reg), search
- src/api/admin/shc/* : /payment-confirm (now +ledger), /cooks/verification, **/payouts** (list/create/approve), **/ledger** (query order/cook/batch), health
- Errors: always SHCErrorCode via createSHCError + Zod .strict()
- Audit: every money action logged with actor/context + structured (logger)
- Later swap: mobile lib/api-client.ts + TanStack hooks point to real /store/shc (no mockFetch)

## Money Engine (Phase 6)
- Commission: 15% static (business-rules + locked) posted on completed (subscriber + workflow) and on PayNow confirm.
- Ledger: double-entry shc_ledger_entry (debit/credit accounts e.g. Cook-Earnings-Payable / Platform-Commission-Revenue, amount_cents, order_id, batch_id). Invariant enforced (self-balanced + verify).
- Payouts: weekly batch (Monday sim), status pending/approved/paid, total_cents, sim transfer_ref on approve.
- APIs: /admin/shc/payouts , /admin/shc/ledger , /store/shc/orders?cook_id=... (earnings summary)
- Cron sim: apps/medusa/scripts/weekly-payout.ts (manual run; idempotent, uses pg + validates contracts)
- Seed: extends to demo completed order_metas + 2 ledger tx + 1 approved payout batch (validate + rules).

## Local Run (with mobile)
See root LOCAL_TEST.md (or root README).

1. docker compose up -d  (postgres)
2. cd apps/medusa && pnpm dev   (Admin at :9000)
3. In other shell: pnpm bootstrap:medusa ; cd apps/medusa && pnpm seed   (validates + money demo data)
4. Test money:
   - Admin /admin/shc/payment-confirm (if orders) or use seed data.
   - GET /admin/shc/ledger?order_id=order_completed_demo_001
   - GET /admin/shc/payouts
   - POST /admin/shc/payouts/[id]/approve (if pending)
   - Run weekly sim: cd apps/medusa && pnpm exec tsx scripts/weekly-payout.ts   (or with --week YYYY-MM-DD)
   - Store: GET /store/shc/orders?cook_id=cook_auntie_rose  (sees earnings_summary)

`pnpm --filter medusa dev` (after docker postgres) — Admin at :9000

## WhatsApp OTP (cook signup + mobile verify)

Cook signup uses **message-us-first** verification (free session replies — user taps Verify on WhatsApp, sends a pre-filled message, we reply with OTP).

Production uses **Meta WhatsApp Cloud API** (Graph). Set on Railway `medusa` service:

| Variable | Purpose |
|----------|---------|
| `WHATSAPP_CLOUD_ACCESS_TOKEN` | System user / permanent token from Meta Business |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID from WhatsApp → API Setup |
| `WHATSAPP_BUSINESS_WA_ME_PHONE` | Digits only for wa.me link, e.g. `6591234567` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Meta webhook verify token (default `shc-whatsapp-verify`) |
| `WHATSAPP_GRAPH_API_VERSION` | Optional, default `v22.0` |

**Webhook URL (Meta app):** `https://<medusa-host>/hooks/shc/whatsapp` — subscribe to `messages`.

No auth template required for signup OTP (user messages first). Onboarding mobile verify may still use templates when pushing outbound.

Local dev / Maestro: demo code `123456` auto-works when Meta is not configured.

**Stub mode (no Meta yet):** If `WHATSAPP_CLOUD_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are unset, signup and onboarding use demo OTP `123456` in all environments. Set `SHC_ALLOW_DEMO_OTP=0` to disable. Once Meta vars are set, live WhatsApp is used automatically.

Optional: `SHC_COOK_REGISTER_DEMO_OTP` to force a specific demo code.

Routes:
- `POST /store/shc/auth/cook/register/send-whatsapp-otp` → `{ whatsapp_url, verify_token, hint }`
- `GET /store/shc/auth/cook/register/whatsapp-verify-status?mobile=`
- `POST /hooks/shc/whatsapp` (Meta inbound)

Contracts verified. Money Wave ready for stitch. Mobile will consume new store earnings/ledger queries later (no contract change).

## Example future client call
// mobile will do: fetch('/store/shc/products?...') + Zod parse on SHCProductMeta etc.
// Cook earnings: fetch('/store/shc/orders?cook_id=...') -> earnings_summary
