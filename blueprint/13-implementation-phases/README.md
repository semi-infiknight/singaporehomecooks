# 13 — Implementation Phases

**Status:** **Historical planning archive** — not live integration state.  
**Live state:** [CURRENT_STATE.md](../CURRENT_STATE.md) only.

**Last updated:** 2026-07-29 (banner only; phase bodies unchanged from build waves)

---

These files preserve original task IDs, acceptance criteria, and multi-agent track assignments from the 2026-06 build. Use them when you need **why** a feature was scoped a certain way — not **what** is wired today.

| Question | Read |
|----------|------|
| What works on `main` now? | [CURRENT_STATE.md](../CURRENT_STATE.md) |
| Route / module catalog | [06-api-surface.md](../06-api-surface/06-api-surface.md), [05-data-model.md](../05-data-model/05-data-model.md) |
| Mobile contracts / Maestro | [10-mobile.md](../10-mobile/10-mobile.md) |
| Parallel agent ownership | [multi-agent/tracks.md](../multi-agent/tracks.md) |

**Do not** append new "wave complete" blocks to phase files — update `CURRENT_STATE.md` + the relevant section file instead ([self-updating-rules.md](../multi-agent/self-updating-rules.md)).

---

## Phase index

| File | Topic |
|------|--------|
| [phase-0.md](./phase-0.md) | Business prep + contracts freeze |
| [phase-1.md](./phase-1.md) | Platform foundation |
| [phase-2.md](./phase-2.md) | Cook onboarding |
| [phase-3.md](./phase-3.md) | Listings |
| [phase-4.md](./phase-4.md) | Customer discovery |
| [phase-5.md](./phase-5.md) | Orders and trust (critical E2E) |
| [phase-6.md](./phase-6.md) | Money engine |
| [phase-7.md](./phase-7.md) | Mobile launch |
| [phase-8.md](./phase-8.md) | Differentiation |
| [phase-9.md](./phase-9.md) | Growth |
| [phase-10.md](./phase-10.md) | Web parity |

**Execution notes (historical):** Phases 0–1 sequential; from phase 2 parallel tracks per [tracks.md](../multi-agent/tracks.md). Stitch checkpoints: [stitching-protocol.md](../multi-agent/stitching-protocol.md). Production gates: [production-hardening.md](../multi-agent/production-hardening.md).

**Note:** Phase bodies may reference removed `mock-service.ts`, localhost Medusa, or tunnel hosting — superseded by Railway-only clients (see CURRENT_STATE §0, §3).
