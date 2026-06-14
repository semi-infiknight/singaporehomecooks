# How Singapore Home Cooks Works

**Related Files:** [../blueprint/01-product-scope/01-product-scope.md](../blueprint/01-product-scope/01-product-scope.md), [../blueprint/08-marketplace-rules/08-marketplace-rules.md](../blueprint/08-marketplace-rules/08-marketplace-rules.md), [../blueprint/09-order-state/09-order-state.md](../blueprint/09-order-state/09-order-state.md), [../blueprint/10-mobile/10-mobile.md](../blueprint/10-mobile/10-mobile.md), [content/trust-and-safety.md](./trust-and-safety.md), [content/paynow-flow.md](./paynow-flow.md)

**Last Updated:** 2026-06-14 by Content + Seed Track Agent (Task 0.4)

**Tagline:** Heritage in every dish. Planned occasions only. Real home kitchens in Singapore HDBs and landed homes.

## For Customers — From Occasion to Table

1. **Discover by Occasion (Heritage-First)**
   - Home screen: Live counters (127 cooks • 4,892 meals this month • 28 areas), occasion banners (Birthday, Hari Raya Puasa, Deepavali, Chinese New Year, Family Gathering, Housewarming, Full Moon, Wedding Tea Ceremony).
   - Browse featured heritage cooks or search dishes with SG synonyms (e.g. "nasi lemak" → Nyonya prawn sambal variants, "chap chye", "buah keluak").
   - Filters: cuisine (Peranakan, Eurasian, Hainanese, Malay, Indian, Chinese), halal, calorie range, occasion tags, verified cook since year.
   - Rich heritage notes on every card: "3rd gen Katong recipe since 1972".

2. **Choose Cook & Dish**
   - Tap cook profile: Full story, HDB collection area (e.g. Tampines Blk 456), "Cook Since" badge, video intro (30s dish demo or 60s kitchen tour — AI quality scored), listings with calories (full or category confidence), min qty, ingredients (Tier 1 mandatory disclosure).
   - Tap dish: Detailed description (AI-generated from ingredients + cook's family notes), allergen list with mandatory checkbox, heritage provenance, earnings preview for the cook (your S$60 → cook receives S$51 after 15%).
   - Tasting portions (S$3–5) available for new cooks — order small first for reviews (trust layer 2).

3. **Build Cart & Acknowledge Safety**
   - One cook only (enforced — no mixed kitchen logistics).
   - Select collection date/slot (calendar respects cook availability + portions_per_day limits).
   - **Mandatory:** Check allergen acknowledgment. "I acknowledge the allergens... and confirm no one in my party has undisclosed allergies." (Blocks checkout otherwise. Per 08-marketplace-rules + business-rules/allergen-ack).
   - Real-time total + cook earnings calc shown.

4. **Checkout & PayNow (Manual Trust)**
   - Review order summary, collection slot, cook address note (privacy gated).
   - Pay via PayNow: transfer to platform UEN using order reference.
   - Enter reference in app → "Payment captured".
   - See full details in [paynow-flow.md](./paynow-flow.md).
   - Order enters `paid` state. Chat with cook opens immediately.

5. **Collection Day — 2 Hours Before**
   - Exact HDB address + instructions (e.g. "Lift landing #04-56, call 9123 4567 on arrival, remove shoes, 10 min grace") released automatically at `address_released_at`.
   - Arrive in slot (18:00-19:00). Cook hands over in reusable containers (or customer brings own).
   - Confirm collection in app (PIN or photo + signature future).
   - Leave review + rating (only after collected).

6. **Aftercare & Guarantees**
   - Re-order reminders, occasion memory (e.g. "Last Deepavali's Nasi Lemak was a hit — rebook Auntie Rose?").
   - Full receipts + corporate invoices emailed.
   - Occasion Guarantee applies for verified issues (see trust-and-safety).

**Collection Model (Core to Trust):** No delivery. Customer picks up. Protects cook privacy (address hidden until paid + timed), reduces platform liability, matches Singapore home reality (HDB lifts, void decks, carparks). Festive collections often early morning or eve.

## For Cooks — From Home Kitchen to Paid

1. **Onboard with Support (Frictionless SFA/WSQ)**
   - 5-stage guided: profile (story, area, HDB block notes), GoBusiness registration helper (we guide), pending approval (not blocked), platform-paid WSQ Food Hygiene course (SkillsFuture credits), go-live.
   - Upload compliance docs (SFA cert, WSQ). Kitchen verified badge earned.

2. **List Heritage Dishes**
   - Structured ingredients (name, qty, unit) → auto AI description + allergen tiers populated.
   - Add occasion tags, halal flag, price per portion, min_qty (e.g. 5), availability (days + slots + portions/day).
   - Heritage archive: permanent family story + photos attached to dish/cook profile (even if you pause later). Contributes to platform Singapore Home Cooks Heritage Recipe Library.
   - Preview earnings: "Price S$15 → Fee 15% S$2.25 → You receive S$12.75".

3. **Accept & Prepare**
   - New orders arrive in dashboard with full details (post-payment).
   - Accept within SLA → slot locked.
   - Prepare in your home kitchen (HDB rules compliant).
   - Update status: preparing → ready_for_collection.

4. **Handover & Get Paid**
   - Customer collects. Mark ready/collected.
   - Weekly Monday payout batch (all completed orders, net of commission). Bank transfer.
   - Real-time earnings, order history, performance in cook app.

**One-Cook Rule:** You fulfil alone or with approved family help in same kitchen. No subcontract until Phase 3 collectives.

## Key Singapore Realities Built In

- **HDB & Landed:** Most cooks in HDB (Tampines, Jurong, Bedok, Katong, Geylang). Collection notes include lift access, void deck parking, exact block/street/unit. "Please call on arrival — young children napping."
- **Festive Timing (see 15-calendar.md):** 
  - Hari Raya: Orders peak 2 weeks before; many cooks prepare rendang, nasi lemak, ketupat variants 3-7 days ahead.
  - Chinese New Year: Yu Sheng, pineapple tarts, bak kwa inspired home versions. Collection eve or 1st day morning.
  - Deepavali: Murukku, sweets, mutton/veg curries. Veg-heavy options.
  - Last-minute premiums (cook-set) for CNY eve rush.
- **Public Holidays:** Availability auto-paused or special slots; ops override for force majeure.
- **Dietary & Culture:** Halal options prominent for Muslim customers (Hari Raya). Non-halal Peranakan/Eurasian classics noted clearly (pork in some Babi Pongteh variants). No mixing of kitchens.
- **Allergens Ubiquitous in Local Food:** See trust doc. Fresh market ingredients mean variability — always disclosed.

## Platform Promises (See Trust & Safety)

- 5 independent trust layers active on every profile and dish.
- No surprises on collection or payment.
- Live social proof counters.
- Disputes handled fairly with full audit (ops + ledger).

This is not UberEats or cloud kitchen. This is your neighbour's grandmother's recipe, cooked with love in a real Singapore home, for your special day.

**Questions?** In-app chat with cook post-order, or contact support. For cooks: onboarding@sg or in-app.

*Content source for onboarding flows, marketing, and future website. Render via markdown or static copy in mobile (see updates in app/index.tsx, product screens).*
