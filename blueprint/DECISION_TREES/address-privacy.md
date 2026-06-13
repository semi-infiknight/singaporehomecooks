# Decision: Address Privacy & Collection Experience

**Source:** Decisions_Log.txt Section 5

## Rules
- Full address released **only** to verified paying customers (after payment confirmed)
- General area shown during browsing and search
- In-app masked chat eliminates need to exchange personal phone numbers
- Lalamove deep-link offered for orders above S$80 (optional convenience)

**Implementation:**
- `shc_order_meta.address_released_at` controls visibility
- Customer sees full address only when `now >= address_released_at`
- Chat is always order-scoped (`shc_order_message`)