# PayNow Flow — Operations Manual

**Related Files:** [../blueprint/00-locked-decisions/00-locked-decisions.md](../blueprint/00-locked-decisions/00-locked-decisions.md), [../blueprint/09-order-state/09-order-state.md](../blueprint/09-order-state/09-order-state.md), [../blueprint/08-marketplace-rules/08-marketplace-rules.md](../blueprint/08-marketplace-rules/08-marketplace-rules.md), [../blueprint/ERROR_CODES.md](../blueprint/ERROR_CODES.md), [../blueprint/06-api-surface/06-api-surface.md](../blueprint/06-api-surface/06-api-surface.md)

**Last Updated:** 2026-06-14 by Content + Seed Track Agent (Task 0.2)

**Purpose:** Exact step-by-step for manual PayNow payment confirmation. This is the only payment method in MVP. No auto webhooks; ops human verification protects against fraud while keeping onboarding friction low for home cooks. "Heritage in every dish" starts with trustworthy transactions.

## Customer Side (Mobile Experience)

1. Customer completes cart (one-cook enforced, min qty met, mandatory allergen acknowledgment checked).
2. At Checkout screen:
   - Displays platform PayNow details: UEN (founder corporate, e.g. 202612345A — see 14-founder-inputs), exact order total in SGD, recommended reference = Order ID (e.g. `SHC-2026-00001`).
   - Mock or real QR code (generated client-side or via shc-utils for PayNow format).
   - Instruction: "Transfer exact amount via PayNow (UEN or mobile) to 'Singapore Home Cooks'. Include order reference in comments."
3. Customer performs bank/app transfer (DBS/POSB, OCBC, UOB, etc. — all support PayNow by UEN).
4. Customer returns to app, enters the PayNow transaction reference / last 6-8 digits or full ref they used.
5. Taps "I have paid via PayNow — Confirm". This:
   - Records `paynow_reference` in `shc_order_meta`.
   - Sets `shc_status` = `paid`.
   - Triggers notification to cook (via push + internal).
   - Shows success: "Payment reference captured. Address will be released 2h before collection (see collection policy). Chat now open."
6. No funds movement yet — this is "intent captured". Platform holds trust.

**Singapore Notes:** PayNow is instant, free for personal-to-personal/UEN, works 24/7. Use exact amount to avoid mismatch. Reference should be unique (order ID prefixed). Customers get SMS/bank confirmation instantly. Address privacy protected until confirmed.

## Ops Side — Exact Manual Confirmation Steps (Medusa Admin + PayNow Portal/Bank)

**Trigger:** Order appears in Admin under "Pending Payment Confirmation" (filtered by `shc_status = 'paid'`, no prior confirm).

**Prerequisites (ops user logged into Admin with ops role):**
- Access to corporate PayNow / banking portal (DBS IDEAL or equivalent for UEN account).
- View of recent incoming PayNow transactions by UEN.
- Admin widget/extension at `/admin/shc/payments` or order detail "Confirm PayNow" action (Backend to implement per phase).

**Step-by-Step Ops Process (do not skip, log every action):**

1. **Locate Order in Admin**
   - Go to Orders or custom SHC Payments list.
   - Filter: status=paid, created in last 48h, paynow_reference present.
   - Open order detail. Note: customer name, cook, total, collection_date/slot, paynow_reference entered by customer, order ID.

2. **Verify Amount Match**
   - Check bank/PayNow portal for incoming credit to platform UEN matching **exact total** (incl any GST if applicable per GST_TAX_RULES).
   - Time window: transactions usually post within seconds. If not visible after 30min, flag for follow-up (customer may have delayed transfer).
   - Record match: screenshot (anonymized per PDPA) or transaction ID from bank.

3. **Verify Reference Uniqueness & Correctness**
   - Confirm customer-entered `paynow_reference` appears in the bank memo/comments or matches the order ID they were instructed to use.
   - Search platform DB: reject if duplicate reference used on another order (error `SHC-PAY-001` — see ERROR_CODES.md). Log attempt.
   - If ref mismatch but amount correct: contact customer via order chat (ops can message) for clarification before confirming. Do not auto-accept.

4. **Check for Red Flags (Fraud / Compliance)**
   - Amount short/over by >S$1? Do not confirm; initiate dispute or request top-up.
   - Customer or cook on watchlist/suspended? Escalate to founder/ops lead.
   - First order from new customer? Light manual review of profile.
   - Collection date too soon (<4h)? Note for address release timing (auto 2h before per data model).
   - Halal/allergen notes visible — no action but record.

5. **Confirm in Admin UI**
   - Click "Confirm PayNow Receipt" action (custom shc-paynow workflow).
   - This:
     - Sets internal payment confirmed flag / ledger prelim entry.
     - Transitions order `paid` → eligible for `accepted` (cook notified to accept).
     - Records `payment_confirmed_at` (audit).
     - Schedules address release: `address_released_at = collection_datetime - 2 hours`.
     - Emits events for cook push, customer update, platform stats.
     - Generates receipt (clear + auto corporate tax invoice per trust layer 3).
   - Ops notes required: "Verified exact match on [bank tx id]. Ref OK. Amount S$XX.XX."

6. **Post-Confirmation Actions**
   - If confirmed successfully: order moves to cook dashboard as "New Order — Accept within SLA (e.g. 2h)".
   - Send automated SMS/email to customer: "Payment confirmed. Full collection address + instructions released 2h before your slot on [date]. Chat with cook open now."
   - Update platform counters (meals booked).
   - If reject: mark cancelled with reason, auto full refund instruction (ops triggers manual bank reversal or note for weekly payout batch adjust). Log `SHC-PAY-00X`.

7. **Audit & Archival**
   - All steps logged to `shc_order_message` (sender_actor=ops) + platform audit trail (PDPA compliant retention).
   - Weekly reconciliation: cross-check PayNow statements vs confirmed orders before payout batch.
   - Disputes: see `DECISION_TREES/dispute-refund-policy.md` — any post-confirm mismatch escalates here.

**SLA for Ops:** Confirm within 30-60 minutes during 8am-10pm daily (Singapore time). Overnight or weekends: next business morning. Use on-call rotation for Hari Raya/Deepavali/CNY peaks (per 15-calendar.md festive surge).

**Edge Cases Handled:**
- Duplicate ref: auto flag + ops reject (customer must re-submit unique).
- Customer error (wrong UEN): cancel + instruct re-transfer.
- Cook cancels pre-confirm: full refund path (see cook-cancellation tree).
- Partial payment: never confirm; customer must send remainder or cancel.
- Large festive orders (>S$300): extra manual phone verification call from ops.

**Founder Note (from 14-founder-inputs):** PayNow chosen for zero merchant fees on MVP, broad SG adoption, no KYC friction for cooks. Ops manual builds initial trust layer. Future: PayNow corporate API or Stripe SG when volume justifies (Phase 6+).

**Verification Command (for devs/ops testing):** After local seed, use Admin to simulate: create paid order via mobile mock, enter ref, manually "confirm" via backend route. Assert status transition + address_release computed.

This flow ensures every payment is human-verified, building the foundation for the five-layer trust architecture.
