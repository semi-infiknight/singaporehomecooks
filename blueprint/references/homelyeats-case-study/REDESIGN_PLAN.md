# Redesign Plan — HomelyEats × Singapore Home Cooks

**Source case study:** [How I simplified ordering home-cooked meals…](https://medium.com/design-bootcamp/how-i-simplified-ordering-home-cooked-meals-with-a-subscription-centric-app-a-product-design-521a82b219be)  
**Distilled:** [CASE_STUDY.md](./CASE_STUDY.md) · **Assets:** [IMAGE_INDEX.md](./IMAGE_INDEX.md) + `images/`  
**Last Updated:** 2026-07-09  
**Status:** Canonical execution brief for agents (UI/flow overhaul + additive subscription OS)

---

## 0. Founder constraints (non-negotiable)

These override any earlier draft of this plan that implied rip-and-replace.

| Rule | Meaning for agents |
|------|---------------------|
| **No feature removal** | Every existing SHC capability stays (marketplace cart/checkout, one-cook cart, allergens, listings CRUD, cook portal, ops, credits, requests/bids, heritage, push, PayNow path, compliance, earnings, etc.). |
| **No drastic feature rewrites** | Prefer **re-skin + re-flow + wire** over re-architecting working domains. Change behaviour only when fixing a real bug or closing a documented gap. |
| **Adding is welcome** | New screens, states, and flows from HomelyEats (calendar orders, flex/skip, pause, recharge UX, empty states, richer manage) are **in scope**. |
| **UI is the weakest part** | Prioritise layout, hierarchy, components, empty states, status chips, calendar IA, and tri-platform visual parity. |
| **UI + flows overhaul is #1** | Success = users *feel* a subscription-centric home-cook product; not a pile of disconnected screens. |
| **Condense / restructure OK** | Merging thin screens, elevating secondary actions into trays, and new entry points are allowed **if** no capability is lost. |
| **New pages/flows OK** | e.g. tiffin calendar, subscription manage OS, cook menu-publish — allowed. |
| **Stack stays the same** | Turborepo + Expo (customer + cook) + Next web PWA + Medusa on **Railway** (Postgres, Redis, worker, MinIO). No new repos, no localhost backend for clients, no mock runtime. |
| **Simultaneous surfaces** | Implement **web + mobile-customer + mobile-cook** together (iOS *and* Android via Expo). No “mobile-only then maybe web”. Use `@shc/ui` + `tri-platform-ui-sync`. |
| **All issues fixed properly** | Known gaps (seed, empty kitchens, unwired CTAs, auth guards, Maestro skips, missing empty states) are **close**, not paper over. |

### What “nothing breaks” means

1. Existing Maestro flows and `verify:real-e2e` keep greening (or get updated in the same goal).  
2. Railway live routes keep working after every `TOUCHES_API=1` push.  
3. `testID`s for critical paths preserved or dual-supported during migration.  
4. Feature flags only for *new* subscription OS pieces that need staged rollout — not to hide broken old paths.

---

## 1. North star (product)

Ship a **full-fledged** SHC where:

1. **Marketplace one-off orders** remain first-class (discover → PDP → cart → checkout → track).  
2. **Tiffin / subscription** becomes a **first-class OS** inspired by HomelyEats (browse kitchens → subscribe → calendar meal instances → skip/customize/pause/manage) — **collection-first**, Singapore heritage, Family Values + Gourmeat skin.  
3. UI density, trust signals, empty states, and status clarity match case-study quality **without** copying orange brand or INR/delivery model.

| Keep (SHC lock-ins) | Borrow (HomelyEats) | Explicitly do not adopt |
|---------------------|---------------------|-------------------------|
| One active tiffin kitchen per customer | Calendar “My orders” for meal instances | Multi concurrent kitchen subs (unless later unlocked) |
| HDB collection slots | 5 order-card states + CUSTOMIZABLE tag | Pure delivery-radius logistics |
| Family Values / Gourmeat | Flex days + pause + manage metrics | HomelyEats orange as brand |
| Railway Medusa only | Subscribe conversion funnel clarity | Guest checkout (browse guest OK) |
| Full marketplace + growth features | Empty states, social proof, plan cards | Removing any marketplace screen |

---

## 2. Platform matrix (simultaneous)

Every UI goal in this plan touches **all** of:

| Surface | Package / app | Runtime |
|---------|---------------|---------|
| Customer mobile | `apps/mobile-customer` | Expo · iOS + Android |
| Cook mobile | `apps/mobile-cook` | Expo · iOS + Android |
| Web customer + cook | `apps/web` | Next PWA · Railway web service |
| Shared UI | `packages/shc-ui` | RN components + web mirrors in `SHCWebComponents` |
| API / rules | `apps/medusa`, `@shc/api-client`, `@shc/business-rules`, `@shc/types` | Railway medusa + worker |

**Agent rule:** Do not merge a customer-mobile-only tiffin redesign. Prefer vertical slices:

```
@shc/ui component → customer mobile + cook mobile (if cook) + web mirror → api-client → Medusa → blueprint
```

---

## 3. Inventory — keep, elevate, add

### 3.1 Keep (must still work after overhaul)

| Domain | Surfaces |
|--------|----------|
| Auth customer + cook JWT | all |
| Discover / search / PDP / cart / checkout / allergen | customer mobile + web |
| Orders track, chat, review | customer + cook + web |
| Listings CRUD, compliance, earnings | cook + cook portal |
| Credits, requests/bids, heritage, notifications | existing routes |
| Tiffin browse / subscribe / planner / manage (current) | all (already parity-started) |
| Ops admin surfaces | web `/ops` |
| Push registration | mobile + web |

### 3.2 Elevate (UI/flow overhaul — no capability drop)

| Area | Today weakness | HomelyEats ref | Target |
|------|----------------|----------------|--------|
| Discover + tiffin entry | Promo only | `18` | Richer tiffin rail; kitchen cards with social proof |
| Kitchen / subscribe | Functional, thin | `23`–`24` | Jakob’s Law kitchen; clear plan picker + trust copy |
| Manage subscription | Minimal cancel/planner | `28`–`32` | Metrics bar, pause/recharge/cancel-reason shells |
| Orders | Generic list | `25` | Calendar strip + status variants when tiffin active |
| Empty / error | Sparse copy | `34` | Designed empty states everywhere |
| Cook tiffin config | Form-only | — | Dashboard metrics + menu publish entry |
| Web mirrors | Functional | same | Match mobile IA 1:1 |

### 3.3 Add (welcome — subscription OS)

| Capability | Notes |
|------------|--------|
| Flex days + skip meal instance | 8h cutoff default |
| Pause / resume subscription | Extends period (HomelyEats rule) |
| Recharge / extend plan UX | Even if billing stays weekly at first |
| Cancel with reason chips | Feedback loop |
| Order instance statuses | indeterminate / scheduled / delivered / skipped / canceled_by_kitchen |
| Cook day menu publish | “Menu yet to be updated” on cards |
| Cook cancel day | Notifies customer |
| Subscriber count on kitchen DTO | Social proof |
| Past subscription history | Active / Past tabs |

---

## 4. Issues to close (must fix, not defer)

Tracked as **definition of done** for this programme — not optional polish.

| # | Issue | Fix criteria |
|---|--------|--------------|
| I1 | Railway kitchens empty / MikroORM blind | ✅ Full `seed.ts` on boot (includes tiffin) + kitchen API via module/`shc-tiffin-pg`; keep greening in CI smoke |
| I2 | Web tiffin missing | ✅ routes shipped; must stay wired + visually overhauled with mobile |
| I3 | Customer Maestro skipped when kitchens 404 | Re-enable full `tiffin-subscribe` when kitchens ≥1 live |
| I4 | Unwired CTAs / empty shells | Every tiffin button hits api-client; no dead “coming soon” |
| I5 | Order list lacks tiffin calendar mode | Calendar strip + instance cards on customer orders |
| I6 | No skip/pause/flex | Business rules + API + UI all three surfaces |
| I7 | Manage lacks metrics / history | Deliveries left, flex, expiry, past subs |
| I8 | Cook cannot publish menu / cancel day | Cook mobile + portal + API |
| I9 | Empty states look unfinished | `34`-grade empties on browse, orders, manage, cook config |
| I10 | Tri-platform drift | Same IA + `@shc/ui` tokens on web + both apps |
| I11 | API goals without Railway push | `TOUCHES_API=1` → push main → curl live |
| I12 | CI/web build regressions (`@shc/types`, etc.) | Fix properly so ship path stays green |

---

## 5. Target IA (customer) — overhaul, not replacement

Keep existing tabs; **elevate** tiffin inside them.

```
Discover
  ├─ Marketplace rails (unchanged capability)
  └─ Tiffin promo / category entry ──► TiffinBrowse

TiffinBrowse
  ├─ KitchenCard ──► Kitchen
  │                    ├─ Subscribe funnel (meals/week → confirm → planner)
  │                    └─ Order once (existing cart, same cook)
  └─ Active plan banner ──► Manage / Subscriptions

Orders (enhanced when sub active)
  ├─ One-off orders (existing)
  └─ Calendar strip + TiffinOrderCards (new layer, same tab)

Profile
  └─ Tiffin tile ──► Browse or Manage
```

Cook:

```
Dashboard
  └─ Tiffin quick action ──► Config + Menu publish + Subscriber metrics
Orders
  └─ Tiffin instances appear with kitchen cancel when applicable
```

Web mirrors paths 1:1: `/tiffin/*`, `/orders` calendar mode, `/cook-portal/tiffin`.

---

## 6. Visual system (UI overhaul rules)

1. **Do not** restyle the product to HomelyEats orange.  
2. **Do** match HomelyEats **structure**: annotated hierarchy, card variants, horizontal calendar, metric rows, bottom sticky CTAs, empty illustrations.  
3. Tokens: Family Values + Gourmeat (`brand.md`, `design-taste.md`, `@shc/ui/theme`).  
4. Motion: trays, morph labels, directional tabs — existing Family Values stack.  
5. Reference images while building: open `images/semantic-*.png` for the screen under work.  
6. **Tri-platform:** change component once in `@shc/ui` (or paired web export), then all surfaces.

---

## 7. Domain + API (additive only)

### 7.1 Defaults (implement without waiting)

| # | Decision | Default |
|---|----------|---------|
| D1 | Multi-kitchen concurrent | **No** (keep one active) |
| D2 | Billing model v1 | Keep weekly price display; add **fields** for balance/recharge UI (can be cosmetic until PayU) |
| D3 | Flex quota | `max(2, meals_per_week - 1)` per period (adjustable) |
| D4 | Cutoff | **8 hours** before collection slot start |
| D5 | Fulfillment | **Collection** |
| D6 | Materialise | Keep Mon worker + project calendar from template |
| D7 | Debit / complete | Align with existing order state machine |
| D8 | One-time | Existing cart/checkout |

### 7.2 Additive API (do not break existing)

Existing routes stay. Expand DTOs; add:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/store/shc/tiffin/subscription` | + status, flex, expires, deliveries_left |
| POST | `…/subscription/pause` · `resume` · `recharge` · `cancel` | Manage OS |
| GET | `/store/shc/tiffin/orders?from&to` | Calendar instances |
| POST | `…/orders/:id/skip` · `customize` | Flex + extras |
| PUT | `/store/shc/tiffin/cook/menu` | Day menu publish |
| POST | `…/orders/:id/kitchen-cancel` | Kitchen cancel |

Kitchen list continues via pg path (`shc-tiffin-pg`) until MikroORM is proven.

### 7.3 States

**Subscription:** `active` | `paused` | `expired` | `canceled` (+ UI chips: expires soon, paused till).

**Meal instance:** `indeterminate` | `scheduled` | `delivered` | `skipped` | `canceled_by_kitchen`  
Prefer **parallel field** on tiffin-backed `shc_order_meta` rather than breaking marketplace order SM.

---

## 8. Implementation waves (tri-platform each wave)

Each wave = **one goal**: many commits → one `FLAVOUR=* SCOPE=tiffin pnpm verify:goal` → blueprint patch → push if API.

### Wave 0 — Baseline green (in progress / done)

- [x] Case study extract + images  
- [x] Railway seed + kitchens live  
- [x] Web tiffin routes scaffold  
- [ ] Maestro customer tiffin re-enabled against live kitchens  
- [ ] CI blockers that break ship (I12) fixed  

### Wave 1 — UI foundation (highest priority)

**Flavour:** `polish` + `tri-platform` · **No API required first**

1. `@shc/ui` tiffin kit: calendar strip, order card variants, subscription cards, plan metrics, kitchen card, empty states (refs `18`–`25`, `28`–`29`, `34`).  
2. Restyle existing customer tiffin screens (mobile + web) to kit.  
3. Restyle cook tiffin config (mobile + portal).  
4. Discover/profile entry polish (promo, active-plan banner).  
5. Empty states everywhere tiffin can be empty.

**Done when:** Visual parity web + both apps; no new dead ends; screenshots match structure of case study (not palette).

### Wave 2 — Orders calendar + instance presentation

**Flavour:** `feature` + `wiring`

1. API: list tiffin meal instances for date range (even if thin wrapper over materialised orders).  
2. Customer Orders tab: calendar mode when sub active (mobile + web).  
3. Card states + “menu not updated” / CUSTOMIZABLE tag (cutoff-aware once rules land).  
4. Preserve one-off order list.

### Wave 3 — Flexibility OS (skip / pause / cancel reasons)

**Flavour:** `feature` + `wiring` · **TOUCHES_API=1**

1. Business rules: flex, 8h cutoff, pause extend.  
2. API: skip, pause, resume, cancel+reason.  
3. UI: manage metrics + actions (mobile + web).  
4. Cook: kitchen-cancel day + notify.  
5. Push copy for skip/cancel.

### Wave 4 — Cook menu + trust + social proof

1. Cook publish menu for day.  
2. Kitchen DTO: subscriber_count, open hours if available.  
3. Subscribe funnel trust copy (allergens, collection, one kitchen).  

### Wave 5 — Recharge / ledger UX (additive)

1. Schema fields for balance/deliveries if not present.  
2. Recharge UI (can post to stub/ledger until real PayU).  
3. Transaction list on manage (ref `29`).  

### Wave 6 — Harden + ship

1. [x] Maestro: cook `tiffin-config.yaml`; customer `tiffin-subscribe.yaml` + **`tiffin-flex-os.yaml`** (pause/recharge/calendar); `pnpm e2e:tiffin`  
2. [x] Verify hooks: `SCOPE=tiffin TOUCHES_API=1 pnpm verify:goal` runs `pnpm smoke:tiffin`; full milestone includes tiffin smoke  
3. [x] Railway smoke: `scripts/smoke-tiffin-routes.ts` (`pnpm smoke:tiffin`) — kitchens, sub, pause, resume, recharge, skip, cook menu  
4. [x] Blueprint: CURRENT_STATE + INDEX progress; false-401 subscribe error masking fixed in tiffin routes  

**Post-wave ship:** `git push` + medusa redeploy so ledger writes + honest error bodies go live.

### Wave 7 — Production ship closeout (post-programme)

1. [x] **Postgres-first subscribe** — `pgCreateOrUpdateSubscription` / `pgGetActiveSubscription` (fix MikroORM write failures that looked like 401)  
2. [x] **Ship script** — `bash scripts/ship-tiffin-wave7.sh` (push optional, typecheck, `REQUIRE_TIFFIN_SMOKE=1 pnpm smoke:tiffin`)  
3. [x] **API surface docs** — pause/resume/recharge/ledger/balance on `06-api-surface`  
4. [x] **Error mapping** — `tiffinCustomerError` (401 only for real UNAUTHORIZED)  
5. [ ] **Operator:** push `main` + Railway medusa redeploy → green full smoke  

```bash
bash scripts/ship-tiffin-wave7.sh          # push + verify
SKIP_PUSH=1 SLEEP_S=60 bash scripts/ship-tiffin-wave7.sh   # after manual deploy
```

---

## 9. Per-surface checklist (every wave)

| Check | Customer mobile | Cook mobile | Web |
|-------|-----------------|-------------|-----|
| Screen exists | ✓ | ✓ | ✓ |
| Wired to `@shc/api-client` | ✓ | ✓ | ✓ |
| Family Values / Gourmeat | ✓ | ✓ | ✓ |
| testIDs stable | ✓ | ✓ | data-testid |
| Empty + error | ✓ | ✓ | ✓ |
| iOS + Android | Expo both | Expo both | PWA |
| Blueprint notes | same commit | same | same |

---

## 10. What NOT to do

1. Remove marketplace, cart, credits, requests, heritage, ops, or compliance.  
2. Swap stack or point clients at localhost Medusa.  
3. Copy HomelyEats orange / multi-kitchen / delivery-only model.  
4. Ship mobile-only redesigns that leave web or cook portal behind.  
5. Swallow API errors into empty arrays without logging (lessons from tiffin kitchen list).  
6. Declare API goals done without `git push origin main` + live curl.  
7. “Temporary” unwired CTAs.  
8. Delete old routes before clients migrate (expand → dual-read → switch).

---

## 11. Verification

| Wave | Command |
|------|---------|
| UI | `FLAVOUR=polish SCOPE=tiffin pnpm verify:goal` |
| Wiring | `FLAVOUR=wiring SCOPE=tiffin pnpm verify:goal` |
| API | `TOUCHES_API=1` + Railway curl after push |
| Native | `RISK=native` / Maestro Android + iOS |
| Milestone | `pnpm verify:full` |

Device:

```bash
bash scripts/start-mobile-dev.sh   # :8081 + :8082 → Railway
pnpm web:dev                       # :3001
bash scripts/run-tiffin-e2e.sh
```

---

## 12. Success criteria (programme)

- [ ] No existing SHC feature regressed or removed.  
- [ ] Tiffin feels **subscription-centric** on **web + customer app + cook app** (iOS and Android).  
- [ ] Calendar meal management + flex/skip + pause + cancel reasons live.  
- [ ] Cook can configure kitchen, publish menu, cancel a day.  
- [ ] Empty states and status chips match case-study clarity (SHC brand).  
- [ ] Railway seed keeps kitchens non-empty; smoke never skips for 404.  
- [ ] Blueprint + CURRENT_STATE accurate; CI ship path healthy.  

---

## 13. Agent start order (next goal)

1. Read this file + open priority images in [IMAGE_INDEX.md](./IMAGE_INDEX.md).  
2. **Wave 1** first (UI foundation tri-platform) unless blocked by I12 CI.  
3. Then Wave 2 → 3 (calendar + flex) with API.  
4. Self-update blueprint every behaviour change.

---

*Related: [CASE_STUDY.md](./CASE_STUDY.md) · [CURRENT_STATE.md](../../CURRENT_STATE.md) · [agent/design-taste.md](../../agent/design-taste.md) · [agent/verify-protocol.md](../../agent/verify-protocol.md) · `.agents/skills/tri-platform-ui-sync/`*
