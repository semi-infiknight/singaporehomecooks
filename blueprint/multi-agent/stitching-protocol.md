# Stitching Protocol (Deterministic Integration)

**Related Files:**
- [tracks.md](./tracks.md)
- [self-updating-rules.md](./self-updating-rules.md)
- [../13-implementation-phases/README.md](../13-implementation-phases/README.md)
- [../production/testing-strategy.md](../production/testing-strategy.md)

**Purpose:** After parallel work on a phase (or critical sub-phase like Phase 5), a dedicated Stitching Agent merges everything into a stable integration branch, runs full gates, and only then promotes to `main`. This is the only way code reaches production.

## Stitching Agent Responsibilities
- Never owns feature work during a parallel sprint.
- Creates and owns the `integrate/phase-N-<date>` branch.
- Runs the full verification matrix.
- Resolves conflicts using deterministic rules below.
- Updates `INDEX.md` "Last Updated" after successful merge.

## Step-by-Step Stitching Process (Repeatable)

1. **Preparation (all feature agents)**
   - Push feature branches
   - Open PRs labeled "Ready for Integration"
   - Run local `turbo lint && turbo test && turbo build`

2. **Stitching Agent Creates Integration Branch**
   ```bash
   git checkout main
   git pull
   git checkout -b integrate/phase-5-2026-06-20
   ```

3. **Merge Phase**
   - Merge all "Ready for Integration" PRs (or cherry-pick)
   - Resolve any merge conflicts using rules below

4. **Full Gate Verification (must be 100% green)**
   ```bash
   pnpm install --frozen-lockfile
   turbo lint
   turbo test -- --coverage --threshold 80
   turbo build
   pnpm --filter mobile maestro test:e2e   # Phase 5+ critical flows
   node scripts/security-scan.js || echo "Manual review required"
   ```
   - Expected: All pass. Any failure → create fix task and re-run.

5. **Conflict Resolution Rules (Deterministic)**
   - Schema / Zod / error code conflict → Contracts Agent owns the fix (bumps contracts version)
   - API route signature mismatch → Backend Agent owns
   - UI component or screen contract drift → Mobile Agent owns
   - Business rule logic conflict → Contracts + Backend joint review
   - Documentation drift → Content Agent owns + updates INDEX.md

6. **Promotion**
   - Only after all gates pass + founder sign-off on Phase Acceptance Criteria
   - Merge `integrate/phase-N` → `main`
   - Delete feature branches
   - Stitching Agent updates `INDEX.md` with new "Last Updated" + summary of what was integrated

## Phase 5 Special Rule (Highest Risk)
Phase 5 has 13 tickets and 4 sub-tracks. Stitching happens **twice**:
- Mid-phase after PayNow + Cart Complete + Order State Machine
- Final after full E2E acceptance (exact flow in `13-implementation-phases/phase-5.md`)

This protocol guarantees that parallel work never diverges from the single source of truth.