# Builder Guide — How to Build, Taste, and Test SHC

**Related Files:**
- [builder/how-to-build.md](./builder/how-to-build.md)
- [builder/taste-and-design.md](./builder/taste-and-design.md)
- [builder/how-to-test.md](./builder/how-to-test.md)
- [CURRENT_STATE.md](./CURRENT_STATE.md)
- [AGENTS.md](./AGENTS.md)
- [INDEX.md](./INDEX.md)

**Last Updated:** 2026-07-08 — Canonical builder playbook (blueprint is source of truth; `.cursor/rules/` mirrors this).
**Audience:** Every human or AI builder working on Singapore Home Cooks.

---

## Read this after CURRENT_STATE

**Cold-start order:**

1. [INDEX.md](./INDEX.md) — table of contents
2. [CURRENT_STATE.md](./CURRENT_STATE.md) — what works today
3. **This file** — how to build, taste, test
4. [multi-agent/tracks.md](./multi-agent/tracks.md) — your track
5. Task-specific section (10-mobile, 06-api-surface, phase file, etc.)

`.cursor/rules/*.mdc` and `.agents/skills/*` **mirror** blueprint — if they conflict, **blueprint wins**.

---

## Era: polish-and-ship (in-repo only)

From here forward, work is **feature polish inside this monorepo**:

- New pages, flows, and UI refinement on customer app, cook app, web PWA
- Tri-platform parity (mobile-customer + mobile-cook + web)
- Railway-hosted Medusa backend (no local backend for clients)
- **Not** greenfield architecture, new repos, or stack swaps

Ship in **goals** (bounded slices). Build many commits; verify once with the right flavour.

---

## Three pillars (quick map)

| Pillar | Doc | One-line rule |
|--------|-----|---------------|
| **How to build** | [builder/how-to-build.md](./builder/how-to-build.md) | Wire every CTA to real hooks + `@shc/api-client`; Railway API only |
| **Taste & design** | [builder/taste-and-design.md](./builder/taste-and-design.md) | Gourmeat + Family Values; tri-platform sync; heritage voice |
| **How to test** | [builder/how-to-test.md](./builder/how-to-test.md) | `FLAVOUR` + `SCOPE` at goal close — strategic, not exhaustive |

---

## 60-second build loop

```
1. Name goal → pick FLAVOUR + SCOPE (how-to-test.md)
2. Read taste rules if UI (taste-and-design.md)
3. Build (many commits) — wiring checklist before each wiring commit
4. Goal close: FLAVOUR=* SCOPE=* pnpm verify:goal
5. Patch blueprint + CURRENT_STATE in same commit window
```

---

## Command cheat sheet

```bash
# Dev (all clients → Railway Medusa)
bash scripts/start-mobile-dev.sh    # Metro :8081 + :8082
pnpm web:dev                        # :3001 PWA

# Env (never localhost for clients)
pnpm env:sync

# Verify (see builder/how-to-test.md)
FLAVOUR=polish SCOPE=web pnpm verify:goal
FLAVOUR=wiring SCOPE=checkout pnpm verify:goal
pnpm verify:full                    # milestone only

# Native rebuild after RN dep change
bash scripts/rebuild-ios-apps.sh
```

Full list: [CURRENT_STATE.md §6](./CURRENT_STATE.md).

---

## Non-negotiables (all builders)

1. **Blueprint sync** — code + blueprint in same commit when behavior changes ([self-updating-rules.md](./multi-agent/self-updating-rules.md)).
2. **Railway-only clients** — no `localhost:9000` in client env ([builder/how-to-build.md](./builder/how-to-build.md)).
3. **No unwired UI** — if it renders, it must work on emulator ([builder/how-to-test.md](./builder/how-to-test.md) wiring checklist).
4. **Tri-platform** — `@shc/ui` / token changes hit web + both apps ([builder/taste-and-design.md](./builder/taste-and-design.md)).
5. **Strategic tests** — never per-commit Maestro/API smoke during a goal ([production/goal-workflow.md](./production/goal-workflow.md)).

---

## Where things live

| Topic | Blueprint home |
|-------|----------------|
| Routes & modules snapshot | [CURRENT_STATE.md](./CURRENT_STATE.md) |
| API contracts | [06-api-surface/06-api-surface.md](./06-api-surface/06-api-surface.md) |
| Data model | [05-data-model/05-data-model.md](./05-data-model/05-data-model.md) |
| Mobile routes | [10-mobile/10-mobile.md](./10-mobile/10-mobile.md) |
| UI library | [12-shared-components/12-shared-components.md](./12-shared-components/12-shared-components.md) |
| Monorepo layout | [04-monorepo/04-monorepo.md](./04-monorepo/04-monorepo.md) |
| Railway deploy | [03-railway/03-railway.md](./03-railway/03-railway.md) |
| Brand tokens (repo root) | `brand.md` |
| Testing depth | [production/testing-flavours.md](./production/testing-flavours.md) |
| Parallel agents | [multi-agent/README.md](./multi-agent/README.md) |