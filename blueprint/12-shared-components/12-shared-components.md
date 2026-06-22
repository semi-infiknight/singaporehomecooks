# 12 — Shared Components & UI Library

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [../13-design-system/WIREFRAMES.md](../13-design-system/WIREFRAMES.md)
- [../../brand.md](../../brand.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [packages/shc-ui](../04-monorepo/04-monorepo.md)
- `.agents/skills/tri-platform-ui-sync/SKILL.md`

**Last Updated:** 2026-06-22 (Location + request CTA) — `location-ux.tsx`, `location-map(.native).tsx`, `request-ux.tsx` (`SHCRequestDishHomeCTA`); heritage banner placement on Profile; tri-platform sync confirmed.
**Owner:** Mobile Track (+ Web mirrors via `SHCWebComponents.tsx`)

## Overview

The `shc-ui` package provides a cohesive design system and reusable component library used across **mobile-customer**, **mobile-cook**, and **web** (via mirrored components in `apps/web/app/components/SHCWebComponents.tsx`). Visual and behavioral consistency is enforced by the tri-platform sync rule in `brand.md` and `.agents/skills/tri-platform-ui-sync/`.

Design tokens and wireframes: [brand.md](../../brand.md) · [WIREFRAMES.md](../13-design-system/WIREFRAMES.md)

## Package layout (`packages/shc-ui/src/`)

| File | Purpose |
|---|---|
| `theme.ts` | Colors, spacing, borders, shadows, typography, motion tokens |
| `native.ts` | NativeWind theme bridge (`nativewind-theme.cjs`) |
| `primitives.tsx` | Buttons, cards, badges, inputs, bento grid/cells, sticky header, tab bar |
| `zomato.tsx` | Zomato-style layout: promo rail, filter chips, dish rows, sticky header, cuisine rail |
| `visuals.tsx` | `SHCFoodImage`, `SHCVisualBentoTile`, `SHCBentoStatCell`, `SHCZomatoAddButton`, rating pill |
| `icons.tsx` | `SHCIcon`, `SHCTabIcon`, `SHCBentoIconBadge` (Ionicons on mobile; web uses Lucide mirrors) |
| `motion.tsx` | `SHCFadeIn`, `SHCStaggerIn`, `SHCWizardPane` (Moti + Reanimated) |
| `food-ux.tsx` | Toptal principles: `SHCCheckoutStepper`, `SHCSearchResultRow`, `SHCSearchResultsPanel`, `SHCHeritageStoryBanner` |
| `location-ux.tsx` | `LocationPickerExperience` — 2-step collection point (search/GPS → map confirm) |
| `location-map.tsx` / `location-map.native.tsx` | `SHCLocationDraggableMap` — web tile fallback; iOS `react-native-maps`; Android Carto OSM tiles + pan/nudge |
| `request-ux.tsx` | Custom dish wizard + `SHCRequestDishHomeCTA` discover footer |
| `domain.tsx` | Dish cards, order rows, cart/cook page heroes, PayNow, collection slots, wizard progress |
| `forms.tsx` | Ingredient editor, occasion picker, earnings calc |

**Utils companion:** `packages/shc-utils/src/food-visuals.ts` (bento action photo URLs), `reorder.ts` (`extractReorderDishes`).

## Component Categories

### Theme tokens (`theme.ts`)

| Export | Contents |
|---|---|
| `shcColors` | Coral primary `#D96C4A`, accent yellow, brutal border `#241812`, bento surfaces |
| `shcSpacing` | xs–xl + `tabBarHeight`, `stickyHeaderPadding`, `section` (Toptal white-space gap) |
| `shcRadii` | sm–xl + `pill` |
| `shcBorders` | thin / brutal (2px) / thick |
| `shcShadows` | `brutal`, `brutalSm`, `brutalPressed` |
| `shcTypography` | display, h1–h3, body, caption, mono |
| `shcMotion` | Reanimated spring configs, Moti fade duration |

**Tri-platform rule:** any token change must update `brand.md`, `theme.ts`, `apps/web/app/globals.css`, and `SHCWebComponents.tsx` together.

### Zomato layout (`zomato.tsx`)

| Component | Purpose |
|---|---|
| `SHCZomatoStickyHeader` | Location + search sticky zone |
| `SHCZomatoLocationBar` | Location row with delivery/collection label |
| `SHCPromoRail` | Horizontal promo cards with food photos |
| `SHCFilterChipRow` | Halal, light, occasion filter chips |
| `SHCZomatoDishRow` / `SHCZomatoDishRowRail` | List/rail dish rows with image, price, ADD |
| `SHCZomatoSectionHeader` / `SHCMindSectionTitle` | Section titles with optional action |

### Visuals & icons (`visuals.tsx`, `icons.tsx`)

| Component | Purpose |
|---|---|
| `SHCFoodImage` | Consistent food photo with fallback gradient |
| `SHCVisualBentoTile` | Photo-background bento tile + icon badge + label |
| `SHCBentoStatCell` | Stat cell with icon (earnings, orders count) |
| `SHCZomatoAddButton` | Compact ADD CTA for search results |
| `SHCIcon` / `SHCTabIcon` | Vector icons (`SHCIconKey` type union) |
| `SHCBentoIconBadge` | Icon overlay on bento photo tiles |

**Visual-first rule:** photos lead on every list/grid; emoji-only placeholders are not permitted on primary screens.

### Toptal food-UX (`food-ux.tsx`)

| Component | Principle |
|---|---|
| `SHCCheckoutStepper` | Short journey — Collection → Safety → PayNow (3 steps) |
| `SHCSearchResultsPanel` / `SHCSearchResultRow` | Search + ADD without visiting PDP |
| `SHCHeritageStoryBanner` | Memorable local HDB cook story + trust link (Profile, not Discover) |
| `LocationPickerExperience` | Collection location 2-step flow with saved addresses + map confirm |
| `SHCLocationDraggableMap` | Draggable pin map (iOS native; Android OSM tiles) |
| `SHCRequestDishHomeCTA` | “Request a custom dish” footer CTA on Discover |

Web mirrors: `CheckoutStepper`, `SearchResultsDropdown`, `HeritageStoryBanner`, location picker in `SHCWebComponents.tsx` + `/location`.

### Core Primitives (`primitives.tsx`)

| Component | Purpose |
|---|---|
| `SHCButton` / `SHCButtonText` | Primary, outline, accent, ghost variants with brutal shadow press |
| `SHCCard` | Default + `bento-mint` / `bento-peach` / `bento-yellow` variants |
| `SHCBadge` | Status chips (success, warning, error, heritage) |
| `SHCInput` | Brutal-bordered input shell |
| `SHCSearchBar` | Full-width search with icon |
| `SHCSectionTitle` | H2 section headers |
| `SHCErrorBanner` | Inline error with optional code |
| `SHCBentoGrid` / `SHCBentoCell` | Configurable columns (2/3/4) + gap |
| `SHCStickyHeader` | Location row + search (legacy; prefer `SHCZomatoStickyHeader`) |
| `SHCBottomTabBar` | 4-tab bar with `SHCTabIcon` + Maestro testIDs |
| `SHCCategoryRail` | Horizontal scroll occasion chips with circular food photos |
| `SHCQtyStepper` | PDP quantity control |
| `SHCStickyActionBar` | Bottom sticky CTA shell (add-to-cart, PayNow) |

### Domain Components (`domain.tsx`)

| Component | Purpose |
|---|---|
| `SHCDishCard` | Zomato-style: ~70% image, name, cook, price, rating, collection slot |
| `SHCZomatoOrderRow` | Order list row with status + thumbnail |
| `SHCCartPageHero` / `SHCCartLineItem` | Cart page header + line items |
| `SHCCookPageHero` | Cook dashboard/orders/earnings hero |
| `SHCWizardProgress` | Listing wizard step indicator |
| `CookCard` | Cook profile preview with heritage snippet |
| `OrderCard` / `OrderStatusBadge` | Status-aware order cards |
| `PayNowPanel` | UEN, amount, ref input, confirm CTA |
| `CollectionSlotPicker` | HDB collection date/slot selector |
| `AllergenAckCheckbox` | Mandatory tier-1 allergen acknowledgment |
| `ListingWizardStep` | Cook listing wizard step shell |
| `CreditBadge` / `WalletCard` | Home Credits wallet |
| `AICalorieBadge` | Traffic-light calorie estimate |
| `RequestDishForm` | Custom dish request bidding form |

### Form Components (`forms.tsx`)

| Component | Purpose |
|---|---|
| `IngredientTierEditor` | JSON-like ingredient tier editor |
| `OccasionTagPicker` | Multi-select occasion chips |
| `PriceEarningsCalc` | Live cook earnings preview |

## Usage Patterns

```tsx
import {
  SHCZomatoStickyHeader,
  SHCPromoRail,
  SHCFilterChipRow,
  SHCVisualBentoTile,
  SHCTabIcon,
  SHCDishCard,
  SHCSearchResultsPanel,
  SHCHeritageStoryBanner,
  SHCCheckoutStepper,
  SHCBottomTabBar,
  shcColors,
} from '@shc/ui';
import { extractReorderDishes } from '@shc/utils';

// Discover (mobile-customer index.tsx pattern)
<SHCZomatoStickyHeader locationLabel="Katong" searchValue={q} onSearchChange={setQ} />
<SHCPromoRail items={promos} />
<SHCVisualBentoTile iconKey="cart" label="Cart" imageUri={...} onPress={goCart} testID="bento-cart" />
<SHCFilterChipRow chips={filters} selectedIds={sel} onToggle={toggle} />
<SHCHeritageStoryBanner onTrustPress={goTrust} />
<SHCDishCard dish={dish} onPress={() => openPDP(dish.id)} />
<SHCBottomTabBar tabs={TABS} activeKey="discover" onTabPress={navigate} />

// Checkout stepper (Toptal short journey)
<SHCCheckoutStepper steps={checkoutSteps} currentStep={checkoutStep} />

// Order again rail
const reorder = extractReorderDishes(orders);
```

All interactive components accept `testID` props for Maestro E2E. See [WIREFRAMES.md](../13-design-system/WIREFRAMES.md).

## Design System Governance

- Tokens live in `theme.ts` — **no hardcoded hex in screens** (especially not legacy `#1D9E75`).
- Any new component or token change requires updates to this document, `brand.md`, `WIREFRAMES.md`, and web mirrors.
- Use `.agents/skills/tri-platform-ui-sync/` when editing colors, layouts, or brand-facing UI.

## Production Notes

- Components use press-state shadow reduction (`brutalPressed`) for tactile feedback.
- Motion via Moti/Reanimated (`shcMotion` constants); lists via FlashList at screen level.
- Food imagery from `@shc/utils/food-visuals` — single source for bento action photos.
- All interactive components include loading, error, and empty states at screen level.

## Multi-Agent Notes

- **Mobile Track** owns `shc-ui` implementations; **Web** mirrors in `SHCWebComponents.tsx`.
- **Screen agents** wire components in `apps/mobile-*` and `apps/web` — do not duplicate primitives.
- Contracts Track owns data shapes (`SHCDishCardData`, `ReorderDish`, etc.).
- Content Track provides copy strings and illustration assets.

**Rule:** All shared UI must live in `packages/shc-ui`. Inline styles or duplicated components inside app folders are not permitted.