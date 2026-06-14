# PDPA & Singapore Compliance

**Related Files:**
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)

- Explicit consent flows in cook onboarding and customer checkout
- Data retention: orders 7 years, customer/cook personal data 3 years or on request
- Audit logging for all access/modification of personal data
- Right to data portability and deletion endpoints (Phase 6+)
- All MinIO uploads for certs/receipts use signed URLs + encryption at rest where possible

These requirements are non-negotiable and must be implemented alongside every feature that touches personal data.

**Hardening wave impl note (2026-06-14):** Explicit checkboxes implemented: cook role in (shared)/onboarding (required for finish + stores pdpa_consent_* on user), customer at checkout (separate from allergen, required + stores on order + timestamp). Audit logs everywhere for personal data ops. Seeds + mock orders updated with fields. Retention per matrix. See LOCAL_TESTING verification + mobile code + medusa audit. Future: real endpoints for portability/deletion (phase6+).