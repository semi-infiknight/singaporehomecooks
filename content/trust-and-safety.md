# Trust & Safety at Singapore Home Cooks

**Related Files:** [../blueprint/01-product-scope/01-product-scope.md](../blueprint/01-product-scope/01-product-scope.md), [../blueprint/DECISION_TREES/trust-architecture-five-layers.md](../blueprint/DECISION_TREES/trust-architecture-five-layers.md), [../blueprint/08-marketplace-rules/08-marketplace-rules.md](../blueprint/08-marketplace-rules/08-marketplace-rules.md), [content/how-it-works.md](./how-it-works.md), [content/paynow-flow.md](./paynow-flow.md), [../blueprint/14-founder-inputs/14-founder-inputs.md](../blueprint/14-founder-inputs/14-founder-inputs.md), [../blueprint/production/compliance-pdpa.md](../blueprint/production/compliance-pdpa.md)

**Last Updated:** 2026-06-14 by Content + Seed Track Agent (Task 0.4)

**Core Philosophy:** "Heritage in every dish" requires absolute trust. Buying food from a stranger's HDB kitchen is intimate. Five independent layers + mandatory safeguards + transparent policies remove the psychological barrier. Trust is not a badge — it is engineered into every step.

## The Five-Layer Customer Trust Architecture

(Defined in 01-product-scope.md and aligned with DECISION_TREES/trust-architecture-five-layers.md badges. Each layer stands alone; together they create reassurance.)

1. **Video Content (Primary Visual Proof)**
   - Every cook uploads 30-second dish demo video + 60-second kitchen intro (showing clean workspace, ingredients, family context).
   - AI photo/video quality assessment on upload: instant 3 actionable tips (e.g. "Better lighting on the wok", "Show hands washing").
   - "Has video" filter + badge. Core of discovery. Cooks without recent video drop in ranking.
   - Matches decision-tree layer: "Video content — Cook shows kitchen and cooking process".

2. **Subsidised Tasting Portions (Real Reviews from Real Orders)**
   - New cooks (or low-review) offer S$3–5 tasting sizes for 1-2 portions.
   - Generates authentic reviews before full commitment.
   - "Tasting available" badge. Builds social proof organically.
   - Decision-tree alignment: "Tasting portions — Option for customers to order small tasting portions first".

3. **Clear Receipts + Auto Corporate Tax Invoices**
   - Every order produces itemized receipt (dish, qty, price, platform fee breakdown, GST note).
   - Corporate invoice generated automatically for business customers / tax records (founder legal entity).
   - Transparency on exactly what cook receives (15% commission shown live).
   - Decision-tree: Supports "New Cook Guarantee" and overall professionalism.

4. **Tiered Occasion Guarantee (Platform-Backed)**
   - For verified objective failures (food not as described, major quality/safety issue, non-delivery of collection slot):
     - Orders ≤ S$150: case-by-case goodwill (full or partial refund at platform discretion).
     - Orders > S$150: proportional refund up to 50% of order value, capped at S$100.
   - Requires photo evidence + within 4h of collection. Ops reviews with full audit trail.
   - Excludes taste preference ("too spicy") or customer lateness.
   - Complements decision-tree "New Cook Guarantee" + "Kitchen Verified badge".

5. **Cancellation Policy + Cook Since Transparency + Collection Guide**
   - **Customer Cancellation:**
     - 72h+ before collection slot: full refund (minus any processing, usually none).
     - 24–72h: 50% refund.
     - <24h: no refund (food already prepped).
   - **Cook Cancellation (after acceptance):** Automatic full refund to customer + platform penalty to cook (from commission buffer or future payouts) + negative performance score. See cook-cancellation-after-payment decision tree.
   - **Cook Since date:** Prominent badge on profiles ("Cooking heritage since 1972"). Transparency on longevity.
   - **Kitchen Verified:** Visual badge earned via SFA/WSQ + ops/home visit light process (future).
   - First-order collection guide sent on every new customer order: "What to expect at HDB collection", "Bring containers or request ours", "Call 15 min ahead", etiquette.
   - Live homepage counters: real-time proof of platform activity ("4,892 meals served this month").

**Additional Trust Layer from Decision Tree:** All badges (video, tasting, verified, cook-since, guarantee) appear on cook profile and dish detail.

## Allergen Disclosure & Safety (Non-Negotiable)

**Mandatory on Every Product:**
- Structured allergen_tiers in shc_product_meta (tier1 required).
- Displayed prominently: "Allergens: Shellfish, Nuts, Eggs — mandatory disclosure".
- **Customer must explicitly check acknowledgment box** before cart/checkout. `allergen_acked_at` timestamp recorded on order. No ack = order blocked.
- Common Singapore local dish allergens (realistic, not exhaustive):
  - **Shellfish/Crustaceans:** Prawns (Nasi Lemak Sambal Prawn), Ikan Bilis (anchovies), Belacan (shrimp paste in sambal/Peranakan dishes), crab, clams.
  - **Nuts/Tree nuts & Peanuts:** Peanuts (classic Nasi Lemak garnish), candlenuts (buah keluak preparation), almonds in festive cookies/kueh.
  - **Eggs:** Hard-boiled or fried in many Peranakan/Hainanese dishes.
  - **Soy, Wheat/Gluten:** Fermented beans (Babi Pongteh, Chap Chye sauces), some rempahs.
  - **Pork:** In many traditional Peranakan (Babi Pongteh) and Eurasian (Devil's Curry sometimes has ham/pork elements) — clearly marked non-halal.
  - **Coconut:** Almost ubiquitous (Nasi Lemak rice, curries, kueh) — note for nut-allergy cross or dietary.
  - **Others:** Dairy rare, fish sauce, chilli (nightshades).
- Variability note: "Recipes use fresh market ingredients. Cross-contamination possible in home kitchen (no commercial separation)."
- Profile-based alerts (future): If past orders indicate allergy, prominent warning + re-ack required.
- Halal flag separate from allergens: halal dishes avoid pork/alcohol; many Peranakan classics are not halal but can have halal adaptations.

**SFA/WSQ:** All active cooks hold current food handler cert + hygiene training. Kitchen standards part of trust.

## Collection Policy (Privacy + Practicality)

- **Address Release:** Full collection_address + collection_instructions (e.g. "Blk 123 Tampines Street 71, #04-56. Lift landing. Call Auntie Rose 9654 3210 on arrival. Shoes off please. Park at void deck.") released **exactly 2 hours before** the collection slot via `address_released_at`.
- Pre-release: Customer sees only area (Tampines) + rough timing.
- Customer acknowledges address/instructions at checkout (part of safety).
- No delivery: Customer or family/friend collects. Matches home-cook capacity and Singapore culture (many collect on way home from work/MRT).
- Late policy: Cook waits 15-20 min grace; after that may mark no-show (dispute possible).
- Containers: Platform encourages reusable; cooks may charge small for disposables or request customer bring tiffin carriers (traditional).

**HDB Specifics:** Most collections are HDB. Notes include: "4th floor, no lift lobby seating, young kids at home — quiet please", "Carpark C, Block 890, call for gate access".

## Cancellation, Refund & Guarantee Details (Full)

- See windows above.
- **Post-Collection:** 48h window to raise dispute (food safety issue, major misrepresentation). Ops + ledger review.
- **Full Refund Triggers (pre-collection):** Customer 72h+, cook fault, platform error, force majeure (flood, MRT breakdown affecting collection).
- **Partial/Discretionary:** Per guarantee tier + dispute tree.
- Refunds processed via same PayNow (reverse) or credit to Home Credits wallet (future loyalty).
- All financial truth in double-entry ledger (shc_ledger_entry).

## Other Safeguards

- **One Cook Per Order:** Prevents cross-contamination, simplifies tracking, fair earnings.
- **Reviews Only Post-Collection:** No fake reviews. One per order.
- **Performance Governance:** Cooks with repeated complaints or low ratings paused/suspended. See cook-performance-governance decision tree.
- **PDPA & Data:** Addresses released only when needed, retained per DATA_RETENTION_MATRIX. No selling data.
- **Insurance:** Platform liability coverage (see INSURANCE_LIABILITY.md). Cooks encouraged to have home contents.
- **Live Proof:** Homepage social counters (cooks active, meals served, areas) update in real time from platform stats.

## For Cooks — Your Safety & Fairness

- Customers must ack allergens and address before you see the order as paid.
- You control your calendar strictly (portions_per_day hard limits).
- Weekly payouts guaranteed for completed orders.
- Platform backs you on legitimate cancellations and provides support for disputes.
- Heritage archive protects your family's IP in a permanent, credited way.

**Report Issues:** In-app "Report Order" (dispute), support chat, or email. All escalated to ops with full context + ledger.

This document is the customer-facing expression of our locked decisions and decision trees. It is rendered in onboarding, product screens, cook profiles, and footer links. Update only via Content Track + founder review.

*Last reviewed against founder priorities: Trust & Safety First, Singapore Regulatory Alignment (SFA/PDPA).*
