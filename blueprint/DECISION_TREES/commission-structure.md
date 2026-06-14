# Decision: Commission Structure & Real-Time Earnings Display

**Source:** Decisions_Log.txt Section 7

## Rules
- Tiered commission by order value
- Minimum S$2.00 floor
- Lower of (order value tier OR recognition tier) always applies in cook's favour
- **Real-time net earnings display** is a foundational feature on all pricing and dashboard screens

**Phase 6 (2026-06-14 by Backend-Money-Agent):** Commission 15% static (business-rules) powers ledger entries + payout batch totals in Medusa impl. Used on completed + payment-confirm + sim. Earnings queryable by mobile via /store/shc/orders. Matches blueprint; versioned rule + tiered future.

**Production Requirement:**
- `PriceNetPreview` component must always show live net amount using current commission rule
- Live preview must be available during dish creation and editing