# Decision: Commission Structure & Real-Time Earnings Display

**Source:** Decisions_Log.txt Section 7

## Rules
- Tiered commission by order value
- Minimum S$2.00 floor
- Lower of (order value tier OR recognition tier) always applies in cook's favour
- **Real-time net earnings display** is a foundational feature on all pricing and dashboard screens

**Production Requirement:**
- `PriceNetPreview` component must always show live net amount using current commission rule
- Live preview must be available during dish creation and editing