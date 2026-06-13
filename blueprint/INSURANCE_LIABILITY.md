# Insurance & Liability Framework

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [DECISION_TREES/trust-architecture-five-layers.md](../DECISION_TREES/trust-architecture-five-layers.md)
- [DECISION_TREES/dispute-refund-policy.md](../DECISION_TREES/dispute-refund-policy.md)
- [production/compliance-pdpa.md](../production/compliance-pdpa.md)
- [16-references/16-references.md](../16-references/16-references.md)

**Last Updated:** 2026-06-13 (Contracts Track owns)
**Owner:** Contracts Track

## Liability Posture (MVP)

- Platform acts as marketplace facilitator, not food preparer or deliverer.
- Primary liability for food safety and quality rests with the individual cook (SFA/WSQ certified).
- Platform provides:
  - Trust & verification layer (compliance docs, reviews, performance scoring)
  - Dispute mediation service
  - Refund facilitation (subject to policy)

## Insurance Considerations

- Public liability / product liability insurance for the platform entity.
- Consideration of cook-side insurance products (future phase).
- Customer protection via clear terms of service and collection instructions.

## Implementation Hooks

- `shc_dispute` and resolution workflow include liability assessment fields.
- Terms acceptance captured at signup and order placement.
- Incident logging for insurance claims.

## Multi-Agent Notes

Contracts Track maintains the liability model and dispute rules. Any change to liability allocation requires founder approval and update to this document.

**Rule:** The platform never assumes direct food safety liability. All customer agreements clearly state cook responsibility.
