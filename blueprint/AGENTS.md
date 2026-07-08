# AGENTS.md — How AI Builder Agents Navigate & Update This Web

This is the canonical navigation and update guide. Every agent must read this before starting work.

## Primary Entry Point

**Picking up the repo cold?** Read in this order:

1. **[CURRENT_STATE.md](./CURRENT_STATE.md)** — What works today (routes, commands, gaps). **Authoritative for integration reality.**
2. **[BUILDER_GUIDE.md](./BUILDER_GUIDE.md)** — **How to build, taste, and test** (blueprint playbook).
3. **[INDEX.md](./INDEX.md)** — Full table of contents + progress history.
4. **[multi-agent/README.md](./multi-agent/README.md)** — Parallel execution rules (if multi-track work).

Do **not** rely on root `STATUS.md` alone — use `CURRENT_STATE.md` instead.

**Blueprint is source of truth.** `.cursor/rules/*.mdc` and `.agents/skills/*` mirror blueprint — on conflict, blueprint wins.

## Builder playbook (mandatory)

| Topic | Blueprint file |
|-------|----------------|
| Hub | [BUILDER_GUIDE.md](./BUILDER_GUIDE.md) |
| How to build | [builder/how-to-build.md](./builder/how-to-build.md) |
| Taste & design | [builder/taste-and-design.md](./builder/taste-and-design.md) |
| How to test | [builder/how-to-test.md](./builder/how-to-test.md) |

## Navigation Pattern (Efficient Context Retrieval)

1. Read `CURRENT_STATE.md` + `BUILDER_GUIDE.md` + `INDEX.md`
2. Identify your track (see `multi-agent/tracks.md`)
3. Open the phase file for your current phase
4. Follow "Related Files" links at the top of every file
5. Schema/routes → `05-data-model.md` or `06-api-surface.md`
6. Production rules → `multi-agent/production-hardening.md` or `production/`

## Self-Updating Rules (STRICT — WITH EVERY CHANGE)

**MANDATORY:** Follow `multi-agent/self-updating-rules.md` **for every single code change**.

- Route, module, contract, screen, flow, or config change → patch blueprint + `CURRENT_STATE.md` + `INDEX.md` **in the same commit**.
- Never ship code-only deltas that make blueprint stale.
- Primary places: 05-data-model, 06-api-surface, 07/08/09, 10/11/12, CURRENT_STATE, INDEX, builder docs if build/test/taste rules change.

See full protocol in `multi-agent/self-updating-rules.md`.

## Goal Workflow (Mandatory — Every Goal)

**Canonical:** [builder/how-to-test.md](./builder/how-to-test.md) → links to [production/testing-flavours.md](./production/testing-flavours.md) + [goal-workflow.md](./production/goal-workflow.md).

Every bounded task is a **goal**:

1. **Build** — Many commits; wiring checklist ([how-to-build.md](./builder/how-to-build.md)); optional `FILTER=<pkg> pnpm verify:wip` or `RISK=native pnpm verify:wip`.
2. **Verify** — `FLAVOUR=<polish|wiring|feature|…> SCOPE=<area> pnpm verify:goal` **once**.
3. **Ship** — Milestone → `pnpm verify:full`.

## No Divergence Allowed

- All future work happens inside `blueprint/`.
- Old single-file blueprint and `.hermes/plans/` are removed.

This web lets agents load only relevant context while keeping the full picture via links. It supports parallel development with deterministic stitching.