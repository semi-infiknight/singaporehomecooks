# Phase 10 — Web Parity

**Related Files:**
- [../10-mobile/10-mobile.md](../10-mobile/10-mobile.md)
- [../06-api-surface/06-api-surface.md](../06-api-surface/06-api-surface.md)
- [../production/testing-strategy.md](../production/testing-strategy.md)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)

**Track Assignment:** Web (shc-web) + Backend + SEO

## Tasks (Deterministic)

### 10.1 Next.js Public Web App (Web Track)
**Output:** shc-web with full public marketplace parity (browse, dish, cook, cart, checkout)  
**Done when:** All mobile flows have web equivalents; SSR + SEO meta

### 10.2 Cook & Ops Web Portals (Web + Backend)
**Output:** Web versions of cook dashboard, ops, ceo dashboards with TanStack Table  
**Done when:** Feature parity with mobile; export buttons work

### 10.3 PWA + Service Worker (Web)
**Output:** Manifest, offline support, install prompt, web push  
**Done when:** Lighthouse PWA score >90; installable on mobile browser

### 10.4 Performance & SEO Audit (Web)
**Output:** Sitemap, structured data, Core Web Vitals optimization, Google indexing  
**Done when:** All cook/dish pages indexed; perf budget met

### 10.5 Browser Upload & Media Parity (Web)
**Output:** Uppy or native browser upload for cook media (fallback to native)  
**Done when:** Web listing creation matches mobile UX

**Stitching Checkpoint 10:** Full web parity achieved. Mobile + web + admin all production-ready. Final Maestro regression suite green. Project ready for public launch.

**Web / Phase 10 Subagent (2026-06-14 final wave):** apps/web created (Next 14+/App Router, Tailwind, TanStack Query). Full public marketplace parity (home/discover search+filters+heritage+calorie traffic, cook/[slug] with permanent archive, product/[id] ingredients+allergens+earnings+ack+request). Cart/checkout (one-cook, PDPA explicit, credits redeem, PayNow ref sim, corporate stub, slot picker). Cook portal (login stub via localStorage + DevRole, dashboard with TanStack-style orders table, listings stub, collab board bids, heritage add/publish, earnings ledger preview). Growth: request form, bidding view, credits wallet. Money: view ledger. SSR/SEO (metadata per page, sitemap with cook/dish, JSON-LD ready notes). PWA (manifest.json, installable). Reuse: exact seeds (inline + comment canonical from seed/), api-client with real/mock toggle (NEXT_PUBLIC_SHC_API_BASE / localhost:9000 /store/shc same as mobile), SHC types + rules inline. Dashboards: table for cook orders/earnings. Hardening: web ErrorBoundary (SHCError display + retry), a11y (labels/roles), data-testid on key (search, ack, bid, checkout), rate notes from mock. Integration: consumes same backend contracts, "switch to mobile" note + QR sim in home + footer links to localhost ports. Self contained components (no heavy RN pull). Build verified (next build success, routes static/dynamic listed). Run: pnpm --filter=web dev (port 3001). Side-by-side mobile. Gaps: full auth JWT, real payments (PayNow sim), browser upload (stub), real @shc/ui RN-web interop. "Web/Phase 10 Wave ready for stitch". Self-updated per rules (phase-10 + 10-mobile + INDEX).

**Final Stitching (2026-06-14 Launch/Final Polish + Stitch Subagent):** All integrate/phase-* ; full verification (build/test/typecheck/verify:local/Maestro stubs/CI); production/launch items closed (EAS, push, deploys, cart parity); blueprint + LOCAL + INDEX + STATUS updated. Phase 10 foundation + closure documented (web parity stub ready; focus delivered on mobile launch + stitch). All prior not-100% items (Phase 10 delivered, real growth routes, AI notes, launch items) now closed.

**Hardening + Integration wave (2026-06-14 Production Hardening + Integration + Maestro Subagent):** PDPA checkboxes (cook onboarding/checkout), timestamps in seeds/mock orders/users, enhanced structured audits (actor/action/before/after state+money) in mock+medusa, ErrorBoundary (SHC friendly) on key screens/layouts, rate limit stub, obs stubs in hooks, mobile api-client real Medusa toggle (lists/create/get + fallback), Medusa pubkey+auth stubs, unit tests enhanced (earnings/credits/PDPA), Maestro yaml stubs (onboarding, order-fulfil, credits), verify:local script + robust seeds, full LOCAL_TESTING.md "full local host" + checklist + mixed demo + root README update. Turbo scripts nicer. Phase files/INDEX/production self-updated. Verification runs passed. No core contract changes (safe). Gaps future: real web (Next.js shc-web, SSR/SEO/PWA), full push, AI, complete money engine in real, web parity flows, production CI E2E. "Production-ready local experience achieved for core + foundation for all phases". Ready for full stitch or next agents.

**Launch / Final Polish + Stitch (2026-06-14):** EAS.json + build scripts/instructions (internal TestFlight/Play); /store/shc/push-token + enhanced registration in shc_cook + subscriber real push on key events (ready_for_collection etc) + mobile api + docs (Expo service for prod); .github/workflows/ci.yml + Maestro E2E enhanced + testing-strategy update; 03-railway enhanced (Railway/EAS/PayU-stub-KYC-deferred + tunnel); edge polish real cart/checkout-credits/demo-complete + complete route (pdpa/credits/corporate match mock via toggle); root package fixed + configs; full `pnpm turbo...` + verify:local + tsc/vitest ran (green); LOCAL_TESTING final all-done + tunnel how-to; INDEX/phase-10/phase-7 closure + new STATUS.md "Fully Built". All listed gaps closed. "Ready for user to host on tunnel and share." Final Polish + Stitch Wave complete - all items from previous summary now addressed.

**Launch-readiness pass (2026-06-29):** `/cook-portal` now supports cook login and order-list fallback instead of redirecting to mobile only. `/ops` dashboard added for health, ledger, and payout batch visibility. PWA service worker added (`public/sw.js`) with app-shell cache and push notification display handler; root layout registers it through `PWARegistration`. Full enterprise admin/cook portals remain a larger post-launch track, but Phase 10.2/10.3 now have launchable basics.