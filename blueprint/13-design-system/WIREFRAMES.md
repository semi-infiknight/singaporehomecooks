# 13 — Design System Wireframes

**Related:** [brand.md](../../brand.md) · [12-shared-components](../12-shared-components/12-shared-components.md) · `packages/shc-ui`

**Last updated:** 2026-07-26 — Discover IA (mode switch, occasions route, filter sheet, honest ratings)

Screen-by-screen layout specs for Neo-Brutalist Food UI. All colours, borders, and motion rules are defined in [brand.md](../../brand.md).

---

## Shared layout tokens

| Token | Value | Wireframe use |
|---|---|---|
| `shcSpacing.md` | 16px | Screen horizontal padding |
| `shcBorders.brutal` | 2px `#241812` | Cards, tab bar, chips |
| `shcShadows.brutalSm` | 2×2 hard | Default card elevation |
| `shcSpacing.tabBarHeight` | 56px | Bottom nav safe area |

---

## 1. Customer Discover

**Route:** `/(customer)/index` (Discover tab) · `/occasions` (occasions browse)  
**Components:** `GourmeatHomeHeader`, `SHCHomePromoCarousel`, `GourmeatModeSwitch`, `SHCDiscoverFilterSheet`, `GourmeatDishCard`, `SHCTiffinKitchenCard`, `SHCBottomTabBar`  
**Web mirror:** `apps/web/app/page.tsx` + `apps/web/occasions/page.tsx` + `AppMobileTabBar`

### Zones (top → bottom)

| Zone | Component | Spec |
|---|---|---|
| Header | `GourmeatHomeHeader` | `discoverHomeHeadline(name, email)` — Hi + subtitle when signed in; guest fallback |
| Search | `GourmeatSearchBar` | Full-width search + filter badge (`discoverActiveFilterCount`) → filter sheet |
| Promo carousel | `SHCHomePromoCarousel` | **16:9** paging image promos (`discoverHomePromoCarousel()`); Hari Raya → `/occasions` |
| Cooking soon | Drop cards rail | 7-day window (`filterCustomerCookingSoonDrops`) |
| For you | Single merged rail | Reorder → saved → top rated (`discoverForYouRail`) |
| Browse switch | `GourmeatModeSwitch` | **Dishes \| Kitchens** + Occasions nav link (not inline mode) |
| Mode: dishes | `GourmeatCategoryRow` + dish grid | Cuisine rail + 2-col grid |
| Mode: kitchens | `SHCTiffinKitchenCard` list | Real rating when API sends; open status via `kitchenCardOpenProps` on tiffin only |
| Footer CTA | `RequestDishHomeCTA` | Request a dish |
| Bottom nav | `SHCBottomTabBar` | Discover · Orders · Cart · Profile |

### Filter sheet (discover, category, search)

| Group | Options |
|---|---|
| Meal | All · Breakfast · Lunch · Snacks · Dinner (`MEAL_TYPE_CHIPS`) |
| Cuisine | Full `MIND_CUISINE_CATEGORIES` (hidden on category pages) |
| Dietary | Halal · Vegetarian · Under 500 cal |
| Footer | Clear + Show N dishes |

### testIDs (Maestro)

| Element | testID |
|---|---|
| Header | `sticky-header` |
| Location | `sticky-header-location` |
| Search | `sticky-header-search` |
| Bento grid | `bento-grid` |
| Category rail | `category-rail` |
| Category chip | `category-chip-{id}` |
| Dish card | `dish-card-{id}` |
| Tab bar | `bottom-tab-bar` |
| Tabs | `discover-tab`, `orders-tab`, `cart-tab`, `profile-tab` |

### ASCII

See [brand.md § Customer Discover](../../brand.md#1-customer-discover).

---

## 2. Dish PDP (Product Detail)

**Route:** `/(customer)/product/[id]`  
**Components:** Hero stub, `SHCQtyStepper`, `AllergenAckCheckbox`, `SHCStickyActionBar`, `AICalorieBadge`

### Zones

| Zone | Spec |
|---|---|
| Hero | 4:3 image placeholder, brutal border, `bento-peach` fallback bg |
| Title block | H1 dish name, cook + area caption, mono price, rating, calorie badge |
| Heritage | `SHCCard variant="bento-peach"` — italic heritage note |
| Allergens | Tier-1 list + `AllergenAckCheckbox` (mandatory before add) |
| Collection | Slot label — **not** delivery ETA; copy: "Collect · {slot}" |
| Sticky bar | `SHCStickyActionBar`: `SHCQtyStepper` + primary CTA "Add S$XX" |

### testIDs

| Element | testID |
|---|---|
| Qty stepper | `qty-stepper`, `qty-stepper-decrement`, `qty-stepper-increment` |
| Allergen ack | `allergen-ack` |
| Sticky CTA bar | `sticky-action-bar` |
| Calorie badge | `ai-calorie-badge` |

### ASCII

See [brand.md § Dish PDP](../../brand.md#2-dish-pdp-product-detail).

---

## 3. Cart / Checkout

**Route:** `/(customer)/checkout`  
**Components:** `CollectionSlotPicker`, `AllergenAckCheckbox`, `WalletCard`, `PayNowPanel`, `SHCErrorBanner`

### Zones

| Zone | Spec |
|---|---|
| Summary | H1 total (mono), cook name, one-cook rule reminder |
| Slot picker | `CollectionSlotPicker` — selected slot `bento-mint` + primary border |
| Credits | `WalletCard` `variant="bento-mint"` + credit presets |
| PayNow | `PayNowPanel` — UEN, amount, QR stub, ref input (mono), confirm CTA |
| Errors | `SHCErrorBanner` above PayNow if payment validation fails |

### testIDs

| Element | testID |
|---|---|
| Slot picker | `collection-slot-picker` |
| Slot row | `slot-{date}-{slot}` |
| PayNow ref | `paynow-ref-input` |
| Confirm pay | `confirm-paynow` |
| Wallet | `wallet-card` |

### ASCII

See [brand.md § Cart / Checkout](../../brand.md#3-cart--checkout).

---

## 4. Cook Dashboard

**Route:** `/(cook)/dashboard`  
**Components:** `GourmeatCookHeader`, kitchen snapshot card, glance stats, setup checklist, tool chips, order rows  
**Helpers:** `@shc/utils` `buildCookDashboardSetupItems`, `cookDashboardKitchenSubtitle`, `cookDashboardOrdersNeedingCook`

### Zones

| Zone | Spec |
|---|---|
| Greeting | `Good morning, {firstName}` + kitchen · area · Open/Paused |
| Kitchen card | Onboarding snapshot: address, PayNow, halal, certs → settings |
| At a glance | This week earnings · active orders · menu dish count |
| Setup checklist | Incomplete items only (menu / PayNow / SFA·WSQ / profile) |
| Requests | Single custom-requests row (not duplicated in glance) |
| Tools | Compact chips: listings, orders, cooking soon, compliance, tiffin, earnings |
| Orders | Needs-action first; `order-card-{id}` |

### testIDs

| Element | testID |
|---|---|
| Screen | `cook-dashboard` |
| Hero | `cook-dashboard-hero` |
| Kitchen card | `cook-kitchen-settings-link` |
| Setup row | `cook-setup-{id}` |
| Order card | `order-card-{id}` |
| Logout | `logout-btn` |

### ASCII

See [brand.md § Cook Dashboard](../../brand.md#4-cook-dashboard).

## Component → screen matrix

| Component | Discover | PDP | Checkout | Cook |
|---|---|---|---|---|
| `SHCStickyHeader` | ✓ | — | — | — |
| `SHCBentoGrid` / `SHCBentoCell` | ✓ | — | — | ✓ |
| `SHCCategoryRail` | ✓ | — | — | — |
| `SHCDishCard` | ✓ | — | — | — |
| `SHCBottomTabBar` | ✓ | — | — | — |
| `SHCQtyStepper` | — | ✓ | — | — |
| `SHCStickyActionBar` | — | ✓ | — | — |
| `AllergenAckCheckbox` | — | ✓ | ✓ | — |
| `CollectionSlotPicker` | — | — | ✓ | — |
| `PayNowPanel` | — | — | ✓ | — |
| `WalletCard` | — | — | ✓ | — |
| `OrderCard` | — | — | — | ✓ |

---

## Governance

1. Layout changes start in `brand.md` wireframes, then this file, then `@shc/ui` components.
2. Screen implementations in `apps/mobile-*` consume components only — no inline hex.
3. Web parity tracked in `apps/web/app/components/SHCWebComponents.tsx` (separate agent).