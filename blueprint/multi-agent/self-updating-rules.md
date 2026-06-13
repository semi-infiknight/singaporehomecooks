# Self-Updating Rules for the Blueprint Web

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [tracks.md](./tracks.md)
- [stitching-protocol.md](./stitching-protocol.md)

**Purpose:** This web must remain the single source of truth and stay current as agents build in parallel. These rules prevent drift and information loss.

## Mandatory Update Protocol (Every Agent, Every Task)

After completing **any** task (even a small one):

1. **Identify Affected Files**
   - Use the "Related Files" header at the top of the section you worked in.
   - Always touch at least one file in your track + the phase file.

2. **Patch the Content**
   - Use precise edits (prefer `patch` tool over full rewrites).
   - Never delete existing information — only add, clarify, or mark completed.
   - When adding new production requirements or API details, place them in the correct section file (e.g., new route goes in `06-api-surface.md` under the relevant table).

3. **Update "Last Updated" Metadata**
   - In every edited file, update the frontmatter or header:
     ```
     **Last Updated:** 2026-06-13 by Mobile-Agent (Task 5.8 OrderChat)
     ```
   - In `INDEX.md`, append to the "Last Updated" line and add a one-line change summary.

4. **Cross-Link New Content**
   - If you add a new acceptance criterion, add a link from the phase file back to the detailed section.
   - If you add a new schema field, update both `05-data-model.md` and the route that uses it in `06-api-surface.md`.

5. **Verification Before Commit**
   - Run `grep -r "TODO\|FIXME\|placeholder" blueprint/` to ensure no stale notes remain in your changes.
   - Confirm all links in the edited files are valid.

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

## Anti-Drift Safeguards
- Contracts Agent is the only one allowed to edit `05-data-model.md` and `06-api-surface.md` after Phase 0 (other agents open issues/PRs against Contracts Agent).
- Stitching Agent performs a full "web consistency check" (all internal links valid, no duplicate content) before promoting any integration branch.
- Weekly (or after every phase): Content Agent runs a manual review pass and updates the "Last Updated" in INDEX.md.

This protocol ensures the blueprint web evolves with the project while remaining the single, navigable source of truth.