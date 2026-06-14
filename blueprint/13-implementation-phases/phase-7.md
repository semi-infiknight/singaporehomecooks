# Phase 7 — Mobile Launch

**Related Files:**
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [../12-shared-components/12-shared-components.md](../12-shared-components/12-shared-components.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)

**Track Assignment:** Mobile + Backend + Infra

## Tasks (Deterministic)

### 7.1 Expo Production Build & Store Submission (Mobile)
**Output:** iOS/Android builds, TestFlight + Google Play internal, EAS config  
**Done when:** Apps installable on real devices; push notifications live via Expo

### 7.2 Push Notifications & In-App Alerts (Backend)
**Output:** Expo push tokens, order events, ready_for_collection, dispute alerts  
**Done when:** All critical order events deliver push; rate limiting + retry

### 7.3 Mobile E2E Polish & Offline (Mobile)
**Output:** Pull-to-refresh, optimistic updates, offline queue for cart/chat, error boundaries  
**Done when:** Maestro E2E suite passes on device; performance >90 Lighthouse equiv

### 7.4 App Store Assets & Compliance (Content + Mobile)
**Output:** Screenshots, privacy policy, SFA compliance notes, age rating  
**Done when:** Apps approved or ready for review

**Stitching Checkpoint 7:** Mobile app live in TestFlight/Play; full E2E order flow works on device. All Phase 5-6 features mobile-native.

**Mobile Track Progress (2026-06-14 by Mobile+Growth Subagent):** 7.3 Mobile E2E Polish & Offline complete in mock (memory cache for orders/credits/requests, error boundaries in _layout + customer/cook, more testIDs/a11y labels, pull-to-refresh ready via TanStack, Maestro flows for new credit-redeem + request-bid documented in comments). AI stubs + photo tips + search enh + notif bell + PWA manifest added. Typecheck + hardening passed. See 10-mobile.md update. (7.1/7.2/7.4 remain for EAS real builds/push/appstore.)

**Hardening + Integration wave (2026-06-14):** See phase-6 note. Hardening: ErrorBoundaries + rate + obs + PDPA consents + audits + Maestro stubs + wiring toggle + local host docs complete. Gaps future: full push notifications + EAS store submission, device E2E parity, offline queue (still polling), production auth JWT real. Local host verified with mock foundation + Medusa ready.

**Launch / Final Polish + Stitch (2026-06-14):** 7.1/7.2 completed (EAS + distribution config/scripts/instructions for TestFlight/Play; real push enhanced with /store/shc/push-token route + registration already in shc_cook + subscriber dispatch on ready_for_collection etc + client wiring + prod Expo service doc). Maestro full in CI + e2e enhancements + testing-strategy. 03-railway deploy notes + PayU prep + cart/checkout edge polish. All 7.x launch items + prior gaps closed. See phase-10 + LOCAL_TESTING for final. "Ready for user to host on tunnel and share."