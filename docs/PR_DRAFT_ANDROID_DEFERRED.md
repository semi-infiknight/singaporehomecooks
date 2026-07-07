# PR Draft — Android Build Deferred (Documentation + Safe Config)

Use this file to open a PR. **Do not claim APK is ready.**

---

## Suggested PR title

```
docs(mobile): document Android APK blockers; defer native to EAS/WSL
```

**Alternative:**
```
chore(mobile-customer): Android build tooling updates + blocker documentation
```

---

## PR body (copy-paste)

```markdown
## Summary

This PR documents the outcome of an intensive Android release APK session (7–8 Jul 2026). **No release APK was produced.** The customer app is shipping via **PWA on production Railway** until native Android is unblocked.

### What this PR does
- Adds comprehensive build status report: `docs/ANDROID_BUILD_BLOCKERS.md`
- Records Android/EAS blockers, timeline, and recommended next steps
- Includes safe mobile-customer tooling updates from the session (Gradle/SDK bumps, gradle-plugin devDep, EAS preview APK config)
- Reverts `newArchEnabled` to `true` (required by `react-native-reanimated`)

### What this PR does NOT do
- ❌ Does **not** deliver a working APK
- ❌ Does **not** include `.env` or secrets
- ❌ Does **not** change Railway production
- ❌ Does **not** enable `newArchEnabled=false` (Reanimated blocks this)

## Blockers (honest status)

| Path | Result |
|------|--------|
| Local Windows `gradlew assembleRelease` | Failed — `CMAKE_OBJECT_PATH_MAX` / ninja with pnpm deep paths |
| `newArchEnabled=false` workaround | Failed in ~1.4 min — Reanimated requires new architecture |
| EAS preview build `86b5a197-...` | **ERRORED** — Install dependencies phase (~76 min queue on free tier) |

**EAS build URL:** https://expo.dev/accounts/kikalikescows/projects/shc-customer/builds/86b5a197-5cba-49b8-b73f-6403e3399a25

## Customer path today

✅ **PWA** at https://web-production-9226.up.railway.app (Chrome install, production Medusa backend)

See PWA audit (~65% Phase 1 pass): Cursor canvas `shc-pwa-criteria-audit.canvas.tsx`

## Code changes included

### `apps/mobile-customer/android/build.gradle`
- compileSdk / targetSdk 35, minSdk 24, NDK 27.1

### `apps/mobile-customer/android/gradle.properties`
- JVM heap 4GB, limited parallel workers (Windows stability)
- `newArchEnabled=true` (unchanged from main intent — session briefly toggled false)

### `apps/mobile-customer/android/gradle/wrapper/gradle-wrapper.properties`
- Gradle 8.8 → 8.13

### `apps/mobile-customer/package.json` + `pnpm-lock.yaml`
- Add `@react-native/gradle-plugin@0.81.5` devDependency

### `apps/mobile-customer/eas.json`
- `preview.android.buildType: "apk"`

### `apps/mobile-customer/app.json`
- Expo project re-linked to `@kikalikescows/shc-customer` (`projectId: df4b2f1e-...`)
- **Needs team review:** migrated from `darksend` account (permission denied on original project)

## Files explicitly excluded

- `apps/mobile-customer/.env` — production keys, gitignored
- `build-log.txt` — local artifact

## Recommended follow-ups (separate PRs/issues)

1. **EAS:** Add `node`/`pnpm` pins to `preview` profile; fix monorepo install on EAS; retry build
2. **Web:** Fix production `og:image` (currently `localhost:3000`)
3. **Web:** Homepage live social counters (P1-03)
4. **i18n:** Mandarin at launch per Decisions log (P2-03)
5. **QA:** Signed-in checkout E2E (PayNow, S$50 min, PDPA consent)
6. **DevEx:** WSL build guide for Windows developers

## Test plan

- [ ] `git status` — confirm no `.env` staged
- [ ] Read `docs/ANDROID_BUILD_BLOCKERS.md`
- [ ] `pnpm --filter mobile-customer typecheck` (no regression)
- [ ] Confirm `newArchEnabled: true` in `app.json` and `gradle.properties`
- [ ] Team agrees on Expo account ownership (`kikalikescows` vs `darksend`)
- [ ] **Do not** require APK install for merge — documentation PR
- [ ] PWA smoke test: https://web-production-9226.up.railway.app loads, /search shows dishes

## Deployment notes

- No Railway deploy
- No mobile store submission
- PWA remains production customer channel
```

---

## Branch suggestion

```bash
git checkout -b docs/android-build-blockers
```

## Files to stage

```bash
git add docs/ANDROID_BUILD_BLOCKERS.md
git add docs/PR_DRAFT_ANDROID_DEFERRED.md
git add apps/mobile-customer/android/build.gradle
git add apps/mobile-customer/android/gradle.properties
git add apps/mobile-customer/android/gradle/wrapper/gradle-wrapper.properties
git add apps/mobile-customer/app.json
git add apps/mobile-customer/eas.json
git add apps/mobile-customer/package.json
git add pnpm-lock.yaml
```

## Files to NOT stage

```bash
# Verify these are absent from staging:
git status | findstr /i ".env build-log"
```

## Suggested commit message

```
docs(mobile): document Android APK blockers and session outcomes

PWA is the production customer path until EAS monorepo config is fixed
or builds succeed on WSL/Linux. Includes Gradle/SDK tooling updates
from the session; reverts newArchEnabled to true for Reanimated.
No APK artifact; no secrets committed.
```

---

## Reviewer FAQ

**Q: Can we ship Android now?**  
A: No. Use PWA.

**Q: Why not turn off new architecture?**  
A: `react-native-reanimated@4.x` fails the build immediately.

**Q: Why did EAS fail?**  
A: Install dependencies phase — likely pnpm monorepo config; see full report.

**Q: Should we merge SDK 35 / Gradle 8.13 bumps without a green APK?**  
A: Low risk tooling alignment; optional to split into docs-only PR if preferred.

**Q: Who owns the Expo project now?**  
A: Session linked to `kikalikescows` after `darksend` permission error. Team must confirm.
