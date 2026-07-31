# 07 — Auth and Authorization

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [production/compliance-pdpa.md](../production/compliance-pdpa.md)

**Last Updated:** 2026-07-31 — Production sign-up: strict password policy, `@shc.local` blocked on register in prod, web cook **Create account**, demo creds staging/docs only (never in client bundles).
**Owner:** Backend Track

## Overview

Authentication and authorization are built on Medusa's native `auth_identity` system with custom actor extensions for `customer`, `cook`, and internal `ops` roles. The system supports both traditional email/password and Singapore-specific flows (mobile OTP via SMS, PayNow-linked verification). All authorization decisions are enforced at the API layer with fine-grained actor checks.

## Actor Types & Permissions Matrix

| Actor Type   | Primary Identifier     | Key Capabilities                                      | Restrictions                                      | Auth Method          |
|--------------|------------------------|-------------------------------------------------------|---------------------------------------------------|----------------------|
| Customer     | `auth_identity_id`     | Browse listings, place orders, manage profile, chat   | Cannot access cook-only routes or admin           | Email + OTP / Magic link |
| Cook         | `shc_cook` (login_email + password_hash) + SHC JWT | Manage listings, accept orders, upload compliance, view earnings | Cannot access other cooks' data or customer admin | SHC JWT (scrypt hash on shc_cook; dev plaintext fallback env-gated) + compliance |
| Ops / Admin  | Medusa `user` + custom role | Full access to Admin, dispute resolution, payouts     | Subject to audit logging                          | Medusa Admin + 2FA   |

## Authentication Flows

### Customer & Cook Onboarding (Mobile)

**Cook (implemented 2026-07-08):**
1. Auth screen toggle: **Sign in** or **Create account** (`apps/mobile-cook/app/(shared)/auth`).
2. Register → `POST /store/shc/auth/cook/register` (email, password, display_name, area, optional story) → creates `shc_cook` with scrypt `password_hash`, returns SHC JWT.
3. New accounts route to **4-step onboarding** (`/(shared)/onboarding`): welcome → heritage story → collection instructions → PDPA consent.
4. Finish → `PATCH /store/shc/auth/cook/profile` (story, collection_instructions, pdpa_consent) → cook dashboard.
5. Returning logins skip onboarding if `hasSeenCookOnboarding()` in SecureStore.

**Customer (target / partial):**
1. User enters mobile number or email.
2. OTP sent via Twilio / Singapore SMS provider (or magic link for email).
3. On verification, `auth_identity` is created or linked.
4. Push notification token registered on successful login.

### Session & Token Management
- Medusa issues JWT or session tokens.
- Mobile app stores token securely (Expo SecureStore).
- Token refresh handled via dedicated `/auth/refresh` endpoint.
- All `/store/shc/*` and `/admin/shc/*` routes validate the actor type before processing.

### Cook Verification Layer + Current Login
Cooks must complete:
- SFA + WSQ certs (shc_compliance_doc)

**Current cook auth impl (2026-07-08):**
- POST /store/shc/auth/cook/register → creates cook + issues JWT (rate-limited; duplicate email → 409).
- PATCH /store/shc/auth/cook/profile → cook JWT; onboarding fields (story, collection_instructions, pdpa_consent).
- POST /store/shc/auth/cook/login → verifies via `findByLoginEmail` + verifyCookPassword (scrypt) against password_hash (or dev fallback if not disabled).
- Token issued with issueCookToken (HS256 JWT).
- Seed populates login_email + password_hash for demo cooks.
- Controlled by `SHC_COOK_ALLOW_DEV_PLAINTEXT` (default allows for local; set false in prod).
See shc-auth.ts, shc-password.ts, cook model, auth/cook/login/route.ts, seed.ts.

### Web customer auth guards (2026-07-07)

Implemented in `apps/web` (not Medusa middleware — client-side route protection):

| Screen | Guard |
|--------|-------|
| `/checkout` | Redirect to `/login?returnTo=/checkout` if no customer JWT; refresh cart after sign-in |
| `/product/[id]` | Add-to-cart blocked until customer authenticated |

Hooks: `useAuth.ts`, `useOrder.ts`. Errors surfaced via `ShcRequestError.code` from api-client.

### Web cook portal session (2026-07-04)

Cook portal (`/cook-portal/*`) uses a **separate** auth session from customer:

- `useCookAuth.ts` — cook JWT in dedicated storage; **login + register**
- `cook-api-client.ts` — cook-scoped api-client instance
- `CookLoginGate` — wraps cook portal routes; **Create cook account** on web (parity with mobile)

Customer and cook sessions can coexist in the same browser (different localStorage keys).

### Production password policy (2026-07-31)

- `@shc/utils` `validateShcPassword` — strict when `NODE_ENV=production` (8+ chars, letter + number, blocks `customersecret` / `cooksecret`).
- `POST /store/shc/auth/*/register` — `validateAuthRegistration` blocks `@shc.local` in production unless `SHC_ALLOW_DEMO_EMAILS=1`.
- Demo cook plaintext login: **never in production**; optional `SHC_DEV_COOK_CREDENTIALS_JSON` on server for staging only.
- Client apps: demo email/password prefills only in `__DEV__` / `showDevTools` — not shipped in production builds.

### Railway CORS (2026-07-07)

Production web PWA login requires explicit `STORE_CORS` and `AUTH_CORS` on medusa (web domain + localhost dev ports). Do not mix wildcard `*` with explicit origins. `pnpm railway:wire` sets correct values.

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
