# Phase 2 — Cook Onboarding

**Related Files:**
- [../07-auth/07-auth.md](../07-auth/07-auth.md)
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [../08-marketplace-rules/08-marketplace-rules.md](../08-marketplace-rules/08-marketplace-rules.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Track Assignment:** Mobile + Backend + Content (parallel)

## Tasks (Deterministic)

### 2.1 Cook Registration & Profile (Mobile + Backend)
**Output:** `/cook/onboarding/welcome`, profile, SFA/WSQ steps in mobile app  
**Done when:** Cook can complete 5-stage onboarding; GoBusiness guide rendered; pending status works

### 2.2 SFA/WSQ Frictionless Flow (Backend + Content)
**Output:** Platform-paid WSQ course link, certificate upload, verification queue in /ops/verifications  
**Done when:** Ops can verify SFA certs; cook status transitions to live; email sequence triggered

### 2.3 Cook Mobile Shell & Tabs (Mobile Track)
**Output:** Cook tab bar with onboarding, listings, orders, accounting, academy, profile  
**Done when:** Navigation matches 10-mobile.md; gluestack-ui components consistent

### 2.4 Business Rules for Onboarding (Contracts Track)
**Output:** Validation rules in packages/business-rules for cook profile completeness, allergen handling  
**Done when:** 10+ unit tests pass; integrated into onboarding forms

### 2.5 Trust Content & Copy (Content Track)
**Output:** Updated trust-and-safety.md, how-it-works.md rendered in onboarding  
**Done when:** All legal copy approved and linked

**Stitching Checkpoint 2:** End-to-end cook can register → complete onboarding → reach pending → verified status. Maestro flows for onboarding green.

**Mobile-Agent update 2026-06-14:** 2.1/2.3/2.5 done: basic multi-step onboarding in (shared)/onboarding (role + PDPA consent stub + SG copy), cook tab shell/links, trust copy rendered. SecureStore auth switcher ready. Full cook dashboard + listings/orders linked. (Backend will wire real registration later.)