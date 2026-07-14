# HitPay PayNow setup (SHC)

Dynamic PayNow QR + webhook auto-confirm for orders.

## Env vars (Medusa / Railway)

| Variable | Required | Notes |
|----------|----------|--------|
| `HITPAY_API_KEY` | Yes (live QR) | Dashboard → Settings → API Keys |
| `HITPAY_WEBHOOK_SALT` | Yes (webhooks) | Same dashboard salt for HMAC |
| `HITPAY_ENV` | Optional | `sandbox` (default) or `production` / set `HITPAY_LIVE=1` |
| `HITPAY_API_BASE` | Optional | Override API base URL |
| `HITPAY_WEBHOOK_SKIP_VERIFY` | Dev only | `1` skips signature check (never in production) |
| `SHC_PLATFORM_UEN` / `PAYNOW_UEN` | Recommended | Shown on manual fallback UI |
| `SHC_PLATFORM_LEGAL_NAME` | Optional | Display name on PayNow panel |

Without `HITPAY_API_KEY`, `POST /store/shc/orders/:id/paynow` returns **503** — HitPay is the only customer payment path (no manual “I've paid”).

## HitPay dashboard

1. Create merchant account (sandbox first): https://dashboard.sandbox.hit-pay.com  
2. Enable **PayNow** payment method.  
3. Copy **API key** + **Salt** → Railway Medusa env.  
4. **Developers → Webhook Endpoints → New**:
   - URL: `https://<your-medusa-host>/hooks/shc/hitpay`
   - Event: `payment_request.completed`
5. Production: switch keys + `HITPAY_ENV=production` (or `HITPAY_LIVE=1`) + production webhook URL.

## API surface

| Method | Path | Auth |
|--------|------|------|
| POST | `/store/shc/orders/:id/paynow` | Customer JWT |
| POST | `/store/shc/tiffin/subscription/recharge/paynow` | Customer JWT (`{ weeks }`) |
| POST | `/hooks/shc/hitpay` | Hitpay-Signature HMAC |
| POST | `/admin/shc/payment-confirm` | Admin (manual override) |

**Tiffin recharge:** reference `TRECH-{customerId}-{weeks}W` on the payment request; webhook calls `rechargeSubscription` (no order id).

Create payment uses HitPay:

`POST /v1/payment-requests` with `payment_methods[]=paynow_online` + `generate_qr=true` + `reference_number=<order_id>`.

## Client flow

1. Customer places order → checkout PayNow phase.  
2. App calls `createOrderPayNow(orderId)`.  
3. Shows `qr_image_data_url` (PNG data URL from server).  
4. Customer scans & pays.  
5. HitPay webhook → `markOrderPaid` → `shc_status=paid` + ledger.  
6. Client polls order status until `paid`, then success / track order.

**Tiffin recharge:** `/tiffin/recharge` → `createTiffinRechargePayNow(weeks)` → poll subscription until `expires_on` advances.

## Smoke

```bash
# Signature unit tests
pnpm exec vitest run apps/medusa/src/lib/shc-hitpay.test.ts

# With keys on Railway after deploy:
pnpm smoke:tiffin   # includes POST /recharge/paynow → QR when HITPAY_API_KEY set
```

## Fees (list, confirm on HitPay)

- PayNow &lt; S$100: ~0.9% (min S$0.20)  
- PayNow ≥ S$100: ~0.65% + S$0.30  

See https://hitpayapp.com/sg/pricing
