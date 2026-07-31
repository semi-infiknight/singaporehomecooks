# Custom Requests v2 — Product & Data Model

**Status:** Phase 3 shipped (2026-07-31) — partial accept, auto-decline siblings, PayNow on accept, bid-created push, web multi-dish wizard  
**Replaces:** “Collaboration Board” + single-dish `body` + flat “bid” model

---

## Problems (current v1)

| Issue | Today | Fix |
|-------|-------|-----|
| Quantity semantics | `party_size` = “N guests” in UI but used as **order line qty** on accept | Split `guest_count` (context) vs per-line `servings` |
| Single dish only | One `body` string | `items[]` — multiple named dishes per request |
| Cook surface name | “Collaboration Board” | **Custom requests** (cook Orders tab section) |
| Pricing name | “Bid” | **Quote** (API table stays `shc_bid` for compat) |
| Partial fulfilment | All-or-nothing one price | Quote `lines[]` with `included` + per-line `price_cents` |
| Customer review | Text-only panel buried in **Cart** | **Orders → Custom requests** with images + detail screen |
| Request ≠ order UX | No openable request; accept jumps to order | Request detail mirrors order detail until matched |

---

## Naming (UI copy)

| Old | New |
|-----|-----|
| Collaboration Board | **Custom requests** |
| Place bid | **Send quote** |
| Bid / pending bid | **Quote / cook quote** |
| Accept bid | **Accept quote** |
| My requests (cart footer) | **Custom requests** (Orders tab) |
| party_size / N guests (for qty) | **servings** per dish line |
| party_size (event context) | **guest_count** — “how many people eating” |

---

## Data model

### `shc_request` (extended)

| Field | Type | Notes |
|-------|------|-------|
| `items_json` | text (JSON) | `[{ id, name, servings, notes?, youtube_url?, spice?, dietary? }]` |
| `guest_count` | int? | Event headcount — **not** order qty |
| `party_size` | int? | **Deprecated** — alias for first line `servings` during migration |
| `body` | text | Summary / legacy single-dish description |
| `occasion` | text? | Optional persisted tag (today folded into body) |
| `budget_cents`, `date`, `youtube_url`, `status` | unchanged | |

### `shc_bid` → Cook quote (extended)

| Field | Type | Notes |
|-------|------|-------|
| `line_items_json` | text (JSON) | `[{ request_line_id, included, servings?, price_cents }]` |
| `price_cents` | int | **Total** quote (sum of included lines) |
| `message` | text? | Cook note to customer |

### Order linkage (unchanged)

`shc_order_meta.origin_request_id` + `items[]` built from **accepted quote lines** (not `party_size`).

---

## Customer flow (v2)

1. **Create** — Wizard: occasion → **add dishes** (name, servings, notes each) → gathering (guest count, budget, date) → review
2. **Track** — Orders tab → **Custom requests** segment → card with hero image + status + quote count
3. **Detail** — `/requests/[id]`: dish lines with images, status timeline, incoming **quotes** from cooks (avatar, per-line breakdown, total)
4. **Accept** — Full quote or **partial** (future: pick which lines from a multi-line quote)
5. **Fulfil** — Becomes normal collection order; detail shows “From custom request” chip

---

## Cook flow (v2)

1. **Orders tab** → section **Custom requests** (not separate route)
2. Request card: dish thumbnails, guest count, budget, date, YouTube link
3. **Quote builder**: toggle each requested line on/off, set price per included line, optional message → **Send quote**
4. On customer accept → order in Needs action (same as listing orders)

---

## API (additive)

- `POST /store/shc/requests` — accept `items[]`, `guest_count`; derive `body` summary if omitted
- `GET /store/shc/requests/:id` — return parsed `items`, `quotes_count`, `pending_quotes`
- `POST /store/shc/bids` — accept `line_items[]`; validate against request lines
- `POST /store/shc/bids/:id/accept` — build order `items[]` from quote lines (servings = line qty)

---

## Implementation phases

| Phase | Scope |
|-------|--------|
| **1** | Naming, servings vs guests copy, Orders tab + request detail, quote cards with images |
| **2** | DB migration `items_json`, `guest_count`, `line_items_json`; multi-dish wizard + cook quote builder |
| **3** | Partial accept; auto-decline sibling quotes; PayNow on accept; push on `shc.bid.created` | Shipped (2026-07-31) |
| **4** | Maestro flows (`custom-request-wizard`, `cook-custom-request-quote`, `custom-request-quote-accept`, `run-custom-request-e2e.sh`) | Shipped (2026-07-31) |

### Post–Phase 4 verification (shipped 2026-07-31)

| Surface | Command | Covers |
|---------|---------|--------|
| API smoke | `pnpm verify:real-e2e` | `items[]`, `line_items[]`, `accepted_line_ids`, sibling decline, PayNow after accept |
| Mobile Maestro | `pnpm e2e:custom-request` | Full happy path (customer wizard → cook quote → accept → PayNow) |
| Web Playwright | `pnpm e2e:custom-request-web` | `/request` → cook portal quote → partial accept → `order-paynow-panel` |

---

## Future ideas

- Cook “counter-quote” revision thread
- Expiry on open requests (`order_by` like drops)
- Template requests from past orders (“order again as custom”)
- Corporate multi-request batch + invoice
- AI parse YouTube → suggested dish lines
