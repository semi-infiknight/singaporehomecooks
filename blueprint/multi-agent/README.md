# Multi-Agent Execution Layer — README

**Related Files:**
- [tracks.md](./tracks.md)
- [stitching-protocol.md](./stitching-protocol.md)
- [production-hardening.md](./production-hardening.md)
- [self-updating-rules.md](./self-updating-rules.md)
- [../INDEX.md](../INDEX.md)
- [../13-implementation-phases/README.md](../13-implementation-phases/README.md)

**Purpose:** This layer makes the entire blueprint executable by multiple AI coding agents working in parallel on disjoint features, then deterministically stitched together. It is integrated into every phase and section.

## Core Rules for Parallel Builder Agents

1. **One Canonical Source:** Only edit files inside `blueprint/`. Never create separate plans.
2. **Contracts First:** All work after Phase 0 must reference frozen contracts in `05-data-model.md` and `06-api-surface.md`.
3. **Track Ownership:** See `tracks.md`. Each agent is assigned one primary track.
4. **Stitching is Mandatory:** No feature branch merges to `main` without going through the stitching protocol.
5. **Self-Updating:** After every task, follow `self-updating-rules.md` to patch the relevant section file(s) and update the "Last Updated" timestamp + agent signature in `INDEX.md`.
6. **Production from Day 1:** Every deliverable must satisfy the rules in `production-hardening.md` (tests, error handling, observability, PDPA notes, etc.). No stubs or demo code.

## Quick Start for a New Agent

```markdown
1. Read this file + tracks.md
2. Read the phase file for your current phase (e.g. ../13-implementation-phases/phase-5.md)
3. Read the specific section files your task touches (use "Related Files" headers)
4. Implement using TDD + contracts
5. Run verification commands from the phase file
6. Patch the section file(s) per self-updating-rules.md
7. Notify stitching agent
```

This structure ensures agents always have the latest context without hallucinating or duplicating work.