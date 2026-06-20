# Self-Updating Rules for the Blueprint Web

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../CURRENT_STATE.md](../CURRENT_STATE.md)
- [tracks.md](./tracks.md)
- [stitching-protocol.md](./stitching-protocol.md)

**MANDATORY RULE — Update Blueprint With Every Change**

**Any code, contract, or UI change that affects documented areas MUST update the blueprint in the same commit.** 

This is non-negotiable for humans and agents. Drift kills the single source of truth.

Examples of changes that **require** blueprint update(s):
- New or changed route / API payload / error code
- New table/column/module (05 + 11 + 06)
- Contract change (@shc/types or business-rules)
- New/changed screen, component, or tri-platform behavior (10, 12, brand.md)
- Auth flow, state machine, money, or rule change (07, 08, 09)
- Deployment / infra / env / script change (03-railway, scripts, CI)
- New gap or "done" item (CURRENT_STATE §8 + INDEX)

Never commit code-only when blueprint is impacted.

## Mandatory Update Protocol (Every Change, Every Commit)

After **any** change (code or docs):

1. **Identify Affected Blueprint Sections**
   - Always at minimum: the primary doc (e.g. 06 for route) + CURRENT_STATE.md (exec/gaps/routes if integration) + INDEX.md (Last Updated + summary line).
   - Use "Related Files" headers.

2. **Make the Edits**
   - Precise. Preserve history.
   - Update tables, add examples, mark complete, extend schemas.
   - If you changed a Zod schema or DB column → edit 05-data-model.md + types if needed + 06 if route exposed.

3. **Bump Metadata Everywhere You Touched**
   - File header: `**Last Updated:** 2026-06-20 ... (short reason)`
   - INDEX.md: update top Last Updated + add 1-2 line summary under "Progress Update".
   - CURRENT_STATE if state changed (routes, auth, modules, gaps, commands, gotchas).

4. **Cross-Link + Consistency**
   - New field → 05 + 06 + caller docs.
   - New feature → relevant phase + 10/12 if mobile/web.

5. **Pre-Commit Verification**
   - `grep -r "TODO\|FIXME\|placeholder\|stub" blueprint/ | cat` — clean stale notes you introduced.
   - Check links are valid relative markdown.
   - Run relevant verify (typecheck, seed, pnpm verify:local) if contracts touched.
   - Ensure CURRENT_STATE still matches reality you just built.

## Self-Updating Examples

**Example 1: Mobile Agent completes OrderChat polling**
- Edits: `10-mobile.md` (add polling details to OrderChat contract)
- Edits: `13-implementation-phases/phase-5.md` (mark Task 5.8 done + link)
- Updates `INDEX.md` Last Updated

**Example 2: Backend Agent adds new ledger entry type**
- Edits: `05-data-model.md` (add to shc_ledger_entry table)
- Edits: `06-api-surface.md` (add internal route if needed)
- Edits: `11-medusa-modules.md` (shc-ledger section)
- Updates phase file + INDEX.md

## Anti-Drift Safeguards + Commit Rule
- **Same-commit rule:** Blueprint patches go in the same commit as the code that changed behavior. "I'll update docs later" is not allowed.
- Contracts changes after freeze: prefer PR against the Contracts owner, but the submitting change **still** includes the doc update.
- Stitching / CI should fail or warn on obvious drift (e.g. new route without 06 entry) — add checks over time.
- Before merge: reviewer checks that INDEX + CURRENT_STATE + primary section(s) were touched for the delta.
- Run `grep -r "TODO\|FIXME\|placeholder" blueprint/` as part of local verify.

## Updated Examples (reflecting the rule)

**Example 1: Adding /store/shc/cart + shc-cart module**
- Edit: apps/medusa/src/modules/shc-cart/* + route + cart service usage
- Edit: 05-data-model.md (new table row + columns)
- Edit: 06-api-surface.md (cart status → ✅ Implemented, Postgres)
- Edit: 11-medusa-modules.md (add row + registration note)
- Edit: CURRENT_STATE.md (cart row + gotchas)
- Edit: INDEX.md + self-updating-rules if process changed
- Commit message includes "blueprint sync"

**Example 2: Cook password_hash + scrypt login**
- Code: migration, model, shc-password.ts, shc-auth, seed, cook login route, schema in types
- Blueprint: 05 (cook columns), 07-auth (flows), 06 (auth status), CURRENT_STATE (auth ✅ + details), INDEX, shcCookSchema comment align
- Same commit.

## Verification (run before commit)
```bash
# after your code + blueprint edits
grep -r "TODO\|FIXME\|placeholder" blueprint/ || true
# typecheck + seed if contracts changed
pnpm --filter @shc/types build
cd apps/medusa && pnpm seed --validate || npx tsx ../../scripts/seed.ts --validate
```

This protocol (now stricter) keeps the entire blueprint web executable and trustworthy.