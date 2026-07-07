# PR: Overnight launch gaps (OG image + social counters + Android docs)

**Branch:** `docs/android-build-blockers` (3 commits ahead of origin/main)  
**Target:** `main` @ `semi-infiknight/singaporehomecooks`  
**Status:** Ready locally — **push blocked** (git uses `itskika-78`, no write access to `semi-infiknight`)

## Summary

- Fix production Open Graph previews (`metadataBase` + `/og-image.png` route) — resolves BUG-01 (`localhost:3000` og:image).
- Add public `GET /store/shc/platform-stats` and wire live homepage social-proof counters on web (`TrustStrip`) and mobile customer (`SHCTrustStrip`) — resolves P1-03.
- Retain Android/EAS blocker documentation + lockfile fix from prior commits on this branch.

## Commits on branch

1. `17b609f` docs(mobile): document Android APK blockers and session outcomes
2. `fe3886d` fix(mobile): sync lockfile for EAS and pin preview node/pnpm
3. `e62e46b` fix(web+api): production OG image and live homepage counters

## Test plan

- [ ] `cd apps/medusa && pnpm exec vitest run src/api/store/shc/platform-stats/route.test.ts`
- [ ] `cd apps/web && pnpm exec tsc --noEmit`
- [ ] `bash scripts/verify-web-pwa.sh` (og-image.png in pwa-assets)
- [ ] Deploy web + medusa to Railway staging/production (user/brother — **not done by agent**)
- [ ] Verify production homepage shows social counter strip after deploy
- [ ] Verify `curl -sI https://<web>/og-image.png` returns 200 PNG
- [ ] View page source / Facebook debugger: `og:image` uses Railway URL not localhost
- [ ] EAS Android preview build completes (see ANDROID_BUILD_BLOCKERS.md)

## Gap list (audit vs blueprint / FINAL.txt)

| ID | Item | Status after this PR |
|----|------|----------------------|
| BUG-01 | og:image localhost on production | Fixed in code — needs Railway deploy |
| P1-03 | Homepage live social counters | Fixed in code — **prod audit:** og-image 200; `/store/shc/platform-stats` **404** on live Medusa (needs deploy) |
| P2-01 | Customer web Gourmeat parity | **In progress** — cook-portal `appearance="cook"` brutal audit; customer login/search/cart Gourmeat |
| P1-02 | Dish synonym search depth | **Improved** — 20 SG heritage seeds + bidirectional expansion |
| P1-09–11 | One-cook cart / PayNow / S$50 min E2E | **Improved** — S$50 min enforced (`SHC-CART-004`); one-cook `SHC-CART-001` fix + cart test |
| P1-21 | Web push permission flow | **Improved** — permission states + post-order prompt banner |
| Android APK | Local Windows + first EAS error | **FINISHED** — build `2ad24658`; APK at `~/Downloads/SHC-customer-preview-new.apk` |
| GitHub PR | Push to semi-infiknight | **Blocked** — auth |

## Auth unblock (user wake-up)

```powershell
# 1. Add gh to PATH (optional)
$env:Path += ";C:\Program Files\GitHub CLI"

# 2. Login as account with semi-infiknight write access (brother's account or PAT)
gh auth login --hostname github.com --git-protocol https --web

# 3. Or use PAT (repo scope) for semi-infiknight collaborator:
# $env:GH_TOKEN = "<paste-token>"
# echo $env:GH_TOKEN | gh auth login --with-token

# 4. Push and create PR
cd C:\Users\mathu\Projects\singaporehomecooks
git push -u origin docs/android-build-blockers
gh pr create --repo semi-infiknight/singaporehomecooks --base main --head docs/android-build-blockers --title "fix: production OG image, homepage counters, Android build docs" --body-file docs/PR_OVERNIGHT_LAUNCH_GAPS.md
```

## EAS monitoring

```powershell
cd apps\mobile-customer
pnpm dlx eas-cli@latest build:list --platform android --limit 1 --json
# When status=FINISHED and artifacts.buildUrl present:
pnpm dlx eas-cli@latest build:download --id <build-id> --output C:\Users\mathu\Downloads\SHC-customer-preview.apk
```
