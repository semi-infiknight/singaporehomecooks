# Agent Playbook — Build, Taste, Verify

**Related Files:**
- [agent/build-protocol.md](./agent/build-protocol.md)
- [agent/design-taste.md](./agent/design-taste.md)
- [agent/verify-protocol.md](./agent/verify-protocol.md)
- [README.md](./README.md) — blueprint is canonical brain
- [CURRENT_STATE.md](./CURRENT_STATE.md)
- [AGENTS.md](./AGENTS.md)

**Session start:** Read [CURRENT_STATE.md §0](./CURRENT_STATE.md) only — single handoff; no historical stacks.

---

## Read after CURRENT_STATE

1. [INDEX.md](./INDEX.md) — knowledge map (navigation only)
2. **This playbook**
3. [multi-agent/tracks.md](./multi-agent/tracks.md) if parallel work
4. Task section (`10-mobile`, `06-api-surface`, …) — **not** phase files for live state

`.cursor/rules/` and `.agents/skills/` mirror blueprint — **blueprint wins**.

---

## Operating mode: polish-and-ship

- In-repo features on customer app, cook app, web PWA
- Tri-platform parity required for UI
- Railway Medusa for all clients (no localhost)
- Goals: many commits → one scoped verify
- **Least blast radius first** — [agent/build-protocol.md § NON-NEGOTIABLE](./agent/build-protocol.md): API/web/JS before native; no drive-by fixes in the same change

---

## Three protocols

| Protocol | Doc | Agent rule |
|----------|-----|------------|
| **Build** | [agent/build-protocol.md](./agent/build-protocol.md) | Wire CTA → hook → api-client; Railway only |
| **Taste** | [agent/design-taste.md](./agent/design-taste.md) | Gourmeat + Family Values; tri-platform |
| **Verify** | [agent/verify-protocol.md](./agent/verify-protocol.md) | `FLAVOUR` + `SCOPE` once per goal |

---

## 60-second agent loop

```
1. Name goal → FLAVOUR + SCOPE (verify-protocol.md)
2. UI work → read design-taste.md
3. Build (many commits) → wiring checklist per wiring commit
4. Goal close: FLAVOUR=* SCOPE=* pnpm verify:goal
5. Ship (if TOUCHES_API=1): git push origin main → CI green → Railway deploy → curl live route
6. Patch blueprint + CURRENT_STATE same commit window
```

---

## Commands

```bash
bash scripts/start-mobile-dev.sh   # :8081 + :8082 → Railway
pnpm web:dev                       # :3001 PWA
pnpm env:sync

FLAVOUR=polish SCOPE=web pnpm verify:goal
FLAVOUR=wiring SCOPE=checkout pnpm verify:goal
pnpm verify:full                   # milestone only
```

Full list: [CURRENT_STATE.md §6](./CURRENT_STATE.md).

---

## Non-negotiables

1. Blueprint sync on behavior change
2. Railway-only client backend
3. No unwired UI (must work on emulator)
4. Tri-platform on `@shc/ui` / token changes
5. No per-commit Maestro/API during goals

---

## Knowledge map

| Topic | File |
|-------|------|
| Live state | [CURRENT_STATE.md](./CURRENT_STATE.md) |
| APIs | [06-api-surface/06-api-surface.md](./06-api-surface/06-api-surface.md) |
| Mobile routes | [10-mobile/10-mobile.md](./10-mobile/10-mobile.md) |
| UI library | [12-shared-components/12-shared-components.md](./12-shared-components/12-shared-components.md) |
| Verify depth | [production/testing-flavours.md](./production/testing-flavours.md) |
| Subagents / stitch | [multi-agent/README.md](./multi-agent/README.md) |