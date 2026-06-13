# Decision: Cook Performance Governance — Training First

**Source:** Decisions_Log.txt Section 12

## Core Principle
Support and training first — not punishment.

## Three-Strike Cancellation Framework
- Strike 1 & 2 → Automated training invitation triggered by system
- Strike 3 → Hard restriction (temporary suspension or review)

## Reliable Cook Badge
- Rewards consistent excellence
- Visible to customers
- Earned through low cancellation rate + high ratings over time

**Implementation Notes:**
- Cancellation tracking in `shc_order_meta`
- Automated triggers via worker cron
- Training content delivered via email / in-app