# Singapore Home Cooks — Android / APK Build Status Report

**Date:** 8 July 2026  
**Session scope:** Customer mobile app (`apps/mobile-customer`) against Railway production  
**Decision:** **Ship customer experience via PWA now.** Native Android APK is **not ready** on Windows; EAS cloud build attempted but errored.

---

## Executive summary

| Area | Status |
|------|--------|
| **Customer PWA (production)** | ✅ Works in Chrome — `https://web-production-9226.up.railway.app` |
| **Medusa backend (production)** | ✅ Live — `https://medusa-production-d2ba.up.railway.app` |
| **Local Windows release APK** | ❌ Blocked — CMake path limits + Reanimated new-arch requirement |
| **EAS cloud preview APK** | ✅ **FINISHED** — build `2ad24658` (~8 Jul 2026); APK at `C:\Users\mathu\Downloads\SHC-customer-preview.apk` |
| **Android emulator** | ⚠️ Partial — `emulator-5554` online; ghost `emulator-5562` offline entry |

**Bottom line:** Brother confirmed PWA is fine for now. **EAS preview APK succeeded** after lockfile sync (`2ad24658`); local Windows `gradlew assembleRelease` remains blocked — use EAS or WSL/Linux for native builds.

---

## Production endpoints

| Service | URL |
|---------|-----|
| Web / PWA | https://web-production-9226.up.railway.app |
| Medusa API | https://medusa-production-d2ba.up.railway.app |
| Railway project | `homecooks` (workspace: captmathur's Projects) |

---

## Repository locations used

| Path | Purpose |
|------|---------|
| `C:\Users\mathu\Projects\singaporehomecooks` | Main monorepo (canonical) |
| `C:\shc\hc` | Short-path clone for local Gradle attempts |
| `C:\hc` | Even shorter clone (also failed) |

---

## Timeline of attempts (7–8 Jul 2026)

### 1. Railway & production access
- Logged into Railway as Kika (`mathur.krishna0708@gmail.com`)
- Confirmed production services: `web`, `medusa`, `worker`, `minio`, Postgres, Redis
- **Read-only** — no deploys or config writes

### 2. PWA criteria audit
- Audited live PWA against `Singapore_Home_Cooks_FINAL.docx` and `Singapore_Home_Cooks_Decisions_Log_FINAL.docx`
- **~65% Phase 1 pass rate** (see [PWA audit summary](#pwa-criteria-audit-summary))
- Interactive report: `~/.cursor/projects/c-Users-mathu-Projects-singaporehomecooks/canvases/shc-pwa-criteria-audit.canvas.tsx`

### 3. Android emulator setup
- Created AVDs: `shc_pixel`, `shc_api35`
- Android SDK: `C:\Users\mathu\AppData\Local\Android\Sdk`
- `emulator-5554` came online (x86_64)
- Persistent ghost device `emulator-5562` (offline) in `adb devices`

### 4. Local Windows release APK — **FAILED** (new architecture ON)

**Command pattern:**
```powershell
cd C:\shc\hc\apps\mobile-customer\android
.\gradlew.bat assembleRelease -PreactNativeArchitectures=x86_64 --no-daemon
```

**Root error:**
```
CMAKE_OBJECT_PATH_MAX : 250
ninja: manifest 'build.ninja' still dirty after 100 tries
```

**Why it failed:**
- Windows default CMake object path limit (250 chars)
- pnpm hoists dependencies under `.pnpm/<hash>/node_modules/...` — paths exceed limit even at `C:\shc\hc` and `C:\hc`
- `subst S:` drive did not shorten physical CMake build paths
- Registry `LongPathsEnabled=1` set but may require reboot; does not fix all CMake/ninja edge cases

**Mitigations attempted (none succeeded):**
- Short-path clones (`C:\shc\hc`, `C:\hc`)
- `@react-native/gradle-plugin@0.81.5` devDependency
- Gradle 8.13, compileSdk/targetSdk 35, minSdk 24, NDK 27.1
- `GRADLE_USER_HOME=C:\g`
- `shamefully-hoist=true` in `.npmrc` (still uses `.pnpm` paths)
- Cleaned `android/app/.cxx` and `android/build` repeatedly

**Elapsed:** Builds ran 10–45+ minutes before CMAKE/ninja failure.

### 5. Local Windows release APK — **FAILED** (new architecture OFF)

**Elapsed:** ~1.4 minutes (fail-fast)

**Error:**
```
:react-native-reanimated:assertNewArchitectureEnabledTask FAILED
[Reanimated] Reanimated requires new architecture to be enabled.
```

**Catch-22 on Windows:**
| `newArchEnabled` | Result |
|----------------|--------|
| `false` | Reanimated refuses to build |
| `true` | CMAKE_OBJECT_PATH_MAX / ninja dirty manifest |

### 6. EAS cloud build — **ERRORED**

| Field | Value |
|-------|-------|
| **Build ID** | `86b5a197-5cba-49b8-b73f-6403e3399a25` |
| **Profile** | `preview` (production Medusa env vars) |
| **Expo account** | `kikalikescows` |
| **Project** | `@kikalikescows/shc-customer` |
| **Project ID** | `df4b2f1e-29d8-4726-bba0-af941e839455` |
| **URL** | https://expo.dev/accounts/kikalikescows/projects/shc-customer/builds/86b5a197-5cba-49b8-b73f-6403e3399a25 |
| **Status (8 Jul 2026)** | **ERRORED** |
| **Queue time** | ~76 min (free tier) |
| **Build duration** | ~9 sec |
| **Error** | `pnpm install --frozen-lockfile exited with non-zero code: 1` |
| **Root cause** | `package.json` added `@react-native/gradle-plugin@0.81.5` but `pnpm-lock.yaml` was not synced before upload |
| **Fix applied (8 Jul 2026)** | `pnpm install` at monorepo root; `pnpm install --frozen-lockfile` verified passing; `preview` profile pinned to `node: 22.16.0` / `pnpm: 11.1.3` |

**What succeeded before error:**
- Project upload (~41 MB)
- Remote Android keystore generation in cloud
- Fingerprint computation

**Why it failed:**
- EAS runs `pnpm install --frozen-lockfile` in CI; any `package.json` change without a matching lockfile entry fails immediately
- First build was submitted from short clone `C:\shc\hc` during an in-progress lockfile edit session
- Original Expo project (`owner: darksend`, projectId `5c1f4300-...`) was inaccessible; re-initialized under `kikalikescows`

### 7. Expo / EAS account migration (local only)
- `app.json` owner changed: `darksend` → `kikalikescows`
- `eas.projectId` changed to `df4b2f1e-29d8-4726-bba0-af941e839455`
- **Team decision needed:** which Expo org should own production builds?

---

### 8. EAS cloud build — **FINISHED** (retry after lockfile fix)

| Field | Value |
|-------|-------|
| **Build ID** | `2ad24658-89d8-489c-9bcd-e9d0e41058ed` |
| **Profile** | `preview` (production Medusa env vars) |
| **Status (8 Jul 2026)** | **FINISHED** |
| **APK (local)** | `C:\Users\mathu\Downloads\SHC-customer-preview.apk` |
| **Artifact URL** | https://expo.dev/artifacts/eas/L7sB6JxjfzIiU99UpvxQcXuc_9EHPtqIkEBugiZb5Ik.apk |
| **Build URL** | https://expo.dev/accounts/kikalikescows/projects/shc-customer/builds/2ad24658-89d8-489c-9bcd-e9d0e41058ed |
| **Git commit** | `fe3886d8d2e1b865a9781e49ff5f620ccc981575` |
| **Queue / build** | ~54 min queue, ~21 min compile (free tier) |

**Fix that unblocked:** `pnpm install` at monorepo root so `pnpm install --frozen-lockfile` passes on EAS; `preview` profile pins `node: 22.16.0` / `pnpm: 11.1.3`.

---

## Root cause analysis

### Windows local builds
1. **Path length** — React Native New Architecture + native modules (Reanimated, Skia, etc.) generate CMake object paths that exceed Windows limits when combined with pnpm's content-addressed `node_modules` layout.
2. **Reanimated** — `react-native-reanimated@4.x` **requires** `newArchEnabled=true`; disabling new arch is not an option without downgrading or removing Reanimated.
3. **pnpm monorepo** — Deep symlinked paths under `.pnpm/` are the worst-case for Windows native builds.

### EAS cloud build
1. **Confirmed root cause** — `pnpm install --frozen-lockfile` failed because `@react-native/gradle-plugin` was added to `apps/mobile-customer/package.json` without a synced `pnpm-lock.yaml` in the uploaded archive.
2. **Fix** — Run `pnpm install` at monorepo root; verify `pnpm install --frozen-lockfile` passes before `eas build`. Re-submit from `C:\Users\mathu\Projects\singaporehomecooks` (not stale short clone).
3. **Prevention** — `preview` profile now pins `node: "22.16.0"` and `pnpm: "11.1.3"` (matching `production` and root `packageManager`).

---

## What works today

- ✅ **PWA** installed via Chrome, production Railway backend
- ✅ Product discovery, cook profiles, allergens, min qty, collection slots
- ✅ Trust page (cancellation tiers, guarantee, address timing)
- ✅ Service worker + manifest (standalone)
- ✅ Live Medusa catalogue (6 dishes observed in audit)
- ✅ Railway production stack (read access verified)

---

## What does not work

- ❌ Local `gradlew assembleRelease` on Windows (this machine)
- ⏳ EAS preview APK (first attempt errored on lockfile; retry pending after fix)
- ⚠️ Native app install on emulator — APK exists locally; `emulator-5562` offline (start AVD + `adb install`)
- ⚠️ Several PWA Phase 1 items partial/fail (see audit)

---

## Recommended fixes (ranked)

### 1. Fix EAS monorepo config and retry (highest priority for APK)

```jsonc
// eas.json — preview profile additions to try
"preview": {
  "node": "22.16.0",
  "pnpm": "11.1.3",
  "android": { "buildType": "apk" },
  // Consider: "env": { "EAS_BUILD": "true" }
}
```

Also verify:
- Submit from **main repo root** with correct `eas.json` / Expo monorepo docs for pnpm
- Add/check `.easignore` — exclude unrelated apps to shrink upload
- Review Install dependencies logs at EAS build URL
- Consider paid EAS tier if queue time (~76 min) is unacceptable

### 2. WSL2 or Linux/macOS clone

```bash
git clone <repo> ~/shc
cd ~/shc/apps/mobile-customer/android
./gradlew assembleRelease
```

Linux avoids Windows CMAKE_OBJECT_PATH_MAX. Use `~/` short home path. Still need `newArchEnabled=true`.

### 3. Windows long paths (low confidence)

- Reboot after `LongPathsEnabled=1`
- Try `npm` flat `node_modules` instead of pnpm for mobile app only (last resort)
- Build only `arm64-v8a` or `x86_64` single ABI to reduce path depth

### 4. Do not pursue

- ❌ `newArchEnabled=false` — blocked by Reanimated
- ❌ `subst` drive letters — does not fix physical CMake paths
- ❌ Local Gradle on this Windows host without WSL — poor ROI

---

## PWA criteria audit summary

**Canvas:** `shc-pwa-criteria-audit.canvas.tsx` (Cursor Canvas)  
**Pass rate:** ~65% Phase 1 customer criteria  
**Channel audited:** Chrome PWA on production Railway

### Key passes
- Occasion-first homepage, cook profiles, allergen disclosure, min quantity, collection slots
- Trust architecture (`/content/trust`), cancellation policy, address timing, Occasion Guarantee
- PWA manifest + service worker, guest browse + login-gated checkout
- Live Medusa catalogue

### Key gaps (fail / partial)

| ID | Issue | Status |
|----|-------|--------|
| P1-03 | Live social proof counters on homepage | **Fixed in branch** — `/store/shc/platform-stats` + `TrustStrip`/`SHCTrustStrip` wired on web + mobile |
| P2-03 | Mandarin UI at launch | **Fail** |
| BUG-01 | `og:image` points to `localhost:3000` on production | **Fixed in branch** — `metadataBase` + `/og-image.png` route |
| P1-02 | Dish synonym search depth | Partial |
| P1-09 | One-cook-per-cart live verification | Partial |
| P1-10–11 | PayNow checkout + S$50 minimum (needs signed-in E2E) | Partial |
| P1-21 | Web push permission flow | Partial |

### Pre-launch items (operational — outside app UI)

- Food law specialist written opinion (FINAL §21)
- MAS PayNow licence confirmation (Decisions §15)
- Insurance in force before first transaction

---

## Local changes from this session (not pushed)

### Safe to include in PR (after review)

| File | Change |
|------|--------|
| `apps/mobile-customer/android/build.gradle` | SDK 35, minSdk 24, NDK 27.1 |
| `apps/mobile-customer/android/gradle.properties` | JVM 4GB, worker limits; **`newArchEnabled=true` (reverted)** |
| `apps/mobile-customer/android/gradle/wrapper/gradle-wrapper.properties` | Gradle 8.13 |
| `apps/mobile-customer/package.json` | `@react-native/gradle-plugin@0.81.5` devDep |
| `apps/mobile-customer/eas.json` | `preview.android.buildType: apk` |
| `apps/mobile-customer/app.json` | Expo owner/projectId → `kikalikescows` / new projectId |
| `pnpm-lock.yaml` | Lockfile from gradle-plugin add |

### Must NOT commit

| File | Reason |
|------|--------|
| `apps/mobile-customer/.env` | Production Medusa publishable key — **gitignored** |
| `build-log.txt` | Local build artifact — do not commit |

### Team decisions required

1. **Expo project ownership** — `darksend` vs `kikalikescows` account
2. **EAS env vars in `eas.json`** — publishable keys are in repo `eas.json` already on `production` profile; confirm policy
3. **Whether Android SDK bumps** should land on `main` before APK is proven on EAS

---

## PR checklist for team

- [ ] Read this report and `docs/PR_DRAFT_ANDROID_DEFERRED.md`
- [ ] Confirm PWA is acceptable customer channel until APK ready
- [ ] Decide Expo org / project ownership
- [x] Fix EAS `preview` profile (node/pnpm/monorepo) and retry build — **done** (`2ad24658`)
- [x] EAS preview APK artifact exists (`2ad24658`; local copy in Downloads)
- [ ] Verify `.env` not staged (`git status`)
- [ ] Fix production `og:image` (web app — separate PR)
- [ ] Plan Mandarin i18n and homepage counters per scope docs
- [ ] Schedule signed-in checkout E2E (PayNow, min order, PDPA consent)
- [ ] Consider WSL build guide for developers on Windows

---

## Commands reference

### Check EAS build status
```bash
cd apps/mobile-customer
pnpm dlx eas-cli@latest build:list --platform android --limit 1 --json
```

### Retry EAS preview (after config fix)
```bash
cd apps/mobile-customer
pnpm dlx eas-cli@latest build --profile preview --platform android --non-interactive
```

### Install APK when available
```powershell
adb -s emulator-5554 install -r C:\Users\mathu\Downloads\SHC-customer-preview.apk
adb -s emulator-5554 shell am start -n com.singaporehomecooks.customer/.MainActivity
```

---

## Appendix: error snippets

### Windows CMAKE (new arch ON)
```
CMAKE_OBJECT_PATH_MAX : 250
ninja: manifest 'build.ninja' still dirty after 100 tries
```

### Reanimated (new arch OFF)
```
Execution failed for task ':react-native-reanimated:assertNewArchitectureEnabledTask'.
[Reanimated] Reanimated requires new architecture to be enabled.
```

### EAS (cloud)
```
Android build failed:
Unknown error. See logs of the Install dependencies build phase for more information.
```

---

*Generated during Android build session, 7–8 Jul 2026. No Railway writes. No git push.*
