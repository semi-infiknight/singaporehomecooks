# Agent Entry — Singapore Home Cooks

**This repository is maintained by AI agents only.**

## Canonical brain: `blueprint/`

Read in order:

1. [blueprint/README.md](./blueprint/README.md)
2. [blueprint/CURRENT_STATE.md](./blueprint/CURRENT_STATE.md)
3. [blueprint/AGENT_PLAYBOOK.md](./blueprint/AGENT_PLAYBOOK.md)
4. [blueprint/AGENTS.md](./blueprint/AGENTS.md)

Protocols: `blueprint/agent/build-protocol.md` · `design-taste.md` · `verify-protocol.md`

**On conflict:** blueprint wins over `.cursor/rules/`, skills, or prior chat.

## Quick verify

```bash
FLAVOUR=polish SCOPE=web pnpm verify:goal   # visual goal
FLAVOUR=wiring SCOPE=checkout pnpm verify:goal
pnpm verify:full                            # milestone only
```

## Subagent delegation

Pass subagents: goal name, `FLAVOUR`, `SCOPE`, and links to relevant blueprint section files. Subagents must self-update blueprint on completion.