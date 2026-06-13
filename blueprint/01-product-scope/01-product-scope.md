# 01 — Product Scope

**Related Files:** [../INDEX.md](../INDEX.md), [../multi-agent/README.md](../multi-agent/README.md)

Singapore Home Cooks is a planned-occasion, two-sided marketplace: customers order home-cooked dishes for events; cooks onboard, list, fulfil, and get paid.

**Engines:**
- Discovery: Find cook, dish, or occasion package
- Trust: Allergen disclosure, SFA/WSQ verification, safe collection
- Cook OS: Onboard → list → fulfil → see earnings
- Platform control: Payouts, disputes, compliance, financial truth

**Advanced Features & Differentiators (integrated from source requirements — these enhance the core engines without altering locked decisions):**
- **Four Discovery Modes**: Occasion-first browse with rich filters (cuisine, dietary, calorie range, health profile, verified status, occasion type — dietary prefs auto-applied); fuzzy dish name search with Singapore synonym map (no dead ends — routes to recipe request); contextual/natural language meal search (e.g. "Thai food for 2 people, budget S$50, under 500 calories") powered by Claude API layer on structured foundation assembling complete packages; YouTube recipe request & bidding with auto-embed preview, "Cook's Interpretation" framing, recurring support.
- **AI Photo Quality Assessment**: Instant 3 actionable tips at dish video or cook intro upload. "Has video" filter. Core trust layer.
- **Ingredient Disclosure — Three Tiers**: Tier 1 mandatory (structured ingredients with dropdowns/quantities/units → AI auto-generates professional dish description + auto-populated allergen declaration; cook reviews/approves). Optional Tier 2 (technique notes). Optional Tier 3 (full recipe — "Full Recipe Shared" badge + search ranking boost).
- **Smart Personalisation & Safety Engine (Behavioural only)**: No registration questionnaire. Profiles built from orders/searches/filters/reviews. **Highest priority**: mandatory allergy safety alert + confirmation step when profile matches dish allergens. Seven notification use cases: allergy alert, dietary consistency, dish recommendations, re-order reminders, occasion memory (opt-in), calorie awareness nudge, new cook in area. Unmet demand mining from failed searches.
- **AI Calorie & Nutritional Estimation**: Auto-generated from ingredient list (no extra cook effort). Green badge (full 5+ ingredients calc), amber (category estimate). Traffic-light filters (green <400, amber 400-600, red >600) + macronutrient visuals. Search filters + HPB partnership opportunity.
- **Cook Collaboration for Large Orders (Phase 3+)**: Collaboration Board for posting opportunities and partner responses; proactive Cook Collective Listings (e.g. "Complete Hari Raya Spread" from multiple specialists, single price/collection). Phase 1-2: India assistant manual matchmaking + "Large Order Request" flag. Lead Cook bears full accountability (partners as sub-contractors).
- **Flexible & Dynamic Pricing with Transparency**: Cook-controlled festive demand adjustments (platform sends 6-week alerts). Last-minute premiums (cook-set % , transparently shown). Real-time earnings calculator on ALL pricing forms ("Your price: S$120 → Fee (15%): S$18 → You receive: S$102"). Separate occasion/event listing types.
- **Heritage Recipe Archive**: Permanent structured section on every cook profile for documenting complete recipes with family story, photos, history. Published permanently (even if cook inactive). Aggregates into platform Singapore Home Cooks Heritage Recipe Library. Potential NLB/NHB partnership path.
- **Home Credits Loyalty Programme**: Earn credits on every order; redeem against future orders. Tier upgrades, 12-month expiry automation. (Detailed mechanics and award triggers in Phase 9 implementation.)
- **SFA/WSQ Frictionless Onboarding**: Mandatory for legal protection. 5-stage guided journey: warm welcome + profile build; GoBusiness step-by-step guide; pending (not blocked); platform-paid WSQ course with SkillsFuture credits; go-live celebration. Positioning: "We walk you through your official registration — 20 minutes. We pay for your food safety certification. You just cook."
- **Customer Trust Architecture — Five Layers**: (1) Video content (30s dish / 60s cook intro) with AI photo assessment; (2) Subsidised tasting portions (S$3–5) for new cooks generating real reviews; (3) Clear receipts + auto corporate tax invoices; (4) Tiered Occasion Guarantee (orders >S$150: proportional refund up to 50% capped S$100 for verified objective failures); (5) Cancellation policy (72h+ full refund; 24–72h 50%; <24h none) + first-order collection guide + live homepage social proof counters (real-time cooks/meals/areas).
- **Sophisticated Double-Entry Accounting Engine**: Native platform ledger (transaction posting, chart of accounts, reconciliation, financial reports). Three-tier dashboard. Weekly structured export to Xero (Xero kept strictly separate for statutory accounts — no live API). (See 05-data-model for shc_ledger_entry, shc_payout_batch, etc.)

(Full original scope preserved and integrated into phases, data model, API surface, and production rules. No backtracking on locked decisions.)