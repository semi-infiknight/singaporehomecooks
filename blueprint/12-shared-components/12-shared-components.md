# 12 — Shared Components & UI Library

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [packages/shc-ui](../04-monorepo/04-monorepo.md)

**Last Updated:** 2026-06-13 (Mobile Track owns)
**Owner:** Mobile Track

## Overview

The `shc-ui` package provides a cohesive design system and reusable component library used across the entire Expo mobile application. It ensures visual and behavioral consistency between customer and cook experiences while accelerating development for both tracks.

## Component Categories

### Core Primitives (gluestack-ui + custom)
- `SHCButton`, `SHCInput`, `SHCCard`, `SHCBadge`, `SHCModal`, `SHCTabs`
- Theme tokens: colors (Singapore-inspired palette), typography, spacing, radii, shadows

### Domain Components
- `CookCard` — listing preview with rating, cuisine tags, availability indicator
- `OrderCard` — status-aware card with collection details and action buttons
- `AllergenBadge` / `AllergenList` — visual + textual allergen display with acknowledgment flow
- `PayNowPanel` — QR code generator, reference input, payment confirmation UI
- `CollectionSlotPicker` — calendar + time slot selector with real-time availability
- `OrderChat` — real-time messaging component with push integration
- `ListingWizard` — multi-step form for cooks to create/edit products
- `PerformanceDashboard` — cook earnings, ratings, completion rate visuals

### Form & Validation Components
- Integrated with Zod schemas from `shc-types`
- Real-time validation + error messaging
- Accessibility-first (labels, hints, keyboard navigation)

## Usage Patterns

```tsx
import { SHCButton, OrderCard, useOrderChat } from '@shc/ui';

<OrderCard 
  order={order} 
  onAccept={handleAccept} 
  onChatPress={openChat}
/>
```

All components accept `testID` props for Maestro E2E tests.

## Design System Governance

- Tokens live in a single `theme.ts` file.
- Component variants are documented in Storybook (or in-app dev menu).
- Any new component or token change requires Mobile Track review and update to this document.

## Production Notes

- Components are optimized for performance (memo, virtualization where needed).
- Dark mode support via Expo.
- All interactive components include loading, error, and empty states.
- Analytics events are emitted on key interactions (configurable via feature flags).

## Multi-Agent Notes

- **Mobile Track** owns `shc-ui` package and all component implementations.
- Contracts Track owns the data shapes passed to components.
- Content Track provides copy strings and illustration assets.
- After Phase 0, component APIs are stable; breaking changes require joint review.

**Mobile Track Rule:** All shared UI must live in `packages/shc-ui`. Inline styles or duplicated components inside `apps/mobile` are not permitted.
