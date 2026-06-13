# Decision Tree: Dispute & Refund Policy (Final)

**Source:** Decisions_Log.txt Section 2  
**Related Files:** `09-order-state.md`, `ERROR_CODES.md`, `OPERATIONS_RUNBOOK.md`, `multi-agent/production-hardening.md`

## Core Decision
**No cash refunds** on collected food.  
**Platform credit S$10–15** only for verified objective failures.  
Reviews and ratings handle all subjective complaints.

## Qualifying Scenarios (Strict — Photo Required Within 2 Hours)
1. Foreign object in food
2. Food clearly undercooked posing objective food safety risk
3. Completely wrong dish delivered

## Credit Policy Rules
- Credit amount: S$10–15 (platform-funded from commission)
- Cook earnings **never clawed back** unless fraud confirmed
- Credit valid for next order only (not cash)
- Platform decision is **final** — no appeal
- Must be documented in: Cook Agreement, Customer Terms, Onboarding guide, FAQ

## Implementation Requirements
- `shc_dispute` table must capture: type, photo_url, submitted_within_2h (boolean), decision, credit_amount
- Order detail screen must show "Report Issue" only within 2h of collection for the three scenarios
- Credit balance shown in customer profile
- No automatic refund on cancellation after collection

**Production Rule:** All disputes must create an audit log entry. Ops must have a dedicated Admin view for pending credits.