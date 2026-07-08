# AGENTS.md — Agent Navigation (Blueprint Brain)

**This repo is agent-only.** The `blueprint/` folder is the canonical brain. You are an AI agent or subagent — read blueprint first, not tribal knowledge in chat.

**Start:** [README.md](./README.md) → [AGENT_PLAYBOOK.md](./AGENT_PLAYBOOK.md)

## Cold-start order

1. [INDEX.md](./INDEX.md) — knowledge map
2. [CURRENT_STATE.md](./CURRENT_STATE.md) — integration reality
3. [AGENT_PLAYBOOK.md](./AGENT_PLAYBOOK.md) — build, taste, verify
4. [AGENTS.md](./AGENTS.md) — this file
5. [multi-agent/README.md](./multi-agent/README.md) — if parallel / stitch work

Do **not** use root `STATUS.md` — use `CURRENT_STATE.md`.

**Hierarchy:** `blueprint/` > `.cursor/rules/` > `.agents/skills/` > chat context.

## Agent protocols

| Protocol | File |
|----------|------|
| Build | [agent/build-protocol.md](./agent/build-protocol.md) |
| Design taste | [agent/design-taste.md](./agent/design-taste.md) |
| Verify | [agent/verify-protocol.md](./agent/verify-protocol.md) |

## Context retrieval

1. `CURRENT_STATE.md` + `AGENT_PLAYBOOK.md` + `INDEX.md`
2. Track: [multi-agent/tracks.md](./multi-agent/tracks.md)
3. Phase file under `13-implementation-phases/`
4. Schema/routes: `05-data-model.md`, `06-api-surface.md`
5. Production: `production/`, `multi-agent/production-hardening.md`

## Self-update (every code change)

[multi-agent/self-updating-rules.md](./multi-agent/self-updating-rules.md) — patch blueprint + `CURRENT_STATE.md` + `INDEX.md` in the **same commit** as code.

## Goal workflow (every task)

1. **Build** — many commits; [agent/build-protocol.md](./agent/build-protocol.md) wiring checklist
2. **Verify** — `FLAVOUR=* SCOPE=* pnpm verify:goal` once — [agent/verify-protocol.md](./agent/verify-protocol.md)
3. **Ship** — milestone: `pnpm verify:full`

Optional mid-build: `FILTER=<pkg> pnpm verify:wip` or `RISK=native pnpm verify:wip`.

## No divergence

All knowledge lives in `blueprint/`. Code comments point here. Cursor rules mirror here.