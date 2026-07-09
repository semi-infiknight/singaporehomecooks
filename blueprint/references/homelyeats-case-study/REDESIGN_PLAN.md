# Redesign Plan — HomelyEats → Singapore Home Cooks Tiffin

**Goal:** Use HomelyEats case study ([CASE_STUDY.md](./CASE_STUDY.md) + `images/`) to redesign SHC **UI, flows, backend, and states** for subscription/tiffin — without abandoning SHC lock-ins.

**Last Updated:** 2026-07-09  
**FLAVOUR (when building):** `feature` then `wiring` · **SCOPE:** `tiffin`  
**Tri-platform:** customer mobile first → cook mobile → web (`tri-platform-ui-sync` for shared components)

---

## 0. North star

| HomelyEats | SHC today | Target |
|------------|-----------|--------|
| Subscription-first OS (balance, flex, calendar orders) | Weekly tiffin: 2/3/4 meals, one kitchen, template + next-week override | **Subscription OS on SHC rails**: prepaid/weekly plan + flex + calendar meal instances + manage surfaces, **collection-first** |
| Multi concurrent kitchen subs | **One** active kitchen (`assertOneKitchenSubscription`) | Keep **one active kitchen** (SHC lock-in) unless founder unlocks multi |
| Delivery 1–2 km | Collection / HDB | Keep **collection slots**; optional delivery later |
| Orange brand | Family Values / Gourmeat | Keep SHC visual system; reuse **IA + states + components** |

---

## 1. Gap analysis (current vs HomelyEats)

### 1.1 Customer UI routes (mobile)

| HomelyEats surface | SHC today | Gap |
|--------------------|-----------|-----|
| Onboarding guest + warm illustrations | Existing app onboarding | Optional tiffin-specific education rail |
| Home promo + kitchen discovery | Discover promo → `/(customer)/tiffin` kitchen list | Homepage denser: categories, meal-type filters, subscriber social proof |
| Kitchen page (Jakob’s Law) | `tiffin/kitchen/[cookId]` | Richer plan cards, price/meal, open hours, story |
| Subscribe funnel | Kitchen → meals_per_week → confirm | Need day pattern, slot, prepaid package, flex quota display |
| My Orders calendar + 5 states | Shared orders list (not tiffin-calendar-first) | **New:** day calendar of materialised tiffin meals |
| Customize extras ≥8h | Not in tiffin | New flow + payment delta |
| Skip day + flex | Not modelled | New |
| My Subscriptions Active/Past + 5 card states | `tiffin/manage` single active only | Multi-status cards; past subs history |
| Manage: balance, deliveries left, flex, pause, recharge, cancel reasons | Manage: plan + cancel + planner | Expand manage screen |
| One-time order from kitchen | Marketplace one-off already exists | Deep-link kitchen “order once” alongside subscribe |
| Empty states | Basic empty copy | Designed empty set (`34`) |

### 1.2 Backend / data (Medusa `shc-tiffin`)

| Entity / concept | SHC today | HomelyEats need |
|------------------|-----------|-----------------|
| `shc_tiffin_kitchen_config` | enable, tagline, days, eligible products | + meal windows (breakfast/lunch/dinner), plan SKUs, flex quota defaults, menu publish lead time |
| `shc_tiffin_subscription` | one active; cook_id; meals_per_week 2/3/4 | + status enum, balance_cents, deliveries_left, flex_remaining, flex_quota, expires_on, paused_until, cancel_reason, package_id |
| `shc_tiffin_weekly_plan` | template + next-week override slots | Keep; also support pattern presets (weekdays/weekends) |
| Meal instances | Worker materialises `shc_order_meta` weekly (`TIFFIN-…`) | Persist **order status** for tiffin: indeterminate / scheduled / delivered / skipped / canceled_by_kitchen; customizable_until |
| Ledger | — | `shc_tiffin_ledger` (recharge, meal debit, extra item) |
| Flex ledger | — | fields on sub + audit events |
| Cutoff | — | business rule: skip/customize only if `now < slot_start - 8h` |

### 1.3 Business rules package

Today (`packages/business-rules/src/tiffin.ts`):

- `assertOneKitchenSubscription`  
- `validateWeeklyPlanSlots` (2–4 meals, one per day, eligible products)  
- week helpers  

**Add:**

- `TIFFIN_CUSTOMIZE_CUTOFF_HOURS = 8`  
- `canSkipTiffinOrder`, `canCustomizeTiffinOrder`  
- `applyFlexDay`, `pauseSubscription`, `resumeSubscription`  
- `rechargePackage`, `cancelSubscription`  
- subscription status transitions  
- order instance status transitions  

### 1.4 Cook side (out of HomelyEats UI but required)

| Need | SHC |
|------|-----|
| Publish daily menu for upcoming slots | New cook UI + API |
| Cancel a day’s meal for kitchen reasons | Transition + notify |
| See subscriber count | Aggregate on kitchen DTO |
| Config meal windows + flex defaults | Extend cook tiffin config |

### 1.5 Web

HomelyEats is mobile-only case study. SHC gap already: **tiffin web parity P2**. After mobile redesign, mirror manage + calendar on web customer + cook portal.

---

## 2. Product decisions to lock before coding

Agents must not invent these — confirm with founder / mark as proposed defaults:

| # | Decision | Proposed default (HomelyEats-aligned) | SHC conflict? |
|---|----------|----------------------------------------|---------------|
| D1 | Multi-kitchen concurrent subs? | **No** — keep one active kitchen | Matches SHC |
| D2 | Prepaid balance vs pure weekly billing? | **Hybrid:** weekly plan price + optional recharge packages | New |
| D3 | Flex days quota | e.g. `meals_per_week`-scaled or fixed 2 skips / week | New |
| D4 | Cutoff hours | **8h** before collection slot | New |
| D5 | Fulfillment | **Collection** (not kitchen delivery radius) | SHC lock-in |
| D6 | Materialisation horizon | Keep Mon cron for next week + ensure calendar shows template-projected days | Extend |
| D7 | Debit timing | Debit on **ready_for_collection / completed** | Align with order state |
| D8 | One-time from tiffin kitchen | Reuse cart/checkout with cook lock | Existing |

Until founder confirms D2–D4, implement **states + UI shells** behind feature flags (`FEATURE_FLAGS.md`).

---

## 3. Target information architecture (customer mobile)

```
Discover
  └─ Promo "Weekly tiffin" ──► TiffinBrowse (kitchens)
Account / Profile tile ─────► same

TiffinBrowse
  ├─ KitchenCard ──► TiffinKitchen
  │                    ├─ Subscribe funnel
  │                    └─ Order once (marketplace)
  └─ Active banner ──► MyTiffinSubscriptions (or Manage if single)

MyTiffinSubscriptions
  Active | Past
  └─ card ──► ManageSubscription
                 ├─ Pause / Recharge / Cancel
                 ├─ Edit pattern / slots / instructions
                 └─ Open planner (week template)

Orders tab (enhanced)
  └─ Calendar strip + TiffinOrderCards (5 states)
        ├─ Customize extras
        └─ Skip (flex)
```

**Bottom nav:** do **not** force HomelyEats four-tab rename; integrate into existing SHC tabs (Discover / Orders / Profile + hidden tiffin stack). Optionally add Orders calendar mode when user has active tiffin.

---

## 4. Implementation phases (PR plan)

### Phase A — Spec freeze (docs only)

- [x] Extract case study + images (this folder)  
- [ ] Patch `05-data-model`, `06-api-surface`, `09-order-state` (or tiffin subsection) with proposed states  
- [ ] Add decision tree `DECISION_TREES/tiffin-subscription-homelyeats.md` if needed  
- [ ] Lock D1–D8 in `00-locked-decisions` or tiffin section  

### Phase B — Domain + API

| Work | Files (approx) |
|------|----------------|
| Migration: subscription columns + order instance fields + ledger table | `apps/medusa/src/modules/shc-tiffin/` |
| Business rules | `packages/business-rules/src/tiffin.ts` + tests |
| API | `GET/POST` skip, pause, resume, recharge, cancel-with-reason; order customize |
| Materialiser | set initial status `scheduled`/`indeterminate`; honour skips |
| DTOs | kitchen subscriber_count; flex/balance fields |
| Api-client | methods + types in `packages/shc-api-client`, `shc-types` |

**Verify:** `TOUCHES_API=1` → push main → curl Railway routes.

### Phase C — Customer UI (mobile)

| Screen | HomelyEats ref | SHC path |
|--------|----------------|----------|
| Browse + cards | `18`, `22` | `tiffin/index.tsx` |
| Kitchen | `23` | `tiffin/kitchen/[cookId].tsx` |
| Subscribe | `24` | kitchen + confirm |
| Manage | `29` | `tiffin/manage.tsx` |
| Subscriptions list | `28` | new or manage if single-only |
| Orders calendar | `25` | orders index mode or `tiffin/orders.tsx` |
| Customize | `26` | order detail tray |
| Skip | `27` | order card action |
| Pause / Recharge / Cancel | `30`–`32` | manage sheets |
| Empty | `34` | all of above |

Shared: extend `@shc/ui` `tiffin-ux.tsx` (status chips, calendar strip, plan metrics). **Family Values**, not orange.

**Verify:** `FLAVOUR=wiring SCOPE=tiffin pnpm verify:goal` + Maestro tiffin flows.

### Phase D — Cook UI

- Menu publish for upcoming collection days  
- Cancel day reason  
- Config: windows, flex defaults, plan taglines  
- Dashboard metrics: active subscribers  

**Verify:** cook Maestro `tiffin-config` extended.

### Phase E — Web parity

- Customer: browse / manage / calendar  
- Cook portal: config + menu  

### Phase F — Polish

- Empty states, copy, push notifications on cancel/skip/menu ready  
- Feature flags off → on  
- `pnpm verify:full` milestone  

---

## 5. State model to implement

### SubscriptionStatus

```ts
type TiffinSubscriptionStatus =
  | "active"
  | "paused"
  | "expired"
  | "canceled";
```

Card presentation layer derives:

- `active` + `expires_on - now <= 3d` → **Expires soon** chip  
- `paused` → **Paused till date**  
- `canceled` / `expired` → Past tab  

### TiffinOrderInstanceStatus

```ts
type TiffinOrderInstanceStatus =
  | "indeterminate"
  | "scheduled"
  | "delivered"      // map to SHC completed / collected as product decides
  | "skipped"
  | "canceled_by_kitchen";
```

Map onto existing `shc_order_meta` status machine carefully — either:

- **Option 1 (preferred):** tiffin-specific status field parallel to marketplace order status  
- **Option 2:** reuse marketplace states with skip as terminal side-state  

Document choice in `09-order-state.md`.

### Cutoff helper

```ts
function canMutateTiffinOrder(slotStart: Date, now = new Date(), hours = 8) {
  return now.getTime() <= slotStart.getTime() - hours * 3600_000;
}
```

---

## 6. API sketch (additive)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/store/shc/tiffin/subscription` | customer | Expand DTO (status, balance, flex, expires) |
| POST | `/store/shc/tiffin/subscription/pause` | customer | body: until_date |
| POST | `/store/shc/tiffin/subscription/resume` | customer | |
| POST | `/store/shc/tiffin/subscription/recharge` | customer | body: package_id |
| POST | `/store/shc/tiffin/subscription/cancel` | customer | body: reason |
| GET | `/store/shc/tiffin/orders?from&to` | customer | Calendar range of meal instances |
| POST | `/store/shc/tiffin/orders/:id/skip` | customer | flex |
| POST | `/store/shc/tiffin/orders/:id/customize` | customer | extras + pay |
| PUT | `/store/shc/tiffin/cook/menu` | cook | publish day menu |
| POST | `/store/shc/tiffin/orders/:id/kitchen-cancel` | cook | reason |

Existing routes remain; expand, don’t break.

---

## 7. UI component checklist (`@shc/ui`)

| Component | HomelyEats ref | Notes |
|-----------|----------------|-------|
| `TiffinCalendarStrip` | `25` | horizontal days |
| `TiffinOrderCard` + variants | `25` | 5 states + CUSTOMIZABLE tag |
| `TiffinSubscriptionCard` | `28` | 5 variants |
| `TiffinPlanMetrics` | `29` | balance / deliveries / flex / expiry |
| `TiffinKitchenCard` | `18`/`22` | rating, price band, subscriber count |
| `TiffinPromoBanner` | `18` | discover |
| `TiffinEmptyState` | `34` | |
| Status chips | — | map to Family Values colours |

---

## 8. What NOT to copy

1. Orange primary brand  
2. Pure delivery-radius model without founder OK  
3. Multi concurrent kitchen subscriptions (unless D1 unlocked)  
4. INR / Indian meal taxonomy as default (map to SG heritage cuisines)  
5. Guest checkout against SHC auth guards — guest **browse** OK; subscribe still JWT  

---

## 9. Verification matrix

| Phase | Command |
|-------|---------|
| Mid-build domain | `FILTER=business-rules pnpm verify:wip` |
| API | `TOUCHES_API=1` + Railway curl after push |
| Mobile wiring | `FLAVOUR=wiring SCOPE=tiffin pnpm verify:goal` |
| UI polish | `FLAVOUR=polish SCOPE=tiffin pnpm verify:goal` |
| Milestone | `pnpm verify:full` |

Maestro: extend `tiffin-subscribe.yaml` with skip/pause; cook menu publish.

---

## 10. Agent execution order (when building)

1. Read this plan + open referenced images for the screen you touch  
2. Update blueprint data/API/state sections **same PR** as schema  
3. Rules + tests first  
4. API + materialiser  
5. `@shc/ui` components  
6. Customer screens  
7. Cook screens  
8. Web  
9. `CURRENT_STATE.md` + `INDEX.md` Last Updated  

---

## 11. Success criteria

- Customer can subscribe, see **calendar of upcoming tiffin meals**, **skip** with flex, **pause**, **recharge**, **cancel with reason**.  
- Order cards show HomelyEats-equivalent states with SHC collection language.  
- Manage screen shows deliveries left / flex / expiry (and balance if D2 prepaid).  
- Cook can publish menu + cancel a day.  
- One-kitchen rule enforced.  
- Family Values visual system.  
- Blueprint synced; Railway live if API touched.

---

*References: [CASE_STUDY.md](./CASE_STUDY.md) · [IMAGE_INDEX.md](./IMAGE_INDEX.md) · SHC [CURRENT_STATE.md](../../CURRENT_STATE.md) · `packages/business-rules/src/tiffin.ts`*
