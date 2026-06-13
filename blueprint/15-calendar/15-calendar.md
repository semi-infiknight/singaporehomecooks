# 15 — Calendar, Scheduling & Availability

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../08-marketplace-rules/08-marketplace-rules.md](../08-marketplace-rules/08-marketplace-rules.md)
- [../09-order-state/09-order-state.md](../09-order-state/09-order-state.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)

**Last Updated:** 2026-06-13 (Content Track owns)
**Owner:** Content Track

## Overview

The calendar and availability system is central to matching customers with cooks. It governs when products can be discovered, ordered, and collected. All availability logic is driven by `shc_availability` records linked to products and cooks.

## Key Concepts

- **Collection Days**: Array of weekday integers (0=Sunday … 6=Saturday) when the cook offers collection.
- **Time Slots**: JSON structure defining start/end times and max portions per slot.
- **Portions Per Day**: Hard limit on total orders a cook can accept for a given day.
- **Paused State**: Cook or product can be globally or per-product paused without deleting availability data.

## Availability Lifecycle

1. Cook sets initial availability during onboarding (via ListingWizard).
2. System validates against existing orders before allowing reductions.
3. Real-time checks at cart addition and checkout ensure slots remain available.
4. Cron jobs clean up past slots and generate future availability suggestions.

## Display & Discovery Rules

- Products appear in search only for dates where availability exists and `portions_per_day` > current booked count.
- Last-minute orders (within 4 hours) may carry a premium percentage (see `shc_product_meta.last_minute_premium_pct`).
- Calendar views in mobile show cook availability heatmaps and individual slot selection.

## Production Considerations

- Availability checks must be fast and consistent (Redis cache layer recommended).
- Edge cases (public holidays, cook illness, force majeure) are handled via ops override tools.
- Historical availability is retained for analytics and performance scoring.

## Multi-Agent Notes

- Content Track maintains the conceptual model and any customer-facing copy around scheduling.
- Backend Track implements the availability queries and mutation logic.
- Mobile Track builds the calendar UI components.
- Any change to the availability data model requires Contracts Track approval.

**Content Track Rule:** Scheduling UX and copy must align with Singapore cultural expectations around meal times and collection convenience.
