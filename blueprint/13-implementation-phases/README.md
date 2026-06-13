# 13 — Implementation Phases (Full Breakdown)

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [../multi-agent/stitching-protocol.md](../multi-agent/stitching-protocol.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- Individual phase files in this folder

**Last Updated:** 2026-06-13

This folder contains the detailed, deterministic task breakdown for every phase. Each phase file lists tasks with exact implementation details, acceptance criteria, verification commands, and multi-agent track assignments.

**Phase Files (navigable by agents):**
- [phase-0.md](./phase-0.md) — Business prep + contracts freeze
- [phase-1.md](./phase-1.md) — Platform foundation
- [phase-2.md](./phase-2.md) — Cook onboarding
- [phase-3.md](./phase-3.md) — Listings
- [phase-4.md](./phase-4.md) — Customer discovery
- [phase-5.md](./phase-5.md) — Orders and trust (critical E2E)
- [phase-6.md](./phase-6.md) — Money engine
- [phase-7.md](./phase-7.md) — Mobile launch
- [phase-8.md](./phase-8.md) — Differentiation
- [phase-9.md](./phase-9.md) — Growth
- [phase-10.md](./phase-10.md) — Web parity

**Multi-Agent Execution Notes:**
- Phases 0–1 are mostly sequential (contracts freeze).
- From Phase 2 onward, 3–5 tracks run in parallel per the tracks.md rules.
- Every phase ends with a stitching checkpoint (see stitching-protocol.md).
- Phase 5 has two stitching points because of its size and risk.
- All tasks must satisfy production-hardening.md requirements.

**No information lost:** Every original task ID, implementation detail, done-when criterion, and E2E acceptance from the single-file blueprint is preserved in these phase files, augmented with track ownership and production gates.