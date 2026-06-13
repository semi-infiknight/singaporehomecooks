# AGENTS.md — How AI Builder Agents Navigate & Update This Web

This is the canonical navigation and update guide. Every agent must read this before starting work.

## Primary Entry Point
Always start at `blueprint/INDEX.md`. It contains the full linked table of contents and explains the web structure.

## Navigation Pattern (Efficient Context Retrieval)
1. Read `INDEX.md` + `multi-agent/README.md`
2. Identify your track (see `multi-agent/tracks.md`)
3. Open the phase file for your current phase
4. Follow "Related Files" and "See also" links at the top of every file
5. When you need schema or route definitions, go to `05-data-model.md` or `06-api-surface.md`
6. When you need production rules, go to `multi-agent/production-hardening.md` or the `production/` folder

## Self-Updating Rules
Strictly follow `multi-agent/self-updating-rules.md` after every task. This keeps the web as the single source of truth.

## No Divergence Allowed
- The old `Singapore_Home_Cooks_Builder_Blueprint.md` has been removed.
- The `.hermes/plans/` version has been removed.
- All future work happens inside `blueprint/`.

This web is designed so agents can quickly load only the relevant context for their task while always having access to the full picture via links. It supports true parallel development with deterministic stitching.