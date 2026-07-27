# 12 — Shared Components & UI Library

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [../13-design-system/WIREFRAMES.md](../13-design-system/WIREFRAMES.md)
- [../../brand.md](../../brand.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [packages/shc-ui](../04-monorepo/04-monorepo.md)
- [../agent/design-taste.md](../agent/design-taste.md)
- `.agents/skills/tri-platform-ui-sync/SKILL.md`

**Last Updated:** 2026-07-27 — `product-meta-form`; cook/admin platform config utils; admin-managed browse chrome.
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
| `motion.tsx` | `SHCFadeIn`, `SHCStaggerIn`, `SHCWizardPane` (Moti + Animated fallback) |
| `family-values-core.ts` | Tray stack reducer, morphing label segments, milestone keys, tab slide direction (unit-tested) |
| `tray.tsx` | `SHCTrayProvider`, `useSHCTray`, `SHCTrayAction` — bottom-sheet overlays |
| `family-values-ui.tsx` | `SHCMorphingLabel`, `SHCChevronNav`, `SHCDirectionalTabScene`, `SHCSharedDishImage`, `SHCCelebration`, `useMilestoneCelebration` |
| `tab-direction.tsx` | `TabDirectionProvider`, `DirectionalTabScreen` |
| `food-ux.tsx` | Toptal principles: `SHCCheckoutStepper`, `SHCSearchResultRow`, `SHCSearchResultsPanel`, `SHCHeritageStoryBanner` |
| `location-ux.tsx` | `LocationPickerExperience` — 2-step collection point (search/GPS → map confirm) |
| `location-map.tsx` / `location-map.native.tsx` | `SHCLocationDraggableMap` — web tile fallback; iOS `react-native-maps`; Android Carto OSM tiles + pan/nudge |
| `request-ux.tsx` | Custom dish wizard + `SHCRequestDishHomeCTA` discover footer |
| `domain.tsx` | Dish cards, order rows, cart/cook page heroes, PayNow, collection slots, wizard progress |
| `gourmeat.tsx` | Gourmeat/HITPay checkout: `GourmeatCategoryRow`, `GourmeatPayButton`, `GourmeatSearchBar`, layout re-exports |
| `forms.tsx` | Ingredient editor, occasion picker, earnings calc |
| `listing-form.tsx` | Cook listing wizard: allergen tier picker, availability (portions/days/slots), shared across mobile-cook + web cook-portal |
| `product-meta-form.tsx` | Cook listing step 3: meal extras, add-ons, recipe steps — shared web + mobile |

**Utils companion:** `packages/shc-utils/src/food-visuals.ts` (bento action photo URLs), `reorder.ts` (`extractReorderDishes`), **`discover-home.ts`** (`discoverHomeHeadline`, `discoverHomePromoCarousel`), **`discover-promos.ts`** + **`customer-browse-config.ts`** (admin-managed browse chrome), **`cook-portal-config.ts`** + **`business-rules-config.ts`** (admin-managed cook/rules), **`product-meta-form.ts`** + **`order-collection.ts`** (cook-owned listing/order fields), **`badge-ux.ts`** (semantic badge kinds → variants), **`listing-form.ts`** (allergen/availability form helpers + Zod).

## Component Categories

### Theme tokens (`theme.ts`)

| Export | Contents |
|---|---|
| `shcColors` | Coral primary `#D96C4A`, accent yellow, brutal border `#241812`, bento surfaces |
| `shcSpacing` | xs–xl + `section`, **`categoryStackGap`** (8px eyebrow/circle/label), deprecated `categoryLabelGap`/`categoryTitleGap` aliases |
| `gourmeatLayout` | `tabBarClearance` (88), `tabBarWithCartClearance` (156), **`stickyFooterClearance`** (80) |
| `contentPadForTabBar()` | Scroll bottom pad when floating tab bar visible |
| `contentPadForStickyFooter()` | Scroll bottom pad when screen has pinned Pay/CTA (checkout, PDP, kitchen) |
| `contentPadSafe()` | Stack/modal screens — safe area only (no tab bar) |
| `shcRadii` | sm–xl + `pill` |
| `shcBorders` | thin / brutal (2px) / thick |
| `shcShadows` | `brutal`, `brutalSm`, `brutalPressed` |
| `shcTypography` | display, h1–h3, body, caption, mono |
| `shcMotion` | Reanimated spring configs, Moti fade duration |

**Tri-platform rule:** any token change must update `brand.md`, `theme.ts`, `apps/web/app/globals.css` (`--shc-mobile-tab-pad`, `--shc-sticky-footer-pad`, `--shc-category-stack-gap`), and `SHCWebComponents.tsx` together. Web stack routes: `apps/web/lib/mobile-chrome.ts` → `hideMobileTabBar()`.

### Zomato layout (`zomato.tsx`)

| Component | Purpose |
|---|---|
| `SHCZomatoStickyHeader` | Location + search sticky zone |
| `SHCZomatoLocationBar` | Location row with delivery/collection label |
| `SHCPromoRail` | Horizontal promo cards with food photos (compact rail) |
| `SHCHomePromoCarousel` | Full-width **16:9** paging promo carousel for discover home (`home-promo-carousel`, `home-promo-dots`) |
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
| `SHCBadge` | Status chips (`success`, `warning`, `error`, `warm`) — prefer **`SHCMetaBadge`** with semantic `kind` |
| `SHCMetaBadge` | Product/ops chips — `kind` from `@shc/utils/badge-ux` maps to variant + label (cuisine → warm, price → warm, status → success/warning/error) |
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

### Skeleton / ghost loading (`skeleton.tsx`)

| Component | Purpose |
|---|---|
| `SHCSkeletonBone` | Pulsing bone block |
| `SHCSkeletonDishCard` / `SHCSkeletonDishGrid` | Discover dish card ghosts |
| `SHCSkeletonCookingSoonCard` / `SHCSkeletonCookingSoonRail` | Cooking soon strip |
| `SHCSkeletonKitchenRow` / `SHCSkeletonKitchenList` | Kitchen list rows |
| `SHCSkeletonOrderCard` / `SHCSkeletonOrderRow` / `SHCSkeletonOrderList` | Orders day cards / cook order rows |
| `SHCSkeletonList` | Generic stacked bars (cart, forms) |
| `SHCSkeletonHomeDiscover` | Composite home ghost block |

**Rule:** While `isLoading` / first fetch — show skeletons. Empty copy only when `!isLoading && data.length === 0`. Never `placeholderData: []` (paints empty as loaded). Web mirrors in `SHCWebComponents.tsx`.

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
| `PayNowPanel` | HitPay QR (`qr_image_data_url`), stable display during poll; no manual “I’ve paid” |
| `GourmeatCategoryRow` | Cuisine/occasion circles; optional **`title`** for “Explore by categories” eyebrow |
| `GourmeatPayButton` | Checkout CTA; **`disabled`** when prerequisites incomplete |
| `CollectionSlotPicker` | HDB collection date/slot selector |
| `AllergenAckCheckbox` | Mandatory tier-1 allergen acknowledgment |
| `ListingWizardStep` | Cook listing wizard step shell |
| `SHCAllergenTierPicker` / `SHCAvailabilityFields` | From `listing-form.tsx` — tri-platform cook listing edit |
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