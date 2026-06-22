# 00 — Locked Decisions and Prerequisites

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [../03-railway/03-railway.md](../03-railway/03-railway.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../14-founder-inputs/14-founder-inputs.md](../14-founder-inputs/14-founder-inputs.md)

**Last Updated:** 2026-06-13 (merged multi-agent production layer)

These are fixed for this build. Do not re-decide during implementation.

## Locked Decisions Table

| Decision | Choice | Rationale | Multi-Agent Note |
| --- | --- | --- | --- |
| Commerce kernel | Medusa v2 self-hosted on Railway | Catalog, cart, orders, workflows, Admin | Infra Track owns deployment; Backend Track owns modules |
| Primary client | Expo + Expo Router | Mobile-first; cooks and customers on phones | Mobile Track owns all screens |
| Auth | **Medusa Auth only** — `customer` + `cook` actor types | One JWT pattern for mobile; no second auth library | Contracts Track defines actor schemas |
| Cart scope (MVP) | **One cook per cart** | Avoids order-splitting workflow until Phase 8+ | Enforced in `08-marketplace-rules.md` and cart complete override |
| Payment | PayNow manual confirm | Customer marks sent → ops confirms in Admin | Backend Track (shc-paynow provider) |
| Payout cadence | Weekly, Monday batch | Cron + Admin approval | Backend + Infra (worker cron) |
| Commission default | 15% platform fee, rule versioned from Phase 6 | Static preview until ledger ships | Contracts Track owns commission schema |
| Collection model | Customer picks date/slot; cook address released 2h before collection | `shc_order_meta.address_released_at` | Defined in data model + order state |
| Ops UI (Phase 1–6) | Medusa Admin extensions | Custom `/ops` web only where Admin is insufficient | Backend Track |
| Image storage | MinIO (full server upload + presigned) + Sharp derivatives planned | Server receives (base64/form), validates/auths, putObject; client gets signed URL | Infra + Backend |

## Builder Prerequisites (Before Phase 1)

| Item | Owner | Required by | Track |
| --- | --- | --- | --- |
| Railway account + project | Founder | Phase 0 | Infra |
| Apple Developer account ($99/yr) | Founder | Phase 7 | Infra |
| Google Play Console ($25 one-time) | Founder | Phase 7 | Infra |
| Expo account + EAS | Builder | Phase 7 | Mobile |
| Resend account (free tier) | Founder | Phase 2 | Backend |
| PayNow corporate UEN + display name | Founder | Phase 5 | See 14-founder-inputs |
| Payout bank account | Founder | Phase 6 | Backend |
| Legal entity name for receipts | Founder | Phase 6 | Content |

## Medusa Bootstrap Checklist (Ticket 1.2 — Must Complete Before Any Feature Work)

**Infra Track + Backend Track joint responsibility**

1. Create **Region**: Singapore, currency `sgd`, tax inclusive per founder config
2. Create **Sales Channel**: `shc-mobile` — all cook products assigned here
3. Create **Publishable API Key** — store as `EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
4. Create **Stock Location**: `singapore` (required for inventory modules)
5. Seed **Admin user** for ops
6. Configure **CORS**: allow mobile (`*`) and Railway web domain (tighten later)
7. Verify Store API: `GET /store/products` with publishable key returns 200

**Production Note (Multi-Agent):** All bootstrap steps must produce health/readiness endpoints and structured logs. See `production/observability.md`.

**See also:** `03-railway/03-railway.md` for full Railway topology and env vars.