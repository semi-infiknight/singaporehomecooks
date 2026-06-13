# 16 — References & External Resources

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../01-product-scope/01-product-scope.md](../01-product-scope/01-product-scope.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [production/compliance-pdpa.md](../production/compliance-pdpa.md)

**Last Updated:** 2026-06-13 (Content Track owns)
**Owner:** Content Track

## Overview

This section maintains a curated list of authoritative external references, regulatory documents, and technical standards that underpin the Singapore Home Cooks platform. It ensures all agents and human contributors have quick access to the official sources behind compliance, payment, and operational decisions.

## Regulatory & Compliance References

- **Singapore Food Agency (SFA)**  
  - Food Handler Certification requirements  
  - https://www.sfa.gov.sg/ (official guidelines for home-based food businesses)

- **Workforce Skills Qualifications (WSQ)**  
  - Food Hygiene & Safety courses  
  - Mandatory for all cooks handling food commercially

- **Personal Data Protection Act (PDPA)**  
  - Consent, notification, and data retention rules  
  - See `production/compliance-pdpa.md` for platform-specific implementation

- **Goods and Services Tax (GST)**  
  - Registration thresholds and collection rules for marketplace operators  
  - See `GST_TAX_RULES.md`

## Payment & Financial References

- **PayNow (MAS / Singapore)**  
  - Official PayNow QR specification and integration guidelines
  - Reference generation rules and timeout policies

- **Banking & Payout Regulations**  
  - MAS guidelines on e-money and payment service providers

## Technical Standards

- **Medusa Documentation** (v2)  
  - Module development, workflow patterns, Admin customization
  - https://docs.medusajs.com/

- **Expo & React Native**  
  - Current SDK version, Router v3 patterns, SecureStore best practices

- **Zod & TypeScript**  
  - Schema-first contract enforcement across the monorepo

## Internal Cross-References

All regulatory requirements are translated into concrete rules inside:
- `DECISION_TREES/` (trust, dispute, cancellation)
- `production/` folder (observability, testing, compliance)
- `08-marketplace-rules.md` and `09-order-state.md`

## Maintenance Process

Content Track is responsible for:
- Periodic review of links and regulatory changes
- Adding new references when new compliance areas are introduced (e.g., insurance, employment status of cooks)
- Ensuring every external dependency has a corresponding internal rule or decision tree

**Content Track Rule:** Never hard-code regulatory numbers or URLs in code. Always reference this document or the relevant production compliance file.
