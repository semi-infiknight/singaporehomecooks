# Blueprint — Canonical Agent Brain

**This repository is maintained by AI agents only.** Humans do not edit application code.

The `blueprint/` folder is the **single source of truth** for every agent and subagent working on Singapore Home Cooks. Code, cursor rules, and skills **mirror** blueprint — on conflict, **blueprint wins**.

## Agent cold-start (strict order)

1. [INDEX.md](./INDEX.md) — map of all knowledge
2. [CURRENT_STATE.md](./CURRENT_STATE.md) — what works today (integration reality)
3. [AGENT_PLAYBOOK.md](./AGENT_PLAYBOOK.md) — build, taste, verify protocols
4. [AGENTS.md](./AGENTS.md) — navigation + self-update rules
5. Task context: track → phase → section file

## Agent protocols (`agent/`)

| Protocol | File |
|----------|------|
| Build | [agent/build-protocol.md](./agent/build-protocol.md) |
| Design taste | [agent/design-taste.md](./agent/design-taste.md) |
| Verify | [agent/verify-protocol.md](./agent/verify-protocol.md) |

## Mirrors (not canonical)

- `.cursor/rules/*.mdc` — IDE reminders; must match blueprint
- `.agents/skills/*` — procedural helpers; must match blueprint
- Root `AGENTS.md` — pointer into this folder

## Agent obligations

1. **Goals** — bounded slices; batch build, batch verify ([agent/verify-protocol.md](./agent/verify-protocol.md))
2. **Wiring** — screen → hook → `@shc/api-client` → Medusa ([agent/build-protocol.md](./agent/build-protocol.md))
3. **Blueprint sync** — same commit as behavior changes ([multi-agent/self-updating-rules.md](./multi-agent/self-updating-rules.md))
4. **Tri-platform** — customer + cook + web parity on UI ([agent/design-taste.md](./agent/design-taste.md))

**Era:** polish-and-ship inside this monorepo — features, pages, refinement. No new repos or stack swaps.