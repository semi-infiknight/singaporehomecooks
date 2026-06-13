# 07 — Auth and Authorization

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [production/compliance-pdpa.md](../production/compliance-pdpa.md)

**Last Updated:** 2026-06-13 (Backend Track owns)
**Owner:** Backend Track

## Overview

Authentication and authorization are built on Medusa's native `auth_identity` system with custom actor extensions for `customer`, `cook`, and internal `ops` roles. The system supports both traditional email/password and Singapore-specific flows (mobile OTP via SMS, PayNow-linked verification). All authorization decisions are enforced at the API layer with fine-grained actor checks.

## Actor Types & Permissions Matrix

| Actor Type   | Primary Identifier     | Key Capabilities                                      | Restrictions                                      | Auth Method          |
|--------------|------------------------|-------------------------------------------------------|---------------------------------------------------|----------------------|
| Customer     | `auth_identity_id`     | Browse listings, place orders, manage profile, chat   | Cannot access cook-only routes or admin           | Email + OTP / Magic link |
| Cook         | `shc_cook.auth_identity_id` | Manage listings, accept orders, upload compliance, view earnings | Cannot access other cooks' data or customer admin | Email + OTP + SFA/WSQ verification |
| Ops / Admin  | Medusa `user` + custom role | Full access to Admin, dispute resolution, payouts     | Subject to audit logging                          | Medusa Admin + 2FA   |

## Authentication Flows

### Customer & Cook Onboarding (Mobile)
1. User enters mobile number or email.
2. OTP sent via Twilio / Singapore SMS provider (or magic link for email).
3. On verification, `auth_identity` is created or linked.
4. For cooks: additional step to create `shc_cook` record + upload compliance docs.
5. Push notification token is registered on successful login (`expo_push_token` on `shc_cook`).

### Session & Token Management
- Medusa issues JWT or session tokens.
- Mobile app stores token securely (Expo SecureStore).
- Token refresh handled via dedicated `/auth/refresh` endpoint.
- All `/store/shc/*` and `/admin/shc/*` routes validate the actor type before processing.

### Cook Verification Layer
Cooks must complete:
- SFA (Singapore Food Agency) food handler cert
- WSQ (Workforce Skills Qualifications) food hygiene cert
- These are stored in `shc_compliance_doc` and checked on every sensitive action (order acceptance, payout request).

## Authorization Rules (Enforced in Middleware)

- Every custom route in `06-api-surface.md` declares required actor(s).
- Example: `PATCH /store/shc/orders/{id}/accept` requires actor = `cook` AND `cook_id` matches order's cook.
- Admin routes require `ops` role + audit log entry.
- Cross-actor data access is explicitly denied (e.g., a cook cannot query another cook's `shc_product_meta`).

## Mobile-Specific Auth

- `useAuth` hook in Mobile Track handles login, logout, token storage, and automatic re-auth on 401.
- Biometric unlock (FaceID/TouchID) optional for returning users.
- Session timeout: 30 days with refresh; force re-login after 90 days of inactivity for security.

## Production Hardening Requirements

- All auth endpoints rate-limited (see `production-hardening.md`).
- Failed login attempts trigger account lockout after 5 attempts (15 min cooldown).
- PDPA consent captured at signup and stored with timestamp.
- Audit log for all privilege escalation or role changes.
- Secrets (JWT secret, SMS API keys) managed exclusively via Railway environment variables.
- Token rotation policy: refresh tokens are single-use.

## Multi-Agent Notes

- **Backend Track** owns implementation of custom auth middleware and actor guards.
- **Contracts Track** owns the Zod schemas for auth payloads and the permission matrix.
- **Mobile Track** owns the client-side auth hooks and secure storage logic.
- Any change to actor permissions must be approved by Contracts Track and documented in both `05-data-model.md` and this file.
- After Phase 0, `07-auth.md` is read-only for non-Backend agents.

## See Also

- `06-api-surface.md` for all route-level auth requirements.
- `05-data-model.md` for `auth_identity` linkage to `shc_cook`.
- `multi-agent/production-hardening.md` for security controls and observability around auth.
- `DECISION_TREES/trust-architecture-five-layers.md` for trust and verification flows.
- `production/compliance-pdpa.md` for consent and data handling rules.
