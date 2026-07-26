# 13 — Design System Wireframes

**Related:** [brand.md](../../brand.md) · [12-shared-components](../12-shared-components/12-shared-components.md) · `packages/shc-ui`

**Last updated:** 2026-07-27 — Discover promo carousel + personalized greeting

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

**Route:** `/(customer)/index` (Discover tab)  
**Components:** `GourmeatHomeHeader`, `SHCHomePromoCarousel`, `SHCTiffinFilterChips`, `SHCZomatoDishRowRail`, `GourmeatCategoryRow`, `SHCDishCard`, `SHCBottomTabBar`  
**Web mirror:** same zone order in `apps/web/app/page.tsx` + `AppMobileTabBar`

### Zones (top → bottom)

| Zone | Component | Spec |
|---|---|---|
| Header | `GourmeatHomeHeader` | `discoverHomeHeadline(name, email)` — Hi + subtitle when signed in; guest fallback |
| Search | `GourmeatSearchBar` | Full-width search + filter |
| Promo carousel | `SHCHomePromoCarousel` | **16:9** paging image promos (`discoverHomePromoCarousel()`); dots below |
| Browse menu | `SHCTiffinFilterChips` | Meal-type chips (All / Breakfast / Lunch / Snacks) |
| Top rated | `SHCZomatoDishRowRail` | Top dishes rail |
| Categories | `GourmeatCategoryRow` | Cuisine circles |
| Popular / events | Order-mode chips + rails | Popular, one-off, occasion filters |
| Cooking soon | Drop cards rail | 7-day window |
| Dish grid | `SHCDishCard` | 2-column FlashList |
| Bottom nav | `SHCBottomTabBar` | Discover · Orders · Cart · Profile |

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
**Components:** `SHCBentoGrid`, `SHCBentoCell`, `OrderCard`, `SHCSectionTitle`

### Zones

| Zone | Spec |
|---|---|
| Greeting | H1 "Good morning, {cook}" |
| Earnings bento | 2-up: weekly earnings (`bento-mint`) + rating/orders (`bento-peach`) |
| Quick actions | 4-col `SHCBentoGrid`: New listing, Calendar, Collaboration board, Messages |
| Orders list | `OrderCard` with action buttons per status |

### testIDs

| Element | testID |
|---|---|
| Order card | `order-card-{id}` |
| Cook quick action cells | `bento-cell-{action}` (set per screen impl) |

### ASCII

See [brand.md § Cook Dashboard](../../brand.md#4-cook-dashboard).

---

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