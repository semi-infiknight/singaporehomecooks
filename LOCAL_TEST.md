# Singapore Home Cooks — Local Test Host Guide (Integration + Polish wave)

**Goal:** Fully functional + locally testable RIGHT NOW. Uses frozen contracts (@shc/types + business-rules) + sophisticated mock-service (enforces EVERY rule: one-cook-per-cart, allergen-ack mandatory, min-qty, order-state transitions, address release only post-paid, chat, earnings 85%, create listings with schema parse, compliance stub) + shc-ui components.

Mock-service gives "production-like" demo experience until Backend finishes real Medusa store routes (already seeded + modules ready to serve same shapes).

## Exact Run Commands
From repo root (`/Users/semi/Vibecode/SingaporeHomeCooks`):

1. Install (once):
   ```
   pnpm install
   ```

2. (Optional but recommended for type safety) Build shared packages:
   ```
   pnpm turbo build --filter=shc-types --filter=shc-utils --filter=business-rules
   ```

3. Start mobile (primary, fully wired):
   ```
   cd apps/mobile
   npx expo start
   ```
   - iOS/Android: scan QR in Expo Go.
   - Web: press `w` (or `a` for Android emu, `i` for iOS).
   - From root turbo: `pnpm --filter mobile dev` (or `pnpm turbo dev --filter=mobile`).

4. (Parallel backend when needed — not required for full mobile E2E):
   ```
   # Terminal 2: docker (Postgres for Medusa when real)
   docker-compose up -d
   cd apps/medusa
   pnpm dev   # or root: pnpm turbo dev --filter=medusa
   # Admin: http://localhost:9000 (login with seed creds if configured)
   ```
   Medusa store routes exist at /store/shc/* (products, cooks, orders placeholder, health) and consume contracts.

## DevRoleSwitcher (root layout, always visible)
- Top bar: "DEV SWITCH (test full E2E): Customer | Cook (Auntie Rose)"
- Tapping switches role + **auto-navigates** to matching home/dashboard (smooth testing of BOTH journeys in one app session, no restart/exit).
- Current role shown. Use it to:
  - Browse as customer → add → cart/checkout.
  - Switch to Cook mid-flow → see orders update → accept/prepare/ready/collected.
- All state (orders, cart, chat, listings) lives in-session in mock (persists until reload).

## Full End-to-End Flow (Exercise EVERYTHING — rule + schema enforced live)
Use DEV switcher freely. Start as Customer.

1. **Discover** (app/ or /(customer)/index): 
   - Search input (testID=search-input).
   - Occasion chips (Hari Raya etc — from seed).
   - Calorie filters (new): "<400 green", "<550 amber" — exercises maxCal in searchProducts + useProducts hook.
   - Results: rich heritage dishes from seed/index.ts (Nasi Lemak, Ayam Buah Keluak, Devil's Curry). 
   - **Calorie traffic-light badge**: GREEN/AMBER/RED badges (colors from shcColors.traffic*) + ~cal + confidence. Inline everywhere (discover + product + search).

2. **Profile / Cook detail** (/(customer)/cook/[slug] + sub index):
   - Tap "View Cook" → full HDB story, collection notes, listings grid (rich from seedCooks).
   - Tap dish → product.

3. **Product (ack + qty + earnings)** (/(customer)/product/[id]):
   - Heritage note, 3-tier allergens (mandatory disclosure).
   - Calorie traffic light.
   - Qty stepper (enforces min_qty in mock + business-rule validateMinQty → SHC-CART-002 error).
   - **AllergenAckCheckbox** (from shc-ui/domain) — MANDATORY. If not checked → block add (SHC-CART-003).
   - PriceEarningsCalc: live "Cook live earnings: S$X (15% platform fee)".
   - Add to cart button → calls useAddToCart mutation (TanStack + error handling with SHCErrorCode).

4. **Cart (one-cook)** (/(customer)/cart):
   - Shows items + **earnings preview** S$ (total*0.85).
   - Enforced by mock: addToCart calls enforceOneCookOnAdd + enforceOneCookPerCart + validateMinQty. Try cross-cook → SHC-CART-001.
   - Clear or Proceed to Checkout.

5. **Checkout (slots + PayNow confirm + ref capture + transition)** (/(customer)/checkout):
   - CollectionSlotPicker (from seed-derived avail in mock; getAvailableSlots).
   - Allergen gate (re-ack).
   - **PayNowPanel**: enter ref (auto-suggests order-ref), "I have paid via PayNow — Confirm".
   - On confirm: captures ref, calls transitionOrder (exercises canTransition + SHCErrorCode on bad states).
   - Order created as 'paid' (mock checkout runs shcOrderMetaSchema.parse + returns earningsPreview).
   - Post-confirm: nav to order track. **Collection address note revealed post "paid"** (in order screen: "HDB Address released (post-paid)").

6. **Order track + chat** (/(customer)/orders/[id] + /(shared)/chat/[orderId]):
   - Status badge (OrderStatusBadge from shc-ui).
   - Address note (post-paid only, PDPA).
   - Earnings est on order.
   - Open Order Chat: polling every ~4.5s (useChat/useOrderChat hook with refetchInterval per 10-mobile).
   - Send msg → auto mock reply. Full two-way (role aware via useAuth).
   - Link back to track.

7. **Cook side** (switch with DEV top bar — auto goes to dashboard):
   - Dashboard: earnings snapshot, quick links to listings/orders/earnings/compliance + demo chat.
   - Orders list (/(cook)/orders): live list from useOrders('cook'). Action buttons: Accept (paid→accepted: address release sim), Prepare, Ready for Collection, Collected.
     - Every button → useTransitionOrder mutation → mock canTransition (09-order-state) + error banner on invalid (SHC-ORDER-001).
   - Listings + wizard (/(cook)/listings): existing + 4-step wizard (basics, tags, ingredients JSON editor from shc-ui/forms, review + PriceEarningsCalc + publish).
     - Publish → createCookListing (shcProductMetaSchema.parse enforced, adds to products/avail).
   - Earnings (/(cook)/earnings): now live getEarnings() from completed orders (85% calc). Previews everywhere.
   - Compliance (/(cook)/compliance): enhanced stub — SFA/WSQ toggles, filename input, upload → mock uploadComplianceStub. Note on Medusa verify.

8. **Review stub / more**:
   - Post-collected in order screen: "leave review" note (one per order, post-collected rule).
   - Onboarding (/ (shared)/onboarding): role choice + trust copy snippets (wired from seed).
   - Profile: links + trust + credits.
   - Search route: advanced filters + traffic badges.
   - All hooks (useProducts/useOrders/useCart/useChat + mutations) wrap api-client/mockFetch, surface SHCErrorCodes.

**Rules live everywhere (no bypass):** Try violating → red banners with codes (SHC-CART-001 etc). See ERROR_CODES.md + business-rules tests.

## TanStack Query + Polish Notes
- Hooks in apps/mobile/hooks/: useProducts (discovery + filters + calorie), useCart, useAddToCart (mutations error SHC), useOrders/useMyOrders, useCheckout, useTransitionOrder, useChat (polling).
- Invalidate + optimistic on success. Ready to point at real fetch later.
- shc-ui everywhere (no raw gluestack drift in most screens).
- Calorie traffic: green/amber/red per confidence in product/search/discover.

## Content/Seeds
Mock-service now cleanly imports from root `seed/index.ts` (seedCooks + seedDishes rich with HDB, stories, allergens, occasions, calories, festive from Content+Seed). No more empty inline. Same data for Medusa scripts.

## Gaps for Later Waves (explicit)
- Real push notifications (instead of 4.5s poll + setTimeout reply).
- Full Medusa persistence (swap mock-service for /store/shc calls + auth JWT; modules already consume contracts + links).
- Maestro E2E flows (testIDs present: search-input, add-to-cart-btn, paynow-ref-input, confirm-paynow, allergen-ack, slot-*, order-card-*, cook-card etc).
- Real PayNow + ref auto-match + weekly payout cron.
- Image upload (MinIO), video walkthroughs, reviews module.
- Web parity (phase-10), native push, production auth.
- Backend: more /store/shc/order transitions, carts complete, admin compliance verify.
- Offline + query persistence.

## Verify
After changes:
```
pnpm turbo typecheck --filter=mobile
```
(Expect clean or only minor non-blocking.)

Run the flows above — the app now feels complete and delightful for heritage SG home-cook experience. Everything rule-enforcing + typed + seeded from contracts + Content.

Local testing ready. Switch roles, order, fulfil, chat — all in one session.
